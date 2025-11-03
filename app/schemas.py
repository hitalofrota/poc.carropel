from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    nome: str
    email: EmailStr


class UserCreate(UserBase):
    senha: str


class UserResponse(UserBase):
    id: int

    class Config:
        orm_mode = True


# Esquema para login
class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class Token(BaseModel):
    access_token: str
    token_type: str
