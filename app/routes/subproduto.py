# router_produtos.py
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

# ➕ Adicionar subproduto (produto filho)
@router.post("/{produto_pai_id}/subprodutos", response_model=schemas.ProdutoResponse)
def adicionar_subproduto(
    produto_pai_id: int,
    subproduto_data: schemas.ProdutoCreate,
    db: Session = Depends(get_db)
):
    produto_pai = db.query(models.Produto).filter(models.Produto.id == produto_pai_id).first()
    if not produto_pai:
        raise HTTPException(status_code=404, detail="Produto pai não encontrado")

    novo_subproduto = models.Produto(
        nome=subproduto_data.nome,
        codigo=subproduto_data.codigo,
        descricao=subproduto_data.descricao,
        unidade_medida_id=subproduto_data.unidade_medida_id,
        custo_unitario=subproduto_data.custo_unitario,
        produto_pai_id=produto_pai_id  # 🔹 vincula ao produto pai
    )

    db.add(novo_subproduto)
    db.commit()
    db.refresh(novo_subproduto)

    return novo_subproduto

@router.post("/{produto_pai_id}/subprodutos/{subproduto_id}", response_model=schemas.ProdutoResponse)
def vincular_subproduto_existente(
    produto_pai_id: int,
    subproduto_id: int,
    db: Session = Depends(get_db)
):
    # Busca o produto pai
    produto_pai = db.query(models.Produto).filter(models.Produto.id == produto_pai_id).first()
    if not produto_pai:
        raise HTTPException(status_code=404, detail="Produto pai não encontrado")

    # Busca o produto que será o subproduto
    subproduto = db.query(models.Produto).filter(models.Produto.id == subproduto_id).first()
    if not subproduto:
        raise HTTPException(status_code=404, detail="Produto filho não encontrado")

    # Evita ciclos (um produto não pode ser pai de si mesmo)
    if produto_pai_id == subproduto_id:
        raise HTTPException(status_code=400, detail="Um produto não pode ser subproduto de si mesmo")

    # Atualiza o vínculo pai-filho
    subproduto.produto_pai_id = produto_pai_id

    db.commit()
    db.refresh(subproduto)

    return subproduto


@router.get("/{produto_pai_id}/subprodutos", response_model=list[schemas.ProdutoResponse])
def listar_subprodutos(produto_pai_id: int, db: Session = Depends(get_db)):
    produto_pai = db.query(models.Produto).filter(models.Produto.id == produto_pai_id).first()
    if not produto_pai:
        raise HTTPException(status_code=404, detail="Produto pai não encontrado")

    return produto_pai.subprodutos

