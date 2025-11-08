from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(
    prefix="/ordens",
    tags=["Ordem-Material"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/{ordem_id}/materiais", response_model=schemas.OrdemProducaoResponse)
def adicionar_material_a_ordem(
    ordem_id: int,
    material_data: schemas.MaterialOrdemCreate,
    db: Session = Depends(get_db)
):
    ordem = db.query(models.OrdemProducao).filter(models.OrdemProducao.id == ordem_id).first()
    if not ordem:
        raise HTTPException(status_code=404, detail="Ordem de produção não encontrada")

    material = db.query(models.Material).filter(models.Material.id == material_data.material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado")

    # Verifica se já existe esse vínculo
    existente = (
        db.query(models.MaterialOrdem)
        .filter_by(ordem_id=ordem_id, material_id=material_data.material_id)
        .first()
    )
    if existente:
        raise HTTPException(status_code=400, detail="Material já vinculado a esta ordem")

    novo_vinculo = models.MaterialOrdem(
        ordem_id=ordem_id,
        material_id=material_data.material_id,
        quantidade_usada=material_data.quantidade_usada
    )

    db.add(novo_vinculo)
    db.commit()
    db.refresh(ordem)
    return ordem


# 🔍 Listar materiais de uma ordem
@router.get("/{ordem_id}/materiais", response_model=list[schemas.MaterialResponse])
def listar_materiais_da_ordem(ordem_id: int, db: Session = Depends(get_db)):
    ordem = db.query(models.OrdemProducao).filter(models.OrdemProducao.id == ordem_id).first()
    if not ordem:
        raise HTTPException(status_code=404, detail="Ordem de produção não encontrada")

    return [mo.material for mo in ordem.materiais_usados]
