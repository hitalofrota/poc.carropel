from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(
    prefix="/produtos",
    tags=["Produtos"],
    dependencies=[Depends(get_current_user)]
)

@router.post("/", response_model=schemas.ProdutoResponse)
def criar_produto(produto: schemas.ProdutoCreate, db: Session = Depends(get_db)):
    codigo_existente = db.query(models.Produto).filter(models.Produto.codigo == produto.codigo).first()
    if codigo_existente:
        raise HTTPException(status_code=400, detail="Código de produto já existente")

    if produto.produto_pai_id:
        pai = db.query(models.Produto).filter(models.Produto.id == produto.produto_pai_id).first()
        if not pai:
            raise HTTPException(status_code=400, detail="Produto pai não encontrado")

    novo_produto = models.Produto(**produto.dict(exclude_unset=True))
    db.add(novo_produto)
    db.commit()
    db.refresh(novo_produto)
    return novo_produto

@router.get("/", response_model=list[schemas.ProdutoResponse])
def listar_produtos(db: Session = Depends(get_db)):
    return db.query(models.Produto).all()

@router.get("/{produto_id}", response_model=schemas.ProdutoResponse)
def obter_produto(produto_id: int, db: Session = Depends(get_db)):
    produto = db.query(models.Produto).filter(models.Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return produto

@router.put("/{produto_id}", response_model=schemas.ProdutoResponse)
def atualizar_produto(produto_id: int, produto_update: schemas.ProdutoUpdate, db: Session = Depends(get_db)):
    produto = db.query(models.Produto).filter(models.Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    for key, value in produto_update.dict(exclude_unset=True).items():
        setattr(produto, key, value)

    db.commit()
    db.refresh(produto)
    return produto

@router.delete("/{produto_id}")
def deletar_produto(produto_id: int, db: Session = Depends(get_db)):
    produto = db.query(models.Produto).filter(models.Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    db.delete(produto)
    db.commit()
    return {"detail": "Produto deletado com sucesso"}
