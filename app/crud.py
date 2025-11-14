# app/crud.py

from sqlalchemy.orm import Session
from app import models, schemas
from datetime import datetime


# ---------------------- MATERIAIS ----------------------

def get_materiais(db: Session):
    return db.query(models.Material).all()


def get_material(db: Session, material_id: int):
    return db.query(models.Material).filter(models.Material.id == material_id).first()


def create_material(db: Session, material: schemas.MaterialCreate):
    db_material = models.Material(**material.dict())
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material


# ---------------------- PRODUTOS ----------------------

def get_produtos(db: Session):
    return db.query(models.Produto).all()


def get_produto(db: Session, produto_id: int):
    return db.query(models.Produto).filter(models.Produto.id == produto_id).first()


def create_produto(db: Session, produto: schemas.ProdutoCreate):
    db_produto = models.Produto(
        nome=produto.nome,
        codigo=produto.codigo,
        descricao=produto.descricao,
        unidade_medida=produto.unidade_medida,
        custo_unitario=produto.custo_unitario,
        produto_pai_id=produto.produto_pai_id
    )

    db.add(db_produto)
    db.commit()
    db.refresh(db_produto)

    # adiciona materiais associados
    if produto.materiais:
        for m in produto.materiais:
            db_item = models.ProdutoMaterial(
                produto_id=db_produto.id,
                material_id=m.material_id,
                quantidade=m.quantidade
            )
            db.add(db_item)
        db.commit()

    db.refresh(db_produto)
    return db_produto


# ---------------------- ORDENS DE PRODUÇÃO ----------------------

def get_ordens(db: Session):
    return db.query(models.OrdemProducao).all()


def get_ordem(db: Session, ordem_id: int):
    return db.query(models.OrdemProducao).filter(models.OrdemProducao.id == ordem_id).first()


def create_ordem(db: Session, ordem: schemas.OrdemProducaoCreate):
    db_ordem = models.OrdemProducao(
        codigo=ordem.codigo,
        produto_id=ordem.produto_id,
        quantidade_planejada=ordem.quantidade_planejada,
        status=ordem.status,
        observacoes=ordem.observacoes,
        data_criacao=datetime.utcnow()
    )

    db.add(db_ordem)
    db.commit()
    db.refresh(db_ordem)

    # adiciona materiais usados
    if ordem.materiais_usados:
        for m in ordem.materiais_usados:
            db_item = models.MaterialOrdem(
                ordem_id=db_ordem.id,
                material_id=m.material_id,
                quantidade_usada=m.quantidade_usada
            )
            db.add(db_item)
        db.commit()

    db.refresh(db_ordem)
    return db_ordem
