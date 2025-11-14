from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)

class UnidadeMedida(Base):
    __tablename__ = "unidades_medida"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(50), nullable=False, unique=True)       # Ex: Quilograma
    sigla = Column(String(10), nullable=False, unique=True)      # Ex: kg

    # relacionamento inverso — lista de materiais usando essa unidade
    materiais = relationship("Material", back_populates="unidade_medida")

class Material(Base):
    __tablename__ = "materiais"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    descricao = Column(String(255), nullable=True)
    codigo = Column(String(50), unique=True, index=True, nullable=False)
    unidade_medida_id = Column(Integer, ForeignKey("unidades_medida.id"), nullable=False)
    estoque_atual = Column(Float, default=0)
    preco_unitario = Column(Float, nullable=False)
    data_cadastro = Column(DateTime(timezone=True), server_default=func.now())

    # relacionamento com unidade de medida
    unidade_medida = relationship("UnidadeMedida", back_populates="materiais")

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
