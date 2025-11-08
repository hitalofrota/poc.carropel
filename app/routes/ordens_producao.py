from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user
from datetime import datetime

router = APIRouter(
    prefix="/ordens",
    tags=["Ordens de Produção"],
    dependencies=[Depends(get_current_user)]
)

@router.post("/", response_model=schemas.OrdemProducaoResponse)
def criar_ordem(ordem: schemas.OrdemProducaoCreate, db: Session = Depends(get_db)):
    codigo_existente = db.query(models.OrdemProducao).filter(models.OrdemProducao.codigo == ordem.codigo).first()
    if codigo_existente:
        raise HTTPException(status_code=400, detail="Código de ordem já existente")

    produto = db.query(models.Produto).filter(models.Produto.id == ordem.produto_id).first()
    if not produto:
        raise HTTPException(status_code=400, detail="Produto não encontrado")

    nova_ordem = models.OrdemProducao(
        codigo=ordem.codigo,
        produto_id=ordem.produto_id,
        quantidade_planejada=ordem.quantidade_planejada,
        status=ordem.status,
        observacoes=ordem.observacoes,
        data_criacao=datetime.utcnow()
    )

    db.add(nova_ordem)
    db.commit()
    db.refresh(nova_ordem)
    return nova_ordem

@router.get("/", response_model=list[schemas.OrdemProducaoResponse])
def listar_ordens(db: Session = Depends(get_db)):
    return db.query(models.OrdemProducao).all()

@router.get("/{ordem_id}", response_model=schemas.OrdemProducaoResponse)
def obter_ordem(ordem_id: int, db: Session = Depends(get_db)):
    ordem = db.query(models.OrdemProducao).filter(models.OrdemProducao.id == ordem_id).first()
    if not ordem:
        raise HTTPException(status_code=404, detail="Ordem de produção não encontrada")
    return ordem

@router.put("/{ordem_id}", response_model=schemas.OrdemProducaoResponse)
def atualizar_ordem(ordem_id: int, ordem_update: schemas.OrdemProducaoUpdate, db: Session = Depends(get_db)):
    ordem = db.query(models.OrdemProducao).filter(models.OrdemProducao.id == ordem_id).first()
    if not ordem:
        raise HTTPException(status_code=404, detail="Ordem de produção não encontrada")

    for key, value in ordem_update.dict(exclude_unset=True).items():
        setattr(ordem, key, value)

    db.commit()
    db.refresh(ordem)
    return ordem

@router.delete("/{ordem_id}")
def deletar_ordem(ordem_id: int, db: Session = Depends(get_db)):
    ordem = db.query(models.OrdemProducao).filter(models.OrdemProducao.id == ordem_id).first()
    if not ordem:
        raise HTTPException(status_code=404, detail="Ordem de produção não encontrada")

    db.delete(ordem)
    db.commit()
    return {"detail": "Ordem deletada com sucesso"}
