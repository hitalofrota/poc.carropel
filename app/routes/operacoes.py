from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(
    prefix="/operacoes",
    tags=["Operações"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/", response_model=schemas.OperacaoResponse)
def criar_operacao(operacao: schemas.OperacaoCreate, db: Session = Depends(get_db)):
    # Verifica duplicidade
    if db.query(models.Operacao).filter(models.Operacao.nome == operacao.nome).first():
        raise HTTPException(status_code=400, detail="Operação já cadastrada")

    # Verifica centros de trabalho existentes
    centros = db.query(models.CentroTrabalho).filter(models.CentroTrabalho.id.in_(operacao.centros_trabalho_ids)).all()
    if len(centros) != len(operacao.centros_trabalho_ids):
        raise HTTPException(status_code=400, detail="Um ou mais centros de trabalho não encontrados")

    nova_operacao = models.Operacao(
        nome=operacao.nome,
        descricao=operacao.descricao,
        centros_trabalho=centros
    )
    db.add(nova_operacao)
    db.commit()
    db.refresh(nova_operacao)
    return nova_operacao


@router.get("/", response_model=list[schemas.OperacaoResponse])
def listar_operacoes(db: Session = Depends(get_db)):
    return db.query(models.Operacao).all()


@router.get("/{operacao_id}", response_model=schemas.OperacaoResponse)
def obter_operacao(operacao_id: int, db: Session = Depends(get_db)):
    operacao = db.query(models.Operacao).filter(models.Operacao.id == operacao_id).first()
    if not operacao:
        raise HTTPException(status_code=404, detail="Operação não encontrada")
    return operacao


@router.put("/{operacao_id}", response_model=schemas.OperacaoResponse)
def atualizar_operacao(operacao_id: int, operacao_update: schemas.OperacaoUpdate, db: Session = Depends(get_db)):
    operacao = db.query(models.Operacao).filter(models.Operacao.id == operacao_id).first()
    if not operacao:
        raise HTTPException(status_code=404, detail="Operação não encontrada")

    if operacao_update.nome:
        operacao.nome = operacao_update.nome
    if operacao_update.descricao:
        operacao.descricao = operacao_update.descricao
    if operacao_update.centros_trabalho_ids is not None:
        centros = db.query(models.CentroTrabalho).filter(models.CentroTrabalho.id.in_(operacao_update.centros_trabalho_ids)).all()
        operacao.centros_trabalho = centros

    db.commit()
    db.refresh(operacao)
    return operacao


@router.delete("/{operacao_id}")
def deletar_operacao(operacao_id: int, db: Session = Depends(get_db)):
    operacao = db.query(models.Operacao).filter(models.Operacao.id == operacao_id).first()
    if not operacao:
        raise HTTPException(status_code=404, detail="Operação não encontrada")

    db.delete(operacao)
    db.commit()
    return {"detail": "Operação deletada com sucesso"}
