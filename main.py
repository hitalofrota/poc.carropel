from fastapi import FastAPI
from app.database import Base, engine
from app.routes import users

# Cria as tabelas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FastAPI + PostgreSQL POC")

app.include_router(users.router)


@app.get("/")
def root():
    return {"message": "API FastAPI + PostgreSQL funcionando!"}
