from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(
    prefix="/work_centers",
    tags=["Work Centers"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/", response_model=schemas.WorkCenterResponse)
def create_work_center(center: schemas.WorkCenterCreate, db: Session = Depends(get_db)):
    existing_center = db.query(models.WorkCenter).filter(models.WorkCenter.name == center.name).first()
    if existing_center:
        raise HTTPException(status_code=400, detail="Work center already registered")

    new_center = models.WorkCenter(**center.dict())
    db.add(new_center)
    db.commit()
    db.refresh(new_center)
    return new_center


@router.get("/", response_model=list[schemas.WorkCenterResponse])
def list_work_centers(db: Session = Depends(get_db)):
    return db.query(models.WorkCenter).all()


@router.get("/{center_id}", response_model=schemas.WorkCenterResponse)
def get_work_center(center_id: int, db: Session = Depends(get_db)):
    center = db.query(models.WorkCenter).filter(models.WorkCenter.id == center_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Work center not found")
    return center


@router.put("/{center_id}", response_model=schemas.WorkCenterResponse)
def update_work_center(center_id: int, center_update: schemas.WorkCenterCreate, db: Session = Depends(get_db)):
    center = db.query(models.WorkCenter).filter(models.WorkCenter.id == center_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Work center not found")

    for key, value in center_update.dict(exclude_unset=True).items():
        setattr(center, key, value)

    db.commit()
    db.refresh(center)
    return center


@router.delete("/{center_id}")
def delete_work_center(center_id: int, db: Session = Depends(get_db)):
    center = db.query(models.WorkCenter).filter(models.WorkCenter.id == center_id).first()
    if not center:
        raise HTTPException(status_code=404, detail="Work center not found")

    db.delete(center)
    db.commit()
    return {"detail": "Work center successfully deleted"}
