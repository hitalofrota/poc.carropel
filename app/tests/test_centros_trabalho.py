import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

client = TestClient(app)

# Configuração do banco de testes
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


def test_criar_centro_trabalho(auth_header):
    response = client.post(
        "/centros_trabalho/",
        json={"nome": "Centro de Usinagem", "descricao": "Setor de usinagem de peças"},
        headers=auth_header
    )
    assert response.status_code in (200, 201)
    data = response.json()
    assert data["nome"] == "Centro de Usinagem"


def test_listar_centros_trabalho(auth_header):
    response = client.get("/centros_trabalho/", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_atualizar_centro_trabalho(auth_header):
    centros = client.get("/centros_trabalho/", headers=auth_header).json()
    centro_id = centros[0]["id"]

    response = client.put(
        f"/centros_trabalho/{centro_id}",
        json={"nome": "Centro Atualizado"},
        headers=auth_header
    )

    assert response.status_code == 200
    data = response.json()
    assert data["nome"] == "Centro Atualizado"


def test_deletar_centro_trabalho(auth_header):
    centros = client.get("/centros_trabalho/", headers=auth_header).json()
    centro_id = centros[0]["id"]

    response = client.delete(f"/centros_trabalho/{centro_id}", headers=auth_header)
    assert response.status_code == 200
    assert response.json()["detail"] == "Centro de trabalho deletado com sucesso"
