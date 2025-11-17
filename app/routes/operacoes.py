from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user,allow_roles

router = APIRouter(
    prefix="/operations",
    tags=["Operations"],
    dependencies=[Depends(get_current_user)]
)

# --- CREATE OPERATION ---
@router.post("/", response_model=schemas.OperationResponse, dependencies=[Depends(allow_roles("manager","admin"))] )
def create_operation(operation: schemas.OperationCreate, db: Session = Depends(get_db)):
    existing_op = db.query(models.Operation).filter(models.Operation.name == operation.name).first()
    if existing_op:
        raise HTTPException(status_code=400, detail="Operation already exists")

    new_op = models.Operation(
        name=operation.name,
        description=operation.description
    )
    db.add(new_op)
    db.commit()
    db.refresh(new_op)
    return new_op


# --- LIST ALL OPERATIONS ---
@router.get("/", response_model=list[schemas.OperationResponse], dependencies=[Depends(allow_roles("manager","admin","viewer"))] )
def list_operations(db: Session = Depends(get_db)):
    return db.query(models.Operation).all()


# --- GET OPERATION BY ID ---
@router.get("/{operation_id}", response_model=schemas.OperationResponse, dependencies=[Depends(allow_roles("manager","admin","viewer"))] )
def get_operation(operation_id: int, db: Session = Depends(get_db)):
    operation = db.query(models.Operation).filter(models.Operation.id == operation_id).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    return operation


# --- UPDATE OPERATION ---
@router.put("/{operation_id}", response_model=schemas.OperationResponse, dependencies=[Depends(allow_roles("manager","admin"))] )
def update_operation(operation_id: int, operation_update: schemas.OperationUpdate, db: Session = Depends(get_db)):
    operation = db.query(models.Operation).filter(models.Operation.id == operation_id).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")

    for key, value in operation_update.dict(exclude_unset=True).items():
        setattr(operation, key, value)

    db.commit()
    db.refresh(operation)
    return operation


# --- DELETE OPERATION ---
@router.delete("/{operation_id}", dependencies=[Depends(allow_roles("manager","admin"))] )
def delete_operation(operation_id: int, db: Session = Depends(get_db)):
    operation = db.query(models.Operation).filter(models.Operation.id == operation_id).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")

    db.delete(operation)
    db.commit()
    return {"detail": "Operation successfully deleted"}
