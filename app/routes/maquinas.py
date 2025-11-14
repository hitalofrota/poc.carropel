from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(
    prefix="/machines",
    tags=["Machines"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/", response_model=schemas.MachineResponse)
def create_machine(machine: schemas.MachineCreate, db: Session = Depends(get_db)):
    work_center = db.query(models.WorkCenter).filter(models.WorkCenter.id == machine.work_center_id).first()
    if not work_center:
        raise HTTPException(status_code=400, detail="Work center not found")

    existing_code = db.query(models.Machine).filter(models.Machine.code == machine.code).first()
    if existing_code:
        raise HTTPException(status_code=400, detail="Machine code already registered")

    new_machine = models.Machine(**machine.dict())
    db.add(new_machine)
    db.commit()
    db.refresh(new_machine)
    return new_machine


@router.get("/", response_model=list[schemas.MachineResponse])
def list_machines(db: Session = Depends(get_db)):
    return db.query(models.Machine).all()


@router.get("/{machine_id}", response_model=schemas.MachineResponse)
def get_machine(machine_id: int, db: Session = Depends(get_db)):
    machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    return machine


@router.put("/{machine_id}", response_model=schemas.MachineResponse)
def update_machine(machine_id: int, machine_update: schemas.MachineUpdate, db: Session = Depends(get_db)):
    machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    for key, value in machine_update.dict(exclude_unset=True).items():
        setattr(machine, key, value)

    db.commit()
    db.refresh(machine)
    return machine


@router.delete("/{machine_id}")
def delete_machine(machine_id: int, db: Session = Depends(get_db)):
    machine = db.query(models.Machine).filter(models.Machine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    db.delete(machine)
    db.commit()
    return {"detail": "Machine successfully deleted"}
