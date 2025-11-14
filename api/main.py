from fastapi import FastAPI
from app.database import Base, engine
from app.routes import (users, 
                        auth, 
                        unidades_medida, 
                        materiais,
                        centros_trabalho,
                        maquinas,
                        operacoes
                        )


Base.metadata.create_all(bind=engine)

app = FastAPI(title="FastAPI + PostgreSQL + JWT")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(unidades_medida.router)
app.include_router(materiais.router)
app.include_router(centros_trabalho.router)
app.include_router(maquinas.router)
app.include_router(operacoes.router)

@app.get("/")
def root():
    return {"message": "API FastAPI + JWT funcionando!"}
