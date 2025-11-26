from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user, allow_roles
from datetime import datetime
import re

router = APIRouter(
    prefix="/orders",
    tags=["Production Orders"],
    dependencies=[Depends(get_current_user)]
)

@router.post("/", response_model=schemas.ProductionOrderResponse, dependencies=[Depends(allow_roles("manager","admin"))])
def create_order(order: schemas.ProductionOrderCreate, db: Session = Depends(get_db)):
    existing_code = db.query(models.ProductionOrder).filter(models.ProductionOrder.code == order.code).first()
    if existing_code:
        raise HTTPException(status_code=400, detail="Order code already exists")

    product = db.query(models.Product).filter(models.Product.id == order.product_id).first()
    if not product:
        raise HTTPException(status_code=400, detail="Product not found")

    new_order = models.ProductionOrder(
        code=order.code,
        product_id=order.product_id,
        planned_quantity=order.planned_quantity,
        status=order.status,
        notes=order.notes,
        creation_date=datetime.utcnow()
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order

def generate_order_code(db: Session, sales_order_number: str, product_id: int) -> str:
    prefix = f"PO-{sales_order_number}-{product_id}-"

    # Busca ordens do mesmo tipo
    existing_orders = (
        db.query(models.ProductionOrder.code)
        .filter(models.ProductionOrder.code.like(f"{prefix}%"))
        .all()
    )

    # Se já existem ordens, extrair última parte do código
    seq_numbers = []
    for (code,) in existing_orders:
        m = re.match(rf"{prefix}(\d+)$", code)
        if m:
            seq_numbers.append(int(m.group(1)))

    next_seq = (max(seq_numbers) + 1) if seq_numbers else 1

    return f"{prefix}{next_seq}"

@router.post(
    "/from-sales-order/{sales_order_id}",
    response_model=list[schemas.ProductionOrderResponse],
    dependencies=[Depends(allow_roles("manager", "admin"))]
)
def create_orders_from_sales_order(
    sales_order_id: int,
    db: Session = Depends(get_db)
):
    sales_order = db.query(models.SalesOrder).filter_by(id=sales_order_id).first()
    if not sales_order:
        raise HTTPException(status_code=404, detail="Sales order not found")

    created_orders_response: list[dict] = []  # vamos montar a resposta manualmente

    # ---------- helper para gerar código único ----------
    def generate_order_code(order_number: str, product_id: int) -> str:
        prefix = f"PO-{order_number}-{product_id}-"
        existing_codes = db.query(models.ProductionOrder.code).filter(
            models.ProductionOrder.code.like(f"{prefix}%")
        ).all()
        seq_numbers = []
        for (code,) in existing_codes:
            try:
                seq = int(code.split("-")[-1])
                seq_numbers.append(seq)
            except Exception:
                pass
        next_seq = (max(seq_numbers) + 1) if seq_numbers else 1
        return f"{prefix}{next_seq}"

    # ---------- função recursiva que cria OPs e monta o dict de resposta ----------
    def create_order_recursive(product_id: int, quantity: float, visited: set):
        # prevenção de ciclos
        if product_id in visited:
            return None
        visited = visited | {product_id}

        product = db.query(models.Product).filter_by(id=product_id).first()
        if not product:
            return None

        po_code = generate_order_code(sales_order.order_number, product_id)

        # cria ProductionOrder no DB
        po = models.ProductionOrder(
            code=po_code,
            product_id=product_id,
            planned_quantity=quantity,
            sales_order_id=sales_order_id,
            status=models.ProductionOrderStatus.planned,
            created_at=datetime.utcnow(),
            notes=f"Auto-generated from Sales Order {sales_order.order_number}"
        )
        db.add(po)
        db.flush()  # garante que po.id exista

        # carregar BOM children (leitura) e calcular effective_quantity localmente
        bom_children = db.query(models.ProductBOM).filter_by(parent_id=product_id).all()

        # montar lista de bom_children serializável com effective_quantity
        bom_children_serialized = []
        for bom in bom_children:
            bom_children_serialized.append({
                "id": bom.id,
                "parent_id": bom.parent_id,
                "child_id": bom.child_id,
                "quantity": bom.quantity,
                "effective_quantity": bom.quantity * quantity,
                "level_code": getattr(bom, "level_code", None),
                "order": getattr(bom, "order", None),
            })

        # montar produto serializável com bom_children (não tocamos na DB)
        product_serialized = {
            "name": product.name,
            "code": product.code,
            "description": product.description,
            "unit_cost": product.unit_cost,
            "unit_price": product.unit_price,
            "net_weight": product.net_weight,
            "gross_weight": product.gross_weight,
            "id": product.id,
            "bom_children": bom_children_serialized,
            "bom_parent": []  # se quiser pode popular similarmente
        }

        # montar o dict da ProductionOrder que respeita seu schema de response
        po_dict = {
            "code": po.code,
            "product_id": po.product_id,
            "planned_quantity": po.planned_quantity,
            "status": po.status,
            "notes": po.notes,
            "id": po.id,
            "created_at": po.created_at,
            "start_date": po.start_date,
            "end_date": po.end_date,
            "product": product_serialized,
            "used_materials": [],  # ajuste se você tiver materiais
        }

        created_orders_response.append(po_dict)

        # recursão nos filhos
        for bom in bom_children:
            child_qty = quantity * bom.quantity
            create_order_recursive(product_id=bom.child_id, quantity=child_qty, visited=visited)

        return po

    # ---------- criar OPs raiz para cada item do SalesOrder ----------
    for item in sales_order.items:
        create_order_recursive(product_id=item.product_id, quantity=item.quantity, visited=set())

    # persistir tudo (orders criadas)
    db.commit()

    # retornar a lista de dicts — Pydantic converterá para ProductionOrderResponse
    return created_orders_response


@router.get("/", response_model=list[schemas.ProductionOrderResponse], dependencies=[Depends(allow_roles("manager","admin","viewer"))])
def list_orders(db: Session = Depends(get_db)):
    return db.query(models.ProductionOrder).all()


@router.get("/{order_id}", response_model=schemas.ProductionOrderResponse, dependencies=[Depends(allow_roles("manager","admin","viewer"))])
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.ProductionOrder).filter(models.ProductionOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Production order not found")
    return order


@router.put("/{order_id}", response_model=schemas.ProductionOrderResponse, dependencies=[Depends(allow_roles("manager","admin"))])
def update_order(order_id: int, order_update: schemas.ProductionOrderUpdate, db: Session = Depends(get_db)):
    order = db.query(models.ProductionOrder).filter(models.ProductionOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Production order not found")

    for key, value in order_update.dict(exclude_unset=True).items():
        setattr(order, key, value)

    db.commit()
    db.refresh(order)
    return order

@router.delete(
    "/delete-planned",
    dependencies=[Depends(allow_roles("manager", "admin"))]
)
def delete_all_planned_orders(db: Session = Depends(get_db)):

    deleted = (
        db.query(models.ProductionOrder)
        .filter(models.ProductionOrder.status == models.ProductionOrderStatus.planned)
        .delete(synchronize_session=False)
    )

    db.commit()

    return {
        "deleted_orders": deleted,
        "message": f"{deleted} planned production orders deleted successfully"
    }

@router.delete("/{order_id}", dependencies=[Depends(allow_roles("manager","admin"))])
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.ProductionOrder).filter(models.ProductionOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Production order not found")

    db.delete(order)
    db.commit()
    return {"detail": "Order successfully deleted"}



