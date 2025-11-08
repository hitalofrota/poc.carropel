from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from .. import crud, schemas
from ..database import get_db


router = APIRouter(prefix='/bom', tags=['bom'])


@router.post('/', response_model=schemas.BOMOut)
async def criar_item_bom(bom_in: schemas.BOMBase, db: