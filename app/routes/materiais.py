from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user, allow_roles

router = APIRouter(
    prefix="/materials",
    tags=["Materials"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/", response_model=schemas.MaterialResponse, dependencies=[Depends(allow_roles("manager","admin"))] )
def create_material(material: schemas.MaterialCreate, db: Session = Depends(get_db)):
    unit = db.query(models.UnitOfMeasure).filter(models.UnitOfMeasure.id == material.unit_of_measure_id).first()
    if not unit:
        raise HTTPException(status_code=400, detail="Unit of measure not found")

    existing_code = db.query(models.Material).filter(models.Material.code == material.code).first()
    if existing_code:
        raise HTTPException(status_code=400, detail="Material code already exists")

    new_material = models.Material(**material.dict())
    db.add(new_material)
    db.commit()
    db.refresh(new_material)
    return new_material


@router.get("/", response_model=list[schemas.MaterialResponse], dependencies=[Depends(allow_roles("manager","admin","viewer"))] )
def list_materials(db: Session = Depends(get_db)):
    return db.query(models.Material).all()


@router.get("/{material_id}", response_model=schemas.MaterialResponse, dependencies=[Depends(allow_roles("manager","admin","viewer"))] )
def get_material(material_id: int, db: Session = Depends(get_db)):
    material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return material


@router.put("/{material_id}", response_model=schemas.MaterialResponse, dependencies=[Depends(allow_roles("manager","admin"))] )
def update_material(material_id: int, material_update: schemas.MaterialUpdate, db: Session = Depends(get_db)):
    material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    for key, value in material_update.dict(exclude_unset=True).items():
        setattr(material, key, value)

    db.commit()
    db.refresh(material)
    return material


@router.delete("/{material_id}", dependencies=[Depends(allow_roles("manager","admin"))] )
def delete_material(material_id: int, db: Session = Depends(get_db)):
    material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    db.delete(material)
    db.commit()
    return {"detail": "Material successfully deleted"}
