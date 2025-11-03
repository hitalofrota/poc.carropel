from fastapi import FastAPI
from app.database import Base, engine
from app.routes import users, auth

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FastAPI + PostgreSQL + JWT")

app.include_router(auth.router)
app.include_router(users.router)


@app.get("/")
def root():
    return {"message": "API FastAPI + JWT funcionando!"}
