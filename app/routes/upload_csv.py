from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.services.csv_service import process_csv, process_csv_debug
from app.database import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/upload", tags=["CSV Upload"])


@router.post("/products")
async def upload_produtos_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if file.content_type not in ["text/csv", "application/vnd.ms-excel"]:
        raise HTTPException(status_code=400, detail="O arquivo deve ser CSV")

    result = await process_csv(file, db)

    return {
        "message": "Arquivo processado com sucesso",
        "summary": result
    }

@router.post("/debug")
async def upload_csv_debug(file: UploadFile = File(...)):
    result = await process_csv_debug(file)
    return result