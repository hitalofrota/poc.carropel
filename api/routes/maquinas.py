from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(
    prefix="/maquinas",
    tags=["Máquinas"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/", response_model=schemas.MaquinaResponse)
def criar_maquina(maquina: schemas.MaquinaCreate, db: Session = Depends(get_db)):
    centro = db.query(models.CentroTrabalho).filter(models.CentroTrabalho.id == maquina.centro_trabalho_id).first()
    if not centro:
        raise HTTPException(status_code=400, detail="Centro de trabalho não encontrado")

    codigo_existente = db.query(models.Maquina).filter(models.Maquina.codigo == maquina.codigo).first()
    if codigo_existente:
        raise HTTPException(status_code=400, detail="Código de máquina já cadastrado")

    nova_maquina = models.Maquina(**maquina.dict())
    db.add(nova_maquina)
    db.commit()
    db.refresh(nova_maquina)
    return nova_maquina


@router.get("/", response_model=list[schemas.MaquinaResponse])
def listar_maquinas(db: Session = Depends(get_db)):
    return db.query(models.Maquina).all()


@router.get("/{maquina_id}", response_model=schemas.MaquinaResponse)
def obter_maquina(maquina_id: int, db: Session = Depends(get_db)):
    maquina = db.query(models.Maquina).filter(models.Maquina.id == maquina_id).first()
    if not maquina:
        raise HTTPException(status_code=404, detail="Máquina não encontrada")
    return maquina


@router.put("/{maquina_id}", response_model=schemas.MaquinaResponse)
def atualizar_maquina(maquina_id: int, maquina_update: schemas.MaquinaUpdate, db: Session = Depends(get_db)):
    maquina = db.query(models.Maquina).filter(models.Maquina.id == maquina_id).first()
    if not maquina:
        raise HTTPException(status_code=404, detail="Máquina não encontrada")

    for key, value in maquina_update.dict(exclude_unset=True).items():
        setattr(maquina, key, value)

    db.commit()
    db.refresh(maquina)
    return maquina


@router.delete("/{maquina_id}")
def deletar_maquina(maquina_id: int, db: Session = Depends(get_db)):
    maquina = db.query(models.Maquina).filter(models.Maquina.id == maquina_id).first()
    if not maquina:
        raise HTTPException(status_code=404, detail="Máquina não encontrada")

    db.delete(maquina)
    db.commit()
    return {"detail": "Máquina deletada com sucesso"}
