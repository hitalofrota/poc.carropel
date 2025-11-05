from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List

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

class UnidadeMedidaBase(BaseModel):
    nome: str = Field(..., example="Quilograma")
    sigla: str = Field(..., example="kg")

class UnidadeMedidaCreate(UnidadeMedidaBase):
    pass


class UnidadeMedidaResponse(UnidadeMedidaBase):
    id: int

    class Config:
        orm_mode = True

# -------------------------
# Material Schemas
# -------------------------
class MaterialBase(BaseModel):
    nome: str = Field(..., example="Aço Inoxidável 304")
    descricao: Optional[str] = Field(None, example="Chapa de aço inoxidável")
    codigo: str = Field(..., example="MAT-001")
    estoque_atual: float = Field(0, example=125.5)
    preco_unitario: float = Field(..., example=32.75)
    unidade_medida_id: int = Field(..., example=1)  # FK para UnidadeMedida


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    nome: Optional[str]
    descricao: Optional[str]
    estoque_atual: Optional[float]
    preco_unitario: Optional[float]
    unidade_medida_id: Optional[int]


class MaterialResponse(MaterialBase):
    id: int
    data_cadastro: datetime
    unidade_medida: UnidadeMedidaResponse  # inclui os dados da unidade no retorno

    class Config:
        orm_mode = True

# ===============================
# Centro de Trabalho
# ===============================
class CentroTrabalhoBase(BaseModel):
    nome: str
    descricao: Optional[str] = None


class CentroTrabalhoCreate(CentroTrabalhoBase):
    pass


class CentroTrabalhoResponse(CentroTrabalhoBase):
    id: int

    class Config:
        orm_mode = True


# ===============================
# Máquina
# ===============================
class MaquinaBase(BaseModel):
    nome: str
    codigo: str
    descricao: Optional[str] = None
    centro_trabalho_id: int

class MaquinaCreate(MaquinaBase):
    pass

class MaquinaUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    centro_trabalho_id: Optional[int] = None

class MaquinaResponse(MaquinaBase):
    id: int
    centro_trabalho: Optional[CentroTrabalhoResponse]

    class Config:
        orm_mode = True

# ===============================
# Operações
# ===============================
class OperacaoBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    centros_trabalho_ids: List[int]  # IDs dos centros de trabalho associados


class OperacaoCreate(OperacaoBase):
    pass


class OperacaoUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    centros_trabalho_ids: Optional[List[int]] = None


class OperacaoResponse(BaseModel):
    id: int
    nome: str
    descricao: Optional[str]
    centros_trabalho: List[CentroTrabalhoResponse]  # retorna os centros vinculados

    class Config:
        orm_mode = True