import pytest
from fastapi.testclient import TestClient

@pytest.fixture
def token(client: TestClient):
    register_payload = {
        "nome": "Arthur",
        "email": "arthur@teste.com",
        "senha": "123456"
    }
    # Tenta registrar — se já existir, ignora erro
    client.post("/auth/register", json=register_payload)

    login_payload = {
        "email": "arthur@teste.com",
        "senha": "123456"
    }
    response = client.post("/auth/login", json=login_payload)
    assert response.status_code == 200
    token = response.json()["access_token"]
    return token

@pytest.fixture
def unidade_medida(client: TestClient, token: str):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"nome": "Quilograma", "sigla": "kg"}
    response = client.post("/unidades_medida/", json=payload, headers=headers)
    assert response.status_code in (200, 201)
    return response.json()


def test_criar_material(client: TestClient, token: str, unidade_medida):
    """Testa a criação de um material autenticado"""
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "nome": "Aço Inox 304",
        "descricao": "Chapa laminada a frio",
        "codigo": "AC304",
        "unidade_medida_id": unidade_medida["id"],
        "estoque_atual": 10.5,
        "preco_unitario": 25.75
    }

    response = client.post("/materiais/", json=payload, headers=headers)
    print("Resposta criar material:", response.json())
    assert response.status_code in (200, 201)
    data = response.json()
    assert data["nome"] == payload["nome"]
    assert data["codigo"] == payload["codigo"]
    assert data["unidade_medida_id"] == unidade_medida["id"]


def test_listar_materiais(client: TestClient, token: str, unidade_medida):
    """Testa listagem de materiais autenticado"""
    headers = {"Authorization": f"Bearer {token}"}

    # Cria material antes
    client.post("/materiais/", json={
        "nome": "Cobre",
        "descricao": "Barra de cobre 1m",
        "codigo": "CB001",
        "unidade_medida_id": unidade_medida["id"],
        "estoque_atual": 5,
        "preco_unitario": 50.0
    }, headers=headers)

    response = client.get("/materiais/", headers=headers)
    print("Lista materiais:", response.json())
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) > 0


def test_atualizar_material(client: TestClient, token: str, unidade_medida):
    """Testa atualização de material autenticado"""
    headers = {"Authorization": f"Bearer {token}"}

    # Cria material
    resp = client.post("/materiais/", json={
        "nome": "Alumínio",
        "descricao": "Chapa 2mm",
        "codigo": "ALU2",
        "unidade_medida_id": unidade_medida["id"],
        "estoque_atual": 20,
        "preco_unitario": 18.0
    }, headers=headers)
    material = resp.json()

    update_payload = {
        "nome": "Alumínio Atualizado",
        "descricao": "Chapa 2mm tratada",
        "codigo": "ALU2",
        "unidade_medida_id": unidade_medida["id"],
        "estoque_atual": 25,
        "preco_unitario": 20.5
    }

    response = client.put(f"/materiais/{material['id']}", json=update_payload, headers=headers)
    print("Atualizar material:", response.json())
    assert response.status_code == 200
    data = response.json()
    assert data["nome"] == "Alumínio Atualizado"
    assert data["preco_unitario"] == 20.5


def test_deletar_material(client: TestClient, token: str, unidade_medida):
    """Testa exclusão de material autenticado"""
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/materiais/", json={
        "nome": "Latão",
        "descricao": "Tubo 3/4\"",
        "codigo": "LAT123",
        "unidade_medida_id": unidade_medida["id"],
        "estoque_atual": 3,
        "preco_unitario": 70.0
    }, headers=headers)
    material_id = resp.json()["id"]

    response = client.delete(f"/materiais/{material_id}", headers=headers)
    assert response.status_code in (200, 204)

    # verificar se foi realmente deletado
    resp_check = client.get(f"/materiais/{material_id}", headers=headers)
    assert resp_check.status_code == 404
