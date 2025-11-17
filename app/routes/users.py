from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user, allow_roles

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=list[schemas.UserResponse], dependencies=[Depends(allow_roles("manager","admin"))])
def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.User).all()

@router.get("/{user_id}", response_model=schemas.UserResponse, dependencies=[Depends(allow_roles("manager","admin"))])
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    return user

@router.put("/{user_id}/role", response_model=schemas.UserResponse, dependencies=[Depends(allow_roles("admin"))])
def update_user_role(
    user_id: int,
    data: schemas.UpdateUserRole,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 🔐 Verifica se é admin
    if current_user.role != models.UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem alterar roles."
        )

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    # Atualiza o role
    user.role = data.role
    db.commit()
    db.refresh(user)

    return user
