from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(
    prefix="/centros_trabalho",
    tags=["Centros de Trabalho"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/", response_model=schemas.CentroTrabalhoResponse)
def criar_centro_trabalho(centro: schemas.CentroTrabalhoCreate, db: Session = Depends(get_db)):
    existente = db.query(models.CentroTrabalho).filter(models.CentroTrabalho.nome == centro.nome).first()
    if existente:
        raise HTTPException(status_code=400, detail="Centro de trabalho já cadastrado")

    novo_centro = models.CentroTrabalho(**centro.dict())
    db.add(novo_centro)
    db.commit()
    db.refresh(novo_centro)
    return novo_centro


@router.get("/", response_model=list[schemas.CentroTrabalhoResponse])
def listar_centros_trabalho(db: Session = Depends(get_db)):
    return db.query(models.CentroTrabalho).all()


@router.get("/{centro_id}", response_model=schemas.CentroTrabalhoResponse)
def obter_centro_trabalho(centro_id: int, db: Session = Depends(get_db)):
    centro = db.query(models.CentroTrabalho).filter(models.CentroTrabalho.id == centro_id).first()
    if not centro:
        raise HTTPException(status_code=404, detail="Centro de trabalho não encontrado")
    return centro


@router.put("/{centro_id}", response_model=schemas.CentroTrabalhoResponse)
def atualizar_centro_trabalho(centro_id: int, centro_update: schemas.CentroTrabalhoCreate, db: Session = Depends(get_db)):
    centro = db.query(models.CentroTrabalho).filter(models.CentroTrabalho.id == centro_id).first()
    if not centro:
        raise HTTPException(status_code=404, detail="Centro de trabalho não encontrado")

    for key, value in centro_update.dict(exclude_unset=True).items():
        setattr(centro, key, value)

    db.commit()
    db.refresh(centro)
    return centro


@router.delete("/{centro_id}")
def deletar_centro_trabalho(centro_id: int, db: Session = Depends(get_db)):
    centro = db.query(models.CentroTrabalho).filter(models.CentroTrabalho.id == centro_id).first()
    if not centro:
        raise HTTPException(status_code=404, detail="Centro de trabalho não encontrado")

    db.delete(centro)
    db.commit()
    return {"detail": "Centro de trabalho deletado com sucesso"}
