from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user, allow_roles
from datetime import datetime, date
import re
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
)
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from io import BytesIO

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

def formatar_data(data_iso):
    if not data_iso:
        return "-"
    return datetime.fromisoformat(data_iso).strftime("%d/%m/%Y %H:%M")

def generate_production_order_pdf(order: dict) -> bytes:
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    elements = []

    # ====== ESTILOS CUSTOM ======
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        alignment=TA_CENTER,
        fontSize=18,
        spaceAfter=20,
    )

    section_style = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontSize=13,
        spaceBefore=16,
        spaceAfter=8,
    )

    label_style = ParagraphStyle(
        "Label",
        parent=styles["Normal"],
        fontSize=10,
        spaceAfter=4,
    )

    # ====== TÍTULO ======
    elements.append(Paragraph("ORDEM DE PRODUÇÃO", title_style))

    # ====== DADOS DA ORDEM ======
    elements.append(Paragraph("Dados da Ordem", section_style))

    elements.append(Paragraph(f"<b>Código:</b> {order['code']}", label_style))
    elements.append(Paragraph(
        f"<b>Produto:</b> {order['product']['name']}", label_style
    ))
    elements.append(Paragraph(
        f"<b>Quantidade Planejada:</b> {order['planned_quantity']}", label_style
    ))
    elements.append(Paragraph(
        f"<b>Status:</b> {order['status']}", label_style
    ))

    if order.get("start_date"):
        elements.append(
            Paragraph(f"<b>Data Início:</b> {order['start_date']}", label_style)
        )

    if order.get("end_date"):
        elements.append(
            Paragraph(f"<b>Data Fim:</b> {order['end_date']}", label_style)
        )

    # ====== PEDIDO DE VENDA ======
    sales_order = order.get("sales_order")
    if sales_order:
        elements.append(Spacer(1, 12))
        elements.append(Paragraph("Pedido de Venda", section_style))

        elements.append(
            Paragraph(f"<b>Código:</b> {sales_order.get('code')}", label_style)
        )
        elements.append(
            Paragraph(f"<b>Cliente:</b> {sales_order.get('customer_name')}", label_style)
        )
        elements.append(
            Paragraph(f"<b>Data:</b> {sales_order.get('created_at')}", label_style)
        )

        if sales_order.get("notes"):
            elements.append(
                Paragraph(f"<b>Observações:</b> {sales_order['notes']}", label_style)
            )

    # ====== BOM / FILHOS ======
    elements.append(Spacer(1, 16))
    elements.append(Paragraph("Estrutura do Produto (BOM)", section_style))

    table_data = [
        [
            "Ordem Filho",
            "Produto Filho",
            "Qtd Base",
            "Qtd Efetiva",
        ]
    ]

    for child in order["product"]["bom_children"]:
        table_data.append([
            child["production_order_code"],
            f"Produto ID {child['child_id']}",
            str(child["quantity"]),
            str(child["effective_quantity"]),
        ])

    table = Table(table_data, colWidths=[110, 180, 80, 80])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (2, 1), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
    ]))

    elements.append(table)

    # ====== RODAPÉ ======
    elements.append(Spacer(1, 24))
    elements.append(
        Paragraph(
            f"Documento gerado em {datetime.now().strftime('%d/%m/%Y %H:%M')}",
            styles["Italic"],
        )
    )

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()


@router.post("/pdf")
def gerar_pdf_ordem_producao(op: dict):
    pdf_bytes = generate_production_order_pdf(op)

    filename = f"ordem_producao_{op['code']}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

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

    created_orders_response: list[dict] = []

    # mapa para acessar OPs já criadas
    po_map: dict[int, models.ProductionOrder] = {}

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

        # produto
        product = db.query(models.Product).filter_by(id=product_id).first()
        if not product:
            return None

        # verifica se esta ordem já foi criada na recursão
        if product_id in po_map:
            return po_map[product_id]

        # criar código
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
        db.flush()  # agora po.id existe

        # registra no mapa
        po_map[product_id] = po

        # carregar BOM children
        bom_children = db.query(models.ProductBOM).filter_by(parent_id=product_id).all()

        # ---- criar filhos primeiro (para podermos referenciar seus PO codes) ----
        for bom in bom_children:
            child_qty = quantity * bom.quantity
            create_order_recursive(
                product_id=bom.child_id,
                quantity=child_qty,
                visited=visited
            )

        # ---------- montar serialização dos children (incluindo ordem do filho) ----------
        bom_children_serialized = []
        for bom in bom_children:
            child_po = po_map.get(bom.child_id)  # já criado acima

            bom_children_serialized.append({
                "id": bom.id,
                "parent_id": bom.parent_id,
                "child_id": bom.child_id,
                "quantity": bom.quantity,
                "effective_quantity": bom.quantity * quantity,
                "level_code": getattr(bom, "level_code", None),
                "order": getattr(bom, "order", None),
                "production_order_id": child_po.id if child_po else None,
                "production_order_code": child_po.code if child_po else None
            })

        # ---------- montar lista de bom_parent (quem usa este como componente) ----------
        bom_parents = db.query(models.ProductBOM).filter_by(child_id=product_id).all()
        bom_parent_serialized = []
        for bom in bom_parents:
            parent_po = po_map.get(bom.parent_id)  # pai já existe na recursão

            bom_parent_serialized.append({
                "id": bom.id,
                "parent_id": bom.parent_id,
                "child_id": bom.child_id,
                "quantity": bom.quantity,
                "level_code": getattr(bom, "level_code", None),
                "order": getattr(bom, "order", None),
                "production_order_id": parent_po.id if parent_po else None,
                "production_order_code": parent_po.code if parent_po else None
            })

        # ---------- serialização do produto ----------
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
            "bom_parent": bom_parent_serialized
        }

        # ---------- serialização final da OP ----------
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
            "used_materials": [],
        }

        created_orders_response.append(po_dict)

        return po

    # ---------- criar OPs raiz ----------
    for item in sales_order.items:
        create_order_recursive(
            product_id=item.product_id,
            quantity=item.quantity,
            visited=set()
        )

    # persistir tudo
    db.commit()

    return created_orders_response

def serialize_production_order(po: models.ProductionOrder, db: Session):
    product = po.product

    # carregar BOM children
    bom_children = db.query(models.ProductBOM).filter_by(parent_id=product.id).all()
    bom_children_serialized = []

    for bom in bom_children:
        # tentar encontrar uma order criada para o filho
        child_po = db.query(models.ProductionOrder).filter_by(
            product_id=bom.child_id,
            sales_order_id=po.sales_order_id
        ).first()

        bom_children_serialized.append({
            "id": bom.id,
            "parent_id": bom.parent_id,
            "child_id": bom.child_id,
            "quantity": bom.quantity,
            "effective_quantity": bom.quantity * po.planned_quantity,
            "level_code": getattr(bom, "level_code", None),
            "order": getattr(bom, "order", None),
            "production_order_id": child_po.id if child_po else None,
            "production_order_code": child_po.code if child_po else None
        })

    # carregar BOM parents
    bom_parents = db.query(models.ProductBOM).filter_by(child_id=product.id).all()
    bom_parent_serialized = []

    for bom in bom_parents:
        parent_po = db.query(models.ProductionOrder).filter_by(
            product_id=bom.parent_id,
            sales_order_id=po.sales_order_id
        ).first()

        bom_parent_serialized.append({
            "id": bom.id,
            "parent_id": bom.parent_id,
            "child_id": bom.child_id,
            "quantity": bom.quantity,
            "level_code": getattr(bom, "level_code", None),
            "order": getattr(bom, "order", None),
            "production_order_id": parent_po.id if parent_po else None,
            "production_order_code": parent_po.code if parent_po else None
        })

    return {
        "code": po.code,
        "product_id": po.product_id,
        "planned_quantity": po.planned_quantity,
        "produced_quantity":po.produced_quantity,
        "status": po.status,
        "notes": po.notes,
        "id": po.id,
        "created_at": po.created_at,
        "start_date": po.start_date,
        "end_date": po.end_date,
        "product": {
            "name": product.name,
            "code": product.code,
            "description": product.description,
            "unit_cost": product.unit_cost,
            "unit_price": product.unit_price,
            "net_weight": product.net_weight,
            "gross_weight": product.gross_weight,
            "id": product.id,
            "bom_children": bom_children_serialized,
            "bom_parent": bom_parent_serialized,
        },
        "used_materials": [],
        "effective_bom": []
    }


@router.get("/", response_model=list[schemas.ProductionOrderResponse])
def list_orders(db: Session = Depends(get_db)):
    orders = db.query(models.ProductionOrder).all()
    return [serialize_production_order(po, db) for po in orders]


@router.get("/{order_id}", response_model=schemas.ProductionOrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    po = db.query(models.ProductionOrder).filter_by(id=order_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Production order not found")
    return serialize_production_order(po, db)

from datetime import date

@router.put(
    "/{order_id}",
    response_model=schemas.ProductionOrderResponse,
    dependencies=[Depends(allow_roles("manager", "admin"))]
)
def update_order(
    order_id: int,
    order_update: schemas.ProductionOrderUpdate,
    db: Session = Depends(get_db)
):
    order = (
        db.query(models.ProductionOrder)
        .filter(models.ProductionOrder.id == order_id)
        .first()
    )

    if not order:
        raise HTTPException(status_code=404, detail="Production order not found")

    data = order_update.dict(exclude_unset=True)

    for key, value in data.items():
        setattr(order, key, value)

    if "start_date" not in data and order.start_date is None:
        order.start_date = date.today()

    if order.status == schemas.ProductionOrderStatus.planned:
        has_movement = (
            (order.produced_quantity is not None and order.produced_quantity > 0)
            or order.start_date is not None
        )

        if has_movement:
            order.status = schemas.ProductionOrderStatus.in_production

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

@router.delete(
    "/delete-finished",
    dependencies=[Depends(allow_roles("manager", "admin"))]
)
def delete_all_finished_orders(db: Session = Depends(get_db)):

    deleted = (
        db.query(models.ProductionOrder)
        .filter(models.ProductionOrder.status == models.ProductionOrderStatus.finished)
        .delete(synchronize_session=False)
    )

    db.commit()

    return {
        "deleted_orders": deleted,
        "message": f"{deleted} finished production orders deleted successfully"
    }

@router.delete(
    "/delete-in_production",
    dependencies=[Depends(allow_roles("manager", "admin"))]
)
def delete_all_in_production_orders(db: Session = Depends(get_db)):

    deleted = (
        db.query(models.ProductionOrder)
        .filter(models.ProductionOrder.status == models.ProductionOrderStatus.in_production)
        .delete(synchronize_session=False)
    )

    db.commit()

    return {
        "deleted_orders": deleted,
        "message": f"{deleted} in_production production orders deleted successfully"
    }


@router.delete("/{order_id}", dependencies=[Depends(allow_roles("manager","admin"))])
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.ProductionOrder).filter(models.ProductionOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Production order not found")

    db.delete(order)
    db.commit()
    return {"detail": "Order successfully deleted"}



