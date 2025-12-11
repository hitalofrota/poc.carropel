from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user, allow_roles
from typing import Optional, Any, Dict

# 🔥 IMPORTAÇÃO DO SERVIÇO (AQUI É O NOVO)
from app.services.bom_importer import import_full_product_with_bom

router = APIRouter(
    prefix="/products",
    tags=["Products"],
    dependencies=[Depends(get_current_user)]
)

@router.post("/import-bom", dependencies=[Depends(allow_roles("admin","manager"))])
def import_product_and_bom(data: dict, db: Session = Depends(get_db)):
    """
    Recebe o JSON do processo de Debug do CSV e cria:
    - Produto raiz
    - Todos os subprodutos
    - Estrutura completa do BOM
    """
    try:
        product = import_full_product_with_bom(data, db)

        return {
            "detail": "Produto e BOM importados com sucesso",
            "product_id": product.id,
            "product_name": product.name
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
