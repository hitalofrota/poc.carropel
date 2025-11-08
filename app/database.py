# app/database.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings_db

# ==========================
# CONFIGURAÇÃO DO BANCO
# ==========================

# URL do banco de dados (definida em app/core/config.py)
# Exemplo: postgresql+psycopg2://user:password@db:5432/mydatabase
DATABASE_URL = settings_db.DATABASE_URL

# Cria o engine síncrono
engine = create_engine(
    DATABASE_URL,
    echo=False,  # coloque True se quiser ver os SQLs no log
)

# Cria a fábrica de sessões
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base para os modelos ORM
Base = declarative_base()

# ==========================
# DEPENDÊNCIA FASTAPI
# ==========================

def get_db():
    """
    Dependência do FastAPI para obter uma sessão do banco.
    Garante fechamento automático após a requisição.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
