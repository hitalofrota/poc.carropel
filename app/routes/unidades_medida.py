from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user, allow_roles


router = APIRouter(
    prefix="/units_of_measure",
    tags=["Units of Measure"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/", response_model=schemas.UnitOfMeasureResponse, dependencies=[Depends(allow_roles("manager","admin"))] )
def create_unit(unit: schemas.UnitOfMeasureCreate, db: Session = Depends(get_db)):
    existing_unit = db.query(models.UnitOfMeasure).filter(
        (models.UnitOfMeasure.name == unit.name) |
        (models.UnitOfMeasure.abbreviation == unit.abbreviation)
    ).first()

    if existing_unit:
        raise HTTPException(status_code=400, detail="Unit of measure already registered")

    new_unit = models.UnitOfMeasure(**unit.dict())
    db.add(new_unit)
    db.commit()
    db.refresh(new_unit)
    return new_unit

@router.get("/", response_model=list[schemas.UnitOfMeasureResponse], dependencies=[Depends(allow_roles("manager","admin","viewer"))] )
def list_units(db: Session = Depends(get_db)):
    return db.query(models.UnitOfMeasure).all()

@router.get("/{unit_id}", response_model=schemas.UnitOfMeasureResponse, dependencies=[Depends(allow_roles("manager","admin","viewer"))] )
def get_unit(unit_id: int, db: Session = Depends(get_db)):
    unit = db.query(models.UnitOfMeasure).filter(models.UnitOfMeasure.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit of measure not found")
    return unit

@router.put("/{unit_id}", response_model=schemas.UnitOfMeasureResponse, dependencies=[Depends(allow_roles("manager","admin"))] )
def update_unit(unit_id: int, unit_update: schemas.UnitOfMeasureCreate, db: Session = Depends(get_db)):
    unit = db.query(models.UnitOfMeasure).filter(models.UnitOfMeasure.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit of measure not found")

    for key, value in unit_update.dict().items():
        setattr(unit, key, value)

    db.commit()
    db.refresh(unit)
    return unit

@router.delete("/{unit_id}", dependencies=[Depends(allow_roles("manager","admin"))] )
def delete_unit(unit_id: int, db: Session = Depends(get_db)):
    unit = db.query(models.UnitOfMeasure).filter(models.UnitOfMeasure.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit of measure not found")

    db.delete(unit)
    db.commit()
    return {"detail": "Unit of measure successfully deleted"}
