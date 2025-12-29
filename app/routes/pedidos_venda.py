from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import allow_roles

router = APIRouter(prefix="/sales-orders", tags=["Sales Orders"])


@router.post("/", response_model=schemas.SalesOrderResponse, dependencies=[Depends(allow_roles("manager","admin"))])
def create_sales_order(order_data: schemas.SalesOrderCreate, db: Session = Depends(get_db)):

    if db.query(models.SalesOrder).filter_by(order_number=order_data.order_number).first():
        raise HTTPException(status_code=400, detail="Order number already exists.")

    order = models.SalesOrder(
        order_number=order_data.order_number,
        customer=order_data.customer,
        notes=order_data.notes,
        delivery_date=order_data.delivery_date
    )
    db.add(order)
    db.flush()

    for item in order_data.items:

        item_delivery = item.delivery_date or order_data.delivery_date

        if item_delivery and order_data.delivery_date and item_delivery > order_data.delivery_date:
            raise HTTPException(
                status_code=400,
                detail=f"Item delivery date ({item_delivery}) cannot be later than order delivery date ({order_data.delivery_date})."
            )

        new_item = models.SalesOrderItem(
            sales_order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            delivery_date=item_delivery
        )
        db.add(new_item)

    db.commit()
    db.refresh(order)
    return order

@router.put("/{order_id}", response_model=schemas.SalesOrderResponse,
            dependencies=[Depends(allow_roles("manager", "admin"))])
def update_sales_order(
    order_id: int,
    order_data: schemas.SalesOrderCreate,
    db: Session = Depends(get_db)
):
    order = db.query(models.SalesOrder).get(order_id)

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Atualiza cabeçalho
    order.order_number = order_data.order_number
    order.customer = order_data.customer
    order.notes = order_data.notes
    order.delivery_date = order_data.delivery_date

    # REMOVE ITENS ANTIGOS
    db.query(models.SalesOrderItem)\
      .filter_by(sales_order_id=order.id)\
      .delete()

    # INSERE ITENS NOVOS
    for item in order_data.items:
        item_delivery = item.delivery_date or order_data.delivery_date

        if (
            item_delivery
            and order_data.delivery_date
            and item_delivery > order_data.delivery_date
        ):
            raise HTTPException(
                status_code=400,
                detail="Item delivery date cannot be later than order delivery date"
            )

        db.add(models.SalesOrderItem(
            sales_order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            delivery_date=item_delivery
        ))

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

@router.delete(
    "/{order_id}",
    status_code=204,
    dependencies=[Depends(allow_roles("manager","admin"))]
)
def delete_sales_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.SalesOrder).filter(models.SalesOrder.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Sales order not found")

    db.query(models.SalesOrderItem).filter(
        models.SalesOrderItem.sales_order_id == order_id
    ).delete()


    db.delete(order)
    db.commit()

    return None
