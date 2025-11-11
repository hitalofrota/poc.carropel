from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app import schemas, models
from app.database import get_db
from app.auth import verify_password, create_access_token, get_current_user, hash_password, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
    new_user = models.User(
        nome=user.nome,
        email=user.email,
        senha_hash=hash_password(user.senha)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=schemas.Token)
def login(user_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not verify_password(user_data.senha, user.senha_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas.")

    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.put("/update-password")
def update_password(
    data: schemas.UpdatePasswordRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verifica se a senha atual confere
    if not verify_password(data.senha_atual, current_user.senha_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta.")
    if not data.nova_senha == data.repetir_nova_senha:
        raise HTTPException(status_code=400, detail="As novas senhas não coincidem.")
    
    # Atualiza a senha
    current_user.senha_hash = hash_password(data.nova_senha)
    db.commit()
    db.refresh(current_user)
    return {"message": "Senha atualizada com sucesso."}
