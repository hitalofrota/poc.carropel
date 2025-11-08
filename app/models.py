from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Table, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from datetime import datetime
import enum

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)

class UnidadeMedida(Base):
    __tablename__ = "unidades_medida"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(50), nullable=False, unique=True)  # Ex: Quilograma
    sigla = Column(String(10), nullable=False, unique=True)  # Ex: kg

    materiais = relationship("Material", back_populates="unidade_medida")

operacao_centro_trabalho = Table(
    "operacao_centro_trabalho",
    Base.metadata,
    Column("operacao_id", Integer, ForeignKey("operacoes.id", ondelete="CASCADE")),
    Column("centro_trabalho_id", Integer, ForeignKey("centros_trabalho.id", ondelete="CASCADE"))
)

class CentroTrabalho(Base):
    __tablename__ = "centros_trabalho"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False, unique=True)
    descricao = Column(String(255), nullable=True)

    # relacionamento com máquinas
    maquinas = relationship("Maquina", back_populates="centro_trabalho")
    operacoes = relationship(
        "Operacao",
        secondary=operacao_centro_trabalho,
        back_populates="centros_trabalho"
    )


class Maquina(Base):
    __tablename__ = "maquinas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    codigo = Column(String(50), nullable=False, unique=True)
    descricao = Column(String(255), nullable=True)
    centro_trabalho_id = Column(Integer, ForeignKey("centros_trabalho.id"), nullable=False)

    # relacionamento com centro de trabalho
    centro_trabalho = relationship("CentroTrabalho", back_populates="maquinas")

class Operacao(Base):
    __tablename__ = "operacoes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False, unique=True)
    descricao = Column(Text, nullable=True)

    centros_trabalho = relationship(
        "CentroTrabalho",
        secondary=operacao_centro_trabalho,
        back_populates="operacoes"
    )

# --- ENUMs ---
class OrdemStatus(enum.Enum):
    planejada = "planejada"
    em_producao = "em_producao"
    finalizada = "finalizada"
    cancelada = "cancelada"

class PedidoStatus(enum.Enum):
    planejado = "planejado"
    em_producao = "em_producao"
    finalizado = "finalizado"
    cancelado = "cancelado"

# --- MODELOS PRINCIPAIS ---

class Produto(Base):
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False)
    codigo = Column(String(100), unique=True, nullable=False)
    descricao = Column(Text, nullable=True)
    custo_unitario = Column(Float, nullable=True)
    venda_unitario = Column(Float, nullable=True)
    peso_liquido = Column(Float, nullable=True)
    peso_bruto = Column(Float, nullable=True)

    produto_pai_id = Column(Integer, ForeignKey("produtos.id"), nullable=True)

    produto_pai = relationship(
        "Produto",
        remote_side=[id],
        back_populates="subprodutos"
    )
    subprodutos = relationship(
        "Produto",
        back_populates="produto_pai",
        cascade="all, delete-orphan"
    )

    ordens = relationship("OrdemProducao", back_populates="produto")
    materiais = relationship(
        "ProdutoMaterial",
        back_populates="produto",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

class Material(Base):
    __tablename__ = "materiais"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False)
    descricao = Column(Text, nullable=True)
    codigo = Column(String(100), unique=True, nullable=False)
    unidade_medida_id = Column(Integer, ForeignKey("unidades_medida.id"), nullable=False)
    custo_unitario = Column(Float, nullable=True)

    unidade_medida = relationship("UnidadeMedida", back_populates="materiais")
    materiais_produtos = relationship(
        "ProdutoMaterial",
        back_populates="material",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    materiais_ordens = relationship(
        "MaterialOrdem",
        back_populates="material",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
# --- ORDEM DE PRODUÇÃO ---
class OrdemProducao(Base):
    __tablename__ = "ordens_producao"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(100), unique=True, nullable=False)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False)
    quantidade_planejada = Column(Float, nullable=False)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_inicio = Column(DateTime, nullable=True)
    data_fim = Column(DateTime, nullable=True)
    status = Column(Enum(OrdemStatus), default=OrdemStatus.planejada)
    observacoes = Column(Text, nullable=True)
    pedido_id = Column(Integer, ForeignKey("pedidos_venda.id"), nullable=True)

    produto = relationship("Produto", back_populates="ordens")
    materiais_usados = relationship(
        "MaterialOrdem",
        back_populates="ordem",
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    pedido = relationship("PedidoVenda", back_populates="ordens")

    def __repr__(self):
        return f"<OrdemProducao(codigo={self.codigo}, produto={self.produto_id}, status={self.status})>"

# --- RELAÇÃO N:N ENTRE PRODUTO E MATERIAL ---
class ProdutoMaterial(Base):
    __tablename__ = "produtos_materiais"

    id = Column(Integer, primary_key=True, index=True)
    produto_id = Column(Integer, ForeignKey("produtos.id", ondelete="CASCADE"), nullable=False)
    material_id = Column(Integer, ForeignKey("materiais.id", ondelete="CASCADE"), nullable=False)
    quantidade = Column(Float, nullable=False)

    # Relacionamentos bidirecionais
    produto = relationship("Produto", back_populates="materiais")
    material = relationship("Material", back_populates="materiais_produtos")


# --- RELAÇÃO N:N ENTRE ORDEM DE PRODUÇÃO E MATERIAL ---
class MaterialOrdem(Base):
    __tablename__ = "materiais_ordens"

    id = Column(Integer, primary_key=True, index=True)
    ordem_id = Column(Integer, ForeignKey("ordens_producao.id", ondelete="CASCADE"), nullable=False)
    material_id = Column(Integer, ForeignKey("materiais.id", ondelete="CASCADE"), nullable=False)
    quantidade_usada = Column(Float, nullable=False)

    # Relacionamentos bidirecionais
    ordem = relationship("OrdemProducao", back_populates="materiais_usados")
    material = relationship("Material", back_populates="materiais_ordens")



# --- PEDIDO DE VENDA ---
class PedidoVenda(Base):
    __tablename__ = "pedidos_venda"

    id = Column(Integer, primary_key=True, index=True)
    numero_pedido = Column(String(100), unique=True, nullable=False)
    cliente = Column(String(200), nullable=False)
    data_pedido = Column(DateTime, default=datetime.utcnow)
    observacoes = Column(Text, nullable=True)
    status = Column(Enum(PedidoStatus), default=PedidoStatus.planejado)
    
    # Relacionamento com itens e ordens
    itens = relationship("PedidoVendaItem", back_populates="pedido", cascade="all, delete-orphan")
    ordens = relationship("OrdemProducao", back_populates="pedido")

    def __repr__(self):
        return f"<PedidoVenda(numero_pedido={self.numero_pedido}, cliente={self.cliente})>"


class PedidoVendaItem(Base):
    __tablename__ = "pedidos_venda_itens"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos_venda.id", ondelete="CASCADE"), nullable=False)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False)
    quantidade = Column(Float, nullable=False)

    # Relacionamentos
    pedido = relationship("PedidoVenda", back_populates="itens")
    produto = relationship("Produto")
