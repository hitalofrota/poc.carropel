from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(
    prefix="/produtos",
    tags=["Produto-Material"],
    dependencies=[Depends(get_current_user)]
)

# ➕ Adicionar material a um produto
@router.post("/{produto_id}/materiais", response_model=schemas.ProdutoMaterialResponse)
def adicionar_material_ao_produto(
    produto_id: int,
    material_data: schemas.ProdutoMaterialCreate,
    db: Session = Depends(get_db)
):
    produto = db.query(models.Produto).filter(models.Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    material = db.query(models.Material).filter(models.Material.id == material_data.material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado")

    # Verifica duplicidade
    existente = (
        db.query(models.ProdutoMaterial)
        .filter_by(produto_id=produto_id, material_id=material_data.material_id)
        .first()
    )
    if existente:
        raise HTTPException(status_code=400, detail="Material já vinculado a este produto")

    novo_vinculo = models.ProdutoMaterial(
        produto_id=produto_id,
        material_id=material_data.material_id,
        quantidade=material_data.quantidade
    )

    db.add(novo_vinculo)
    db.commit()
    db.refresh(novo_vinculo)

    # 🔹 Retorno estruturado conforme o teste espera
    return {
        "id": novo_vinculo.id,
        "produto_id": produto_id,
        "material_id": material.id,
        "quantidade": novo_vinculo.quantidade,
        "material": {
            "id": material.id,
            "nome": material.nome,
            "codigo": material.codigo
        }
    }


# 🔍 Listar materiais de um produto
@router.get("/{produto_id}/materiais", response_model=list[schemas.ProdutoMaterialResponse])
def listar_materiais_do_produto(produto_id: int, db: Session = Depends(get_db)):
    produto = db.query(models.Produto).filter(models.Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    return produto.materiais
