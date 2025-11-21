from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import allow_roles

router = APIRouter(prefix="/sales-orders", tags=["Sales Orders"])


@router.post("/", response_model=schemas.SalesOrderResponse, dependencies=[Depends(allow_roles("manager","admin"))] )
def create_sales_order(order_data: schemas.SalesOrderCreate, db: Session = Depends(get_db)):
    # Prevent duplication
    if db.query(models.SalesOrder).filter_by(order_number=order_data.order_number).first():
        raise HTTPException(status_code=400, detail="Order number already exists.")

    order = models.SalesOrder(
        order_number=order_data.order_number,
        customer=order_data.customer,
        notes=order_data.notes,
    )
    db.add(order)
    db.flush()  # ensures ID before adding items

    for item in order_data.items:
        new_item = models.SalesOrderItem(
            sales_order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(new_item)

    db.commit()
    db.refresh(order)
    return order


@router.get("/", response_model=list[schemas.SalesOrderResponse], dependencies=[Depends(allow_roles("manager","admin","viewer"))] )
def list_sales_orders(db: Session = Depends(get_db)):
    return db.query(models.SalesOrder).all()


@router.get("/{order_id}", response_model=schemas.SalesOrderResponse, dependencies=[Depends(allow_roles("manager","admin","viewer"))] )
def get_sales_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.SalesOrder).filter_by(id=order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Sales order not found")
    return order
