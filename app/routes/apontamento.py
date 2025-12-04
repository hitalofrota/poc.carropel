from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from datetime import datetime

from app.models import ProductionOrderStatus

router = APIRouter(prefix="/production-orders", tags=["production_orders"])


# ==========================================================
# APONTAMENTO DE OPERAÇÃO DA ORDEM DE PRODUÇÃO
# ==========================================================
@router.put("/{order_id}/operations/{operation_id}/pointing",
            response_model=schemas.OperationPointingResponse)
def pointing_operation(
    order_id: int,
    operation_id: int,
    data: schemas.OperationPointingCreate,
    db: Session = Depends(get_db)
):

    # -------------------------------------
    # 1. Buscar ordem
    # -------------------------------------
    order = db.query(models.ProductionOrder).filter(
        models.ProductionOrder.id == order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ordem de produção não encontrada"
        )

    # -------------------------------------
    # 2. Buscar operação da ordem
    # -------------------------------------
    operation = db.query(models.ProductionOrderOperation).filter(
        models.ProductionOrderOperation.id == operation_id,
        models.ProductionOrderOperation.production_order_id == order_id
    ).first()

    if not operation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Operação não encontrada para esta ordem"
        )

    # -------------------------------------
    # 3. Regras de apontamento
    # -------------------------------------

    # Evitar reiniciar operação já iniciada
    if data.actual_start and operation.actual_start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta operação já possui início registrado"
        )

    # Evitar encerrar antes de iniciar
    if data.actual_end and not (operation.actual_start or data.actual_start):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível encerrar uma operação que ainda não iniciou"
        )

    # Evitar finalizar novamente
    if data.actual_end and operation.actual_end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta operação já foi encerrada"
        )

    # Evitar ultrapassar quantidade planejada (opcional)
    if data.produced_quantity and operation.planned_quantity:
        if data.produced_quantity > operation.planned_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantidade produzida não pode exceder a planejada"
            )

    # -------------------------------------
    # 4. Atualizar campos
    # -------------------------------------
    if data.actual_operation_id:
        operation.actual_operation_id = data.actual_operation_id

    if data.actual_work_center_id:
        operation.actual_work_center_id = data.actual_work_center_id

    if data.actual_machine_id:
        operation.actual_machine_id = data.actual_machine_id

    if data.actual_start:
        operation.actual_start = data.actual_start

    if data.actual_end:
        operation.actual_end = data.actual_end

    if data.produced_quantity:
        operation.produced_quantity = data.produced_quantity

    db.commit()
    db.refresh(operation)

    return operation

router = APIRouter(prefix="/production-orders", tags=["production_orders"])

def close_order_recursive(order: models.ProductionOrder, db: Session, closed: set[int]):
    if order.id in closed:
        return

    closed.add(order.id)

    # fecha esta ordem
    order.status = "finished"
    order.end_date = datetime.utcnow()

    # pega o produto da ordem
    product = order.product

    # pega os BOM children
    bom_children = db.query(models.ProductBOM).filter_by(parent_id=product.id).all()

    for bom in bom_children:
        # buscar SEMPRE uma ordem filha correspondente ao mesmo sales_order_id
        child_order = db.query(models.ProductionOrder).filter_by(
            product_id=bom.child_id,
            sales_order_id=order.sales_order_id
        ).first()

        if child_order:
            close_order_recursive(child_order, db, closed)

@router.post("/{order_id}/close")
def close_production_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.ProductionOrder).filter(models.ProductionOrder.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    closed = set()
    close_order_recursive(order, db, closed)

    db.commit()
    return {"message": f"Order {order_id} and all its children were closed"}

def start_order_recursive(order: models.ProductionOrder, start_date: datetime, db: Session, visited: set[int]):
    if order.id in visited:
        return

    visited.add(order.id)

    # Só altera se ela ainda não estiver em produção ou finalizada
    if order.status == ProductionOrderStatus.planned:
        order.status = ProductionOrderStatus.in_production
        order.start_date = start_date

    product = order.product

    # pega os filhos do BOM
    bom_children = db.query(models.ProductBOM).filter_by(parent_id=product.id).all()

    for bom in bom_children:
        # pegar ordem filha correspondente ao mesmo sales_order_id
        child_order = db.query(models.ProductionOrder).filter_by(
            product_id=bom.child_id,
            sales_order_id=order.sales_order_id
        ).first()

        if child_order:
            start_order_recursive(child_order, start_date, db, visited)

@router.post("/{order_id}/start")
def start_production_order(
    order_id: int,
    body: schemas.StartProductionRequest = None,
    db: Session = Depends(get_db)
):
    order = db.query(models.ProductionOrder).filter(models.ProductionOrder.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Se não mandou body, cria um vazio
    if body is None:
        body = schemas.StartProductionRequest()

    # Usa a data enviada ou agora
    start_date = body.start_date or datetime.utcnow()

    visited = set()
    start_order_recursive(order, start_date, db, visited)

    db.commit()
    return {
        "message": f"Order {order_id} and its children were moved to in_production.",
        "start_date_used": start_date
    }

def apply_production(order: models.ProductionOrder, quantity: float):
    # Não pode apontar se finished
    if order.status == ProductionOrderStatus.finished:
        raise HTTPException(
            status_code=400,
            detail="Não é possível apontar produção em uma ordem já finalizada."
        )

    # Se está planned → muda para in_production e marca start_date
    if order.status == ProductionOrderStatus.planned:
        order.status = ProductionOrderStatus.in_production
        order.start_date = datetime.utcnow()

    # Resultado da soma
    new_total = order.produced_quantity + quantity

    # Não pode ultrapassar o planejado
    if new_total > order.planned_quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Produção total ({new_total}) maior que a quantidade planejada ({order.planned_quantity})."
        )

    # Atualiza produção
    order.produced_quantity = new_total

    # Se atingiu o total → finaliza
    if new_total == order.planned_quantity:
        order.status = ProductionOrderStatus.finished
        order.end_date = datetime.utcnow()

    return new_total

@router.post("/{order_id}/produce")
def add_production(
    order_id: int,
    data: schemas.ProductionQuantityUpdate,
    db: Session = Depends(get_db)
):
    order = db.query(models.ProductionOrder).filter_by(id=order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Ordem não encontrada.")

    new_total = apply_production(order, data.quantity)

    db.commit()
    db.refresh(order)

    return {
        "message": "Produção apontada com sucesso.",
        "order_id": order.id,
        "produced_now": data.quantity,
        "total_produced": new_total,
        "status": order.status,
        "start_date": order.start_date,
        "end_date": order.end_date,
    }
