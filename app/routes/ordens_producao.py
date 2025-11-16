from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user, allow_roles
from datetime import datetime

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


@router.delete("/{order_id}", dependencies=[Depends(allow_roles("manager","admin"))])
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.ProductionOrder).filter(models.ProductionOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Production order not found")

    db.delete(order)
    db.commit()
    return {"detail": "Order successfully deleted"}
