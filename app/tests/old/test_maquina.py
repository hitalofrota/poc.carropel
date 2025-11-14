import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="module")
def token():
    # Cria usuário e faz login
    client.post("/auth/register", json={
        "nome": "Arthur",
        "email": "arthur@teste.com",
        "senha": "123456"
    })
    response = client.post("/auth/login", json={
        "email": "arthur@teste.com",
        "senha": "123456"
    })
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def centro_trabalho(auth_header):
    response = client.post(
        "/centros_trabalho/",
        json={"nome": "Centro Soldagem", "descricao": "Área de solda MIG/MAG"},
        headers=auth_header
    )
    assert response.status_code in (200, 201)
    return response.json()


def test_criar_maquina(auth_header, centro_trabalho):
    response = client.post(
        "/maquinas/",
        json={
            "nome": "Máquina de Solda MIG-01",
            "codigo": "MIG-001",
            "descricao": "Solda de estrutura leve",
            "centro_trabalho_id": centro_trabalho["id"]
        },
        headers=auth_header
    )
    assert response.status_code in (200, 201)
    data = response.json()
    assert data["nome"] == "Máquina de Solda MIG-01"
    assert data["centro_trabalho"]["id"] == centro_trabalho["id"]


def test_listar_maquinas(auth_header):
    response = client.get("/maquinas/", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_atualizar_maquina(auth_header):
    maquinas = client.get("/maquinas/", headers=auth_header).json()
    maquina_id = maquinas[0]["id"]

    response = client.put(
        f"/maquinas/{maquina_id}",
        json={"nome": "Máquina Atualizada"},
        headers=auth_header
    )

    assert response.status_code == 200
    data = response.json()
    assert data["nome"] == "Máquina Atualizada"


def test_deletar_maquina(auth_header):
    maquinas = client.get("/maquinas/", headers=auth_header).json()
    maquina_id = maquinas[0]["id"]

    response = client.delete(f"/maquinas/{maquina_id}", headers=auth_header)
    assert response.status_code == 200
    assert response.json()["detail"] == "Máquina deletada com sucesso"
