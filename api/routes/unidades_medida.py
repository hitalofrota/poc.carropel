from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(
    prefix="/unidades_medida",
    tags=["Unidades de Medida"],
    dependencies=[Depends(get_current_user)]
)

@router.post("/", response_model=schemas.UnidadeMedidaResponse)
def criar_unidade(unidade: schemas.UnidadeMedidaCreate, db: Session = Depends(get_db)):
    unidade_existente = db.query(models.UnidadeMedida).filter(
        (models.UnidadeMedida.nome == unidade.nome) |
        (models.UnidadeMedida.sigla == unidade.sigla)
    ).first()

    if unidade_existente:
        raise HTTPException(status_code=400, detail="Unidade de medida já cadastrada")

    nova_unidade = models.UnidadeMedida(**unidade.dict())
    db.add(nova_unidade)
    db.commit()
    db.refresh(nova_unidade)
    return nova_unidade

@router.get("/", response_model=list[schemas.UnidadeMedidaResponse])
def listar_unidades(db: Session = Depends(get_db)):
    return db.query(models.UnidadeMedida).all()

@router.get("/{unidade_id}", response_model=schemas.UnidadeMedidaResponse)
def obter_unidade(unidade_id: int, db: Session = Depends(get_db)):
    unidade = db.query(models.UnidadeMedida).filter(models.UnidadeMedida.id == unidade_id).first()
    if not unidade:
        raise HTTPException(status_code=404, detail="Unidade de medida não encontrada")
    return unidade

@router.put("/{unidade_id}", response_model=schemas.UnidadeMedidaResponse)
def atualizar_unidade(unidade_id: int, unidade_update: schemas.UnidadeMedidaCreate, db: Session = Depends(get_db)):
    unidade = db.query(models.UnidadeMedida).filter(models.UnidadeMedida.id == unidade_id).first()
    if not unidade:
        raise HTTPException(status_code=404, detail="Unidade de medida não encontrada")

    for key, value in unidade_update.dict().items():
        setattr(unidade, key, value)

    db.commit()
    db.refresh(unidade)
    return unidade

@router.delete("/{unidade_id}")
def deletar_unidade(unidade_id: int, db: Session = Depends(get_db)):
    unidade = db.query(models.UnidadeMedida).filter(models.UnidadeMedida.id == unidade_id).first()
    if not unidade:
        raise HTTPException(status_code=404, detail="Unidade de medida não encontrada")

    db.delete(unidade)
    db.commit()
    return {"detail": "Unidade de medida deletada com sucesso"}


