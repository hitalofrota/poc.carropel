from fastapi import FastAPI
from app.database import Base, engine
from app.routes import (users, 
                        auth, 
                        unidades_medida, 
                        materiais,
                        centros_trabalho,
                        maquinas,
                        operacoes,
                        ordens_producao,
                        produtos,
                        produto_material,
                        ordem_material,
                        subproduto,
                        pedidos_venda,
                        roteiro_producao,
                        upload_csv
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
app.include_router(ordens_producao.router)
app.include_router(produtos.router)
app.include_router(produto_material.router)
app.include_router(ordem_material.router)
app.include_router(subproduto.router)
app.include_router(pedidos_venda.router)
app.include_router(roteiro_producao.router)
app.include_router(upload_csv.router)

@app.get("/")
def root():
    return {"message": "API FastAPI + JWT funcionando!"}
