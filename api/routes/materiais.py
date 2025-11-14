from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(
    prefix="/materiais",
    tags=["Materiais"],
    dependencies=[Depends(get_current_user)] 
)

@router.post("/", response_model=schemas.MaterialResponse)
def criar_material(material: schemas.MaterialCreate, db: Session = Depends(get_db)):
    unidade = db.query(models.UnidadeMedida).filter(models.UnidadeMedida.id == material.unidade_medida_id).first()
    if not unidade:
        raise HTTPException(status_code=400, detail="Unidade de medida não encontrada")

    codigo_existente = db.query(models.Material).filter(models.Material.codigo == material.codigo).first()
    if codigo_existente:
        raise HTTPException(status_code=400, detail="Código de material já existente")

    novo_material = models.Material(**material.dict())
    db.add(novo_material)
    db.commit()
    db.refresh(novo_material)
    return novo_material

@router.get("/", response_model=list[schemas.MaterialResponse])
def listar_materiais(db: Session = Depends(get_db)):
    return db.query(models.Material).all()

@router.get("/{material_id}", response_model=schemas.MaterialResponse)
def obter_material(material_id: int, db: Session = Depends(get_db)):
    material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado")
    return material

@router.put("/{material_id}", response_model=schemas.MaterialResponse)
def atualizar_material(material_id: int, material_update: schemas.MaterialUpdate, db: Session = Depends(get_db)):
    material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado")

    for key, value in material_update.dict(exclude_unset=True).items():
        setattr(material, key, value)

    db.commit()
    db.refresh(material)
    return material

@router.delete("/{material_id}")
def deletar_material(material_id: int, db: Session = Depends(get_db)):
    material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado")

    db.delete(material)
    db.commit()
    return {"detail": "Material deletado com sucesso"}

