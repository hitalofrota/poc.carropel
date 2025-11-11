from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(
    prefix="/roteiros",
    tags=["Roteiros de Produção"],
    dependencies=[Depends(get_current_user)]
)


# --- CRIAR ROTEIRO ---
@router.post("/", response_model=schemas.RoteiroProducaoResponse)
def criar_roteiro(roteiro: schemas.RoteiroProducaoCreate, db: Session = Depends(get_db)):
    produto = db.query(models.Produto).filter(models.Produto.id == roteiro.produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    novo_roteiro = models.RoteiroProducao(
        produto_id=roteiro.produto_id,
        codigo=roteiro.codigo,
        descricao=roteiro.descricao,
        ativo=roteiro.ativo,
    )
    db.add(novo_roteiro)
    db.commit()
    db.refresh(novo_roteiro)

    # adiciona operações
    for op in roteiro.operacoes:
        nova_op = models.RoteiroOperacao(
            roteiro_id=novo_roteiro.id,
            **op.dict()
        )
        db.add(nova_op)

    db.commit()
    db.refresh(novo_roteiro)
    return novo_roteiro


# --- LISTAR TODOS OS ROTEIROS ---
@router.get("/", response_model=list[schemas.RoteiroProducaoResponse])
def listar_roteiros(db: Session = Depends(get_db)):
    return db.query(models.RoteiroProducao).all()


# --- OBTER ROTEIRO POR ID ---
@router.get("/{roteiro_id}", response_model=schemas.RoteiroProducaoResponse)
def obter_roteiro(roteiro_id: int, db: Session = Depends(get_db)):
    roteiro = db.query(models.RoteiroProducao).filter(models.RoteiroProducao.id == roteiro_id).first()
    if not roteiro:
        raise HTTPException(status_code=404, detail="Roteiro não encontrado")
    return roteiro


# --- ATUALIZAR ROTEIRO ---
@router.put("/{roteiro_id}", response_model=schemas.RoteiroProducaoResponse)
def atualizar_roteiro(roteiro_id: int, roteiro_update: schemas.RoteiroProducaoUpdate, db: Session = Depends(get_db)):
    roteiro = db.query(models.RoteiroProducao).filter(models.RoteiroProducao.id == roteiro_id).first()
    if not roteiro:
        raise HTTPException(status_code=404, detail="Roteiro não encontrado")

    for key, value in roteiro_update.dict(exclude_unset=True, exclude={"operacoes"}).items():
        setattr(roteiro, key, value)

    # se veio lista de operações novas → substitui
    if roteiro_update.operacoes is not None:
        db.query(models.RoteiroOperacao).filter(models.RoteiroOperacao.roteiro_id == roteiro.id).delete()
        for op in roteiro_update.operacoes:
            nova_op = models.RoteiroOperacao(roteiro_id=roteiro.id, **op.dict())
            db.add(nova_op)

    db.commit()
    db.refresh(roteiro)
    return roteiro


# --- DELETAR ROTEIRO ---
@router.delete("/{roteiro_id}")
def deletar_roteiro(roteiro_id: int, db: Session = Depends(get_db)):
    roteiro = db.query(models.RoteiroProducao).filter(models.RoteiroProducao.id == roteiro_id).first()
    if not roteiro:
        raise HTTPException(status_code=404, detail="Roteiro não encontrado")

    db.delete(roteiro)
    db.commit()
    return {"detail": "Roteiro deletado com sucesso"}
