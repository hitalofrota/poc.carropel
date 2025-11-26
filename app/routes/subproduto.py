# router_products.py
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

@router.post("/{parent_product_id}/subproducts", 
    response_model=schemas.ProductResponse,
    dependencies=[Depends(allow_roles("manager","admin"))]
)

@router.post("/{parent_product_id}/subproducts", dependencies=[Depends(allow_roles("manager","admin"))])
def add_subproduct(
    parent_product_id: int,
    data: schemas.ProductCreate,
    db: Session = Depends(get_db)
):
    parent = db.query(models.Product).filter(models.Product.id == parent_product_id).first()
    if not parent:
        raise HTTPException(404, "Parent product not found")

    # create or fetch the child product
    child = _get_or_create_product(
        db=db,
        name=data.name,
        code=data.code
    )

    # create BOM relationship
    bom = models.ProductBOM(
        parent_id=parent_product_id,
        child_id=child.id,
        quantity=data.quantity,
        effective_quantity=data.effective_quantity
    )

    db.add(bom)
    db.commit()
    db.refresh(child)

    return child


@router.post("/{parent_product_id}/subproducts/{child_id}", dependencies=[Depends(allow_roles("manager","admin"))])
def link_existing_subproduct(
    parent_product_id: int,
    child_id: int,
    db: Session = Depends(get_db)
):
    parent = db.query(models.Product).filter(models.Product.id == parent_product_id).first()
    if not parent:
        raise HTTPException(404, "Parent product not found")

    child = db.query(models.Product).filter(models.Product.id == child_id).first()
    if not child:
        raise HTTPException(404, "Child product not found")

    # check for existing relationship
    existing = db.query(models.ProductBOM).filter(
        models.ProductBOM.parent_id == parent_product_id,
        models.ProductBOM.child_id == child_id,
    ).first()

    if existing:
        raise HTTPException(400, "This subproduct already exists")

    # create BOM relationship
    bom = models.ProductBOM(
        parent_id=parent_product_id,
        child_id=child_id,
        quantity=1,

    )

    db.add(bom)
    db.commit()
    return child


@router.get("/{parent_product_id}/subproducts",
    response_model=list[schemas.ProductResponse],
    dependencies=[Depends(allow_roles("manager","admin","viewer"))]
)
def list_subproducts(
    parent_product_id: int,
    db: Session = Depends(get_db)
):
    parent = db.query(models.Product).filter_by(id=parent_product_id).first()
    if not parent:
        raise HTTPException(404, "Parent product not found")

    # get all children from BOM
    bom_items = db.query(models.ProductBOM).filter_by(parent_id=parent_product_id).all()

    child_ids = [b.child_id for b in bom_items]

    return db.query(models.Product).filter(models.Product.id.in_(child_ids)).all()

