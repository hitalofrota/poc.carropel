# router_products.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(
    prefix="/products",
    tags=["Products"],
    dependencies=[Depends(get_current_user)]
)

# ➕ Add subproduct (child product)
@router.post("/{parent_product_id}/subproducts", response_model=schemas.ProductResponse)
def add_subproduct(
    parent_product_id: int,
    subproduct_data: schemas.ProductCreate,
    db: Session = Depends(get_db)
):
    parent_product = db.query(models.Product).filter(models.Product.id == parent_product_id).first()
    if not parent_product:
        raise HTTPException(status_code=404, detail="Parent product not found")

    new_subproduct = models.Product(
        name=subproduct_data.name,
        code=subproduct_data.code,
        description=subproduct_data.description,
        unit_measure_id=subproduct_data.unit_measure_id,
        unit_cost=subproduct_data.unit_cost,
        parent_product_id=parent_product_id  # 🔹 links to parent product
    )

    db.add(new_subproduct)
    db.commit()
    db.refresh(new_subproduct)

    return new_subproduct


@router.post("/{parent_product_id}/subproducts/{subproduct_id}", response_model=schemas.ProductResponse)
def link_existing_subproduct(
    parent_product_id: int,
    subproduct_id: int,
    db: Session = Depends(get_db)
):
    # Find parent product
    parent_product = db.query(models.Product).filter(models.Product.id == parent_product_id).first()
    if not parent_product:
        raise HTTPException(status_code=404, detail="Parent product not found")

    # Find the product that will become the subproduct
    subproduct = db.query(models.Product).filter(models.Product.id == subproduct_id).first()
    if not subproduct:
        raise HTTPException(status_code=404, detail="Child product not found")

    # Prevent cycles (a product cannot be a subproduct of itself)
    if parent_product_id == subproduct_id:
        raise HTTPException(status_code=400, detail="A product cannot be a subproduct of itself")

    # Update parent-child relationship
    subproduct.parent_product_id = parent_product_id

    db.commit()
    db.refresh(subproduct)

    return subproduct


@router.get("/{parent_product_id}/subproducts", response_model=list[schemas.ProductResponse])
def list_subproducts(parent_product_id: int, db: Session = Depends(get_db)):
    parent_product = db.query(models.Product).filter(models.Product.id == parent_product_id).first()
    if not parent_product:
        raise HTTPException(status_code=404, detail="Parent product not found")

    return parent_product.subproducts
