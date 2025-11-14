from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(
    prefix="/products",
    tags=["Product-Material"],
    dependencies=[Depends(get_current_user)]
)

# ➕ Add material to a product
@router.post("/{product_id}/materials", response_model=schemas.ProductMaterialResponse)
def add_material_to_product(
    product_id: int,
    material_data: schemas.ProductMaterialCreate,
    db: Session = Depends(get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    material = db.query(models.Material).filter(models.Material.id == material_data.material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    # Check for duplicates
    existing = (
        db.query(models.ProductMaterial)
        .filter_by(product_id=product_id, material_id=material_data.material_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Material already linked to this product")

    new_link = models.ProductMaterial(
        product_id=product_id,
        material_id=material_data.material_id,
        quantity=material_data.quantity
    )

    db.add(new_link)
    db.commit()
    db.refresh(new_link)

    # 🔹 Structured return as expected by the test
    return {
        "id": new_link.id,
        "product_id": product_id,
        "material_id": material.id,
        "quantity": new_link.quantity,
        "material": {
            "id": material.id,
            "name": material.name,
            "code": material.code
        }
    }


# 🔍 List materials of a product
@router.get("/{product_id}/materials", response_model=list[schemas.ProductMaterialResponse])
def list_product_materials(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return product.materials
