from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user, allow_roles

router = APIRouter(
    prefix="/products",
    tags=["Products"],
    dependencies=[Depends(get_current_user)]
)

@router.post("/", response_model=schemas.ProductResponse, dependencies=[Depends(allow_roles("manager","admin"))] )
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    existing_code = db.query(models.Product).filter(models.Product.code == product.code).first()
    if existing_code:
        raise HTTPException(status_code=400, detail="Product code already exists")

    if product.parent_product_id:
        parent = db.query(models.Product).filter(models.Product.id == product.parent_product_id).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Parent product not found")

    new_product = models.Product(**product.dict(exclude_unset=True))
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


@router.get("/", response_model=list[schemas.ProductResponse], dependencies=[Depends(allow_roles("manager","admin","viewer"))] )
def list_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()


@router.get("/{product_id}", response_model=schemas.ProductResponse, dependencies=[Depends(allow_roles("manager","admin","viewer"))] )
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=schemas.ProductResponse, dependencies=[Depends(allow_roles("manager","admin"))] )
def update_product(product_id: int, product_update: schemas.ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for key, value in product_update.dict(exclude_unset=True).items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", dependencies=[Depends(allow_roles("manager","admin"))] )
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()
    return {"detail": "Product successfully deleted"}
