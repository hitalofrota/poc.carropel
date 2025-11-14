import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

client = TestClient(app)


# --- CONFIGURAÇÃO DO BANCO DE TESTES ---
@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


# --- AUTENTICAÇÃO ---
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


# --- TESTES UNIDADE DE MEDIDA E PRODUTO ---

def test_criar_unidade_medida(auth_header):
    """Cria uma unidade de medida para ser usada pelos produtos"""
    response = client.post(
        "/unidades_medida/",
        json={"nome": "Quilograma", "sigla": "kg"},
        headers=auth_header
    )
    assert response.status_code in (200, 201)
    data = response.json()
    assert data["nome"] == "Quilograma"
    assert data["sigla"] == "kg"


def test_listar_unidades_medida(auth_header):
    response = client.get("/unidades_medida/", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_criar_produto(auth_header):
    """Cria um produto com unidade de medida existente"""
    unidades = client.get("/unidades_medida/", headers=auth_header).json()
    unidade_id = unidades[0]["id"]

    response = client.post(
        "/produtos/",
        json={
            "nome": "Chassi",
            "codigo": "PROD001",
            "descricao": "Estrutura principal do veículo",
            "custo_unitario": 200.0,
            "venda_unitario": 400.0
        },
        headers=auth_header
    )
    assert response.status_code in (200, 201)
    data = response.json()
    assert data["nome"] == "Chassi"
    assert data["codigo"] == "PROD001"


def test_listar_produtos(auth_header):
    response = client.get("/produtos/", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_atualizar_produto(auth_header):
    produtos = client.get("/produtos/", headers=auth_header).json()
    produto_id = produtos[0]["id"]

    response = client.put(
        f"/produtos/{produto_id}",
        json={"nome": "Chassi Atualizado"},
        headers=auth_header
    )
    assert response.status_code == 200
    data = response.json()
    assert data["nome"] == "Chassi Atualizado"


# --- TESTES DE MATERIAL E RELAÇÃO PRODUTO-MATERIAL ---

def test_criar_material(auth_header):
    """Cria um material para testar relação produto-material"""
    unidades = client.get("/unidades_medida/", headers=auth_header).json()
    unidade_id = unidades[0]["id"]

    response = client.post(
        "/materiais/",
        json={
            "nome": "Aço Inox",
            "descricao": "Aço 304L",
            "codigo": "MAT001",
            "unidade_medida_id": unidade_id,
            "custo_unitario": 25.5
        },
        headers=auth_header
    )
    assert response.status_code in (200, 201)
    data = response.json()
    assert data["codigo"] == "MAT001"


def test_relacionar_produto_material(auth_header):
    """Relaciona um produto a um material"""
    produtos = client.get("/produtos/", headers=auth_header).json()
    assert produtos, "Nenhum produto encontrado"
    produto_id = produtos[0]["id"]

    materiais = client.get("/materiais/", headers=auth_header).json()
    assert materiais, "Nenhum material encontrado"
    material_id = materiais[0]["id"]

    response = client.post(
        f"/produtos/{produto_id}/materiais",
        json={"material_id": material_id, "quantidade": 3.5},
        headers=auth_header
    )
    assert response.status_code in (200, 201), response.text
    data = response.json()

    # A API retorna um objeto aninhado? Corrige o acesso:
    if "material_id" in data:
        assert data["material_id"] == material_id
    else:
        assert data["material"]["id"] == material_id

    assert data["quantidade"] == 3.5


def test_deletar_produto(auth_header):
    produtos = client.get("/produtos/", headers=auth_header).json()
    produto_id = produtos[0]["id"]

    response = client.delete(f"/produtos/{produto_id}", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert "deletado" in data["detail"].lower()
