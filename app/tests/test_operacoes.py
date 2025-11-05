import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, Base, engine

client = TestClient(app)

# Cria o banco antes de rodar os testes
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
def centros_trabalho(auth_header):
    centros = []
    for i in range(2):
        response = client.post(
            "/centros_trabalho/",
            json={"nome": f"Centro {i+1}", "descricao": f"Descrição {i+1}"},
            headers=auth_header
        )
        assert response.status_code in (200, 201)
        centros.append(response.json())
    return centros


def test_criar_operacao(auth_header, centros_trabalho):
    centro_ids = [c["id"] for c in centros_trabalho]

    response = client.post(
        "/operacoes/",
        json={
            "nome": "Operação de Solda",
            "descricao": "Processo de soldagem",
            "centros_trabalho_ids": centro_ids
        },
        headers=auth_header
    )

    assert response.status_code in (200, 201)
    data = response.json()
    assert data["nome"] == "Operação de Solda"
    assert len(data["centros_trabalho"]) == 2


def test_listar_operacoes(auth_header):
    response = client.get("/operacoes/", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_atualizar_operacao(auth_header):
    # Pega uma operação existente
    operacoes = client.get("/operacoes/", headers=auth_header).json()
    operacao_id = operacoes[0]["id"]

    response = client.put(
        f"/operacoes/{operacao_id}",
        json={"nome": "Operação Atualizada"},
        headers=auth_header
    )

    assert response.status_code == 200
    data = response.json()
    assert data["nome"] == "Operação Atualizada"


def test_deletar_operacao(auth_header):
    # Pega uma operação existente
    operacoes = client.get("/operacoes/", headers=auth_header).json()
    operacao_id = operacoes[0]["id"]

    response = client.delete(f"/operacoes/{operacao_id}", headers=auth_header)
    assert response.status_code == 200
    assert response.json()["detail"] == "Operação deletada com sucesso"
