# app/schemas.py

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr
from enum import Enum

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

class UpdatePasswordRequest(BaseModel):
    senha_atual: str
    nova_senha: str
    repetir_nova_senha: str

class Token(BaseModel):
    access_token: str
    token_type: str

# ========================
# ENUMS
# ========================

class OrdemStatus(str, Enum):
    planejada = "planejada"
    em_producao = "em_producao"
    finalizada = "finalizada"
    cancelada = "cancelada"


# ========================
# UNIDADE DE MEDIDA
# ========================

class UnidadeMedidaBase(BaseModel):
    nome: str
    sigla: str


class UnidadeMedidaCreate(UnidadeMedidaBase):
    pass


class UnidadeMedidaResponse(UnidadeMedidaBase):
    id: int

    class Config:
        orm_mode = True


# ========================
# MATERIAIS
# ========================

class MaterialBase(BaseModel):
    nome: str
    descricao: str
    codigo: str
    unidade_medida_id: int
    custo_unitario: Optional[float] = None


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: str
    codigo: Optional[str] = None
    unidade_medida_id: Optional[int] = None
    custo_unitario: Optional[float] = None


class MaterialResponse(MaterialBase):
    id: int
    unidade_medida: Optional[UnidadeMedidaResponse] = None

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

class OperacaoCreate(OperacaoBase):
    pass

class OperacaoUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None

class OperacaoResponse(BaseModel):
    id: int
    nome: str
    descricao: Optional[str]

    class Config:
        orm_mode = True

# ========================
# PRODUTOS
# ========================

class ProdutoBase(BaseModel):
    nome: str
    codigo: str
    descricao: Optional[str] = None
    custo_unitario: Optional[float] = None
    produto_pai_id: Optional[int] = Field(default=None, description="Se este produto for um subproduto")


class ProdutoCreate(ProdutoBase):
    pass


class ProdutoUpdate(BaseModel):
    nome: Optional[str] = None
    codigo: Optional[str] = None
    descricao: Optional[str] = None
    custo_unitario: Optional[float] = None
    produto_pai_id: Optional[int] = None


class ProdutoResponse(ProdutoBase):
    id: int
    produto_pai_id: Optional[int] = None
    subprodutos: List["ProdutoResponse"] = []

    class Config:
        orm_mode = True

# ========================
# RELAÇÃO ORDEM-MATERIAL
# ========================

class MaterialOrdemBase(BaseModel):
    quantidade_usada: float


class MaterialOrdemCreate(MaterialOrdemBase):
    # ordem_id: int
    material_id: int


class MaterialOrdemResponse(MaterialOrdemBase):
    id: int
    # ordem_id: int
    material_id: int

    class Config:
        orm_mode = True


# ========================
# ORDEM DE PRODUÇÃO
# ========================

class OrdemProducaoBase(BaseModel):
    codigo: str
    produto_id: int
    quantidade_planejada: float
    status: Optional[OrdemStatus] = OrdemStatus.planejada
    observacoes: Optional[str] = None


class OrdemProducaoCreate(OrdemProducaoBase):
    materiais_usados: Optional[List[MaterialOrdemCreate]] = []


class OrdemProducaoUpdate(BaseModel):
    quantidade_planejada: Optional[float] = None
    status: Optional[OrdemStatus] = None
    observacoes: Optional[str] = None


class OrdemProducaoResponse(OrdemProducaoBase):
    id: int
    data_criacao: datetime
    data_inicio: Optional[datetime] = None
    data_fim: Optional[datetime] = None
    produto: Optional[ProdutoResponse] = None
    materiais_usados: Optional[List[MaterialOrdemResponse]] = None

    class Config:
        orm_mode = True

# ========================
# RELAÇÃO PRODUTO-MATERIAL
# ========================

class MaterialResumo(BaseModel):
    id: int
    nome: str
    codigo: str

    class Config:
        orm_mode = True

class ProdutoMaterialBase(BaseModel):
    material_id: int
    quantidade: float


class ProdutoMaterialCreate(ProdutoMaterialBase):
    # produto_id: int
    material_id: int


class ProdutoMaterialResponse(BaseModel):
    id: int
    produto_id: int
    material_id: int
    quantidade: float
    material: MaterialResumo

    class Config:
        orm_mode = True

# ========================
# PEDIDO DE VENDA
# ========================

class PedidoVendaItemBase(BaseModel):
    produto_id: int
    quantidade: float


class PedidoVendaItemCreate(PedidoVendaItemBase):
    pass


class PedidoVendaItemResponse(PedidoVendaItemBase):
    id: int

    class Config:
        orm_mode = True


class PedidoVendaBase(BaseModel):
    numero_pedido: str
    cliente: str
    observacoes: Optional[str] = None


class PedidoVendaCreate(PedidoVendaBase):
    itens: List[PedidoVendaItemCreate]


class PedidoVendaResponse(PedidoVendaBase):
    id: int
    data_pedido: datetime
    itens: List[PedidoVendaItemResponse] = []

    class Config:
        orm_mode = True

# ========================
# OPERAÇÃO DO ROTEIRO
# ========================

class RoteiroOperacaoBase(BaseModel):
    operacao_id: int
    centro_trabalho_id: int
    maquina_id: Optional[int] = None
    sequencia: int
    tempo_padrao_min: Optional[int] = None
    observacoes: Optional[str] = None


class RoteiroOperacaoCreate(RoteiroOperacaoBase):
    pass


class RoteiroOperacaoResponse(RoteiroOperacaoBase):
    id: int
    criado_em: datetime

    class Config:
        orm_mode = True

# ========================
# ROTEIRO DE PRODUÇÃO
# ========================

class RoteiroProducaoBase(BaseModel):
    produto_id: int
    codigo: Optional[str] = None
    descricao: Optional[str] = None
    ativo: Optional[bool] = True


class RoteiroProducaoCreate(RoteiroProducaoBase):
    operacoes: List[RoteiroOperacaoCreate] = []


class RoteiroProducaoUpdate(BaseModel):
    codigo: Optional[str] = None
    descricao: Optional[str] = None
    ativo: Optional[bool] = None
    operacoes: Optional[List[RoteiroOperacaoCreate]] = None


class RoteiroProducaoResponse(RoteiroProducaoBase):
    id: int
    criado_em: datetime
    operacoes: List[RoteiroOperacaoResponse] = []

    class Config:
        orm_mode = True
