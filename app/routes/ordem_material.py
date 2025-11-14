from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(
    prefix="/orders",
    tags=["Order-Material"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/{order_id}/materials", response_model=schemas.ProductionOrderResponse)
def add_material_to_order(
    order_id: int,
    material_data: schemas.OrderMaterialCreate,
    db: Session = Depends(get_db)
):
    order = db.query(models.ProductionOrder).filter(models.ProductionOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Production order not found")

    material = db.query(models.Material).filter(models.Material.id == material_data.material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    # Check if this link already exists
    existing = (
        db.query(models.MaterialOrder)
        .filter_by(order_id=order_id, material_id=material_data.material_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Material already linked to this order")

    new_link = models.MaterialOrder(
        order_id=order_id,
        material_id=material_data.material_id,
        quantity_used=material_data.quantity_used
    )

    db.add(new_link)
    db.commit()
    db.refresh(order)
    return order


# 🔍 List all materials of an order
@router.get("/{order_id}/materials", response_model=list[schemas.MaterialResponse])
def list_order_materials(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.ProductionOrder).filter(models.ProductionOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Production order not found")

    return [om.material for om in order.used_materials]
