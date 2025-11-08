import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine
from datetime import datetime

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
        "email": "arthur_ordem@teste.com",
        "senha": "123456"
    })
    response = client.post("/auth/login", json={
        "email": "arthur_ordem@teste.com",
        "senha": "123456"
    })
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


# --- TESTES ORDEM DE PRODUÇÃO ---

def test_setup_dados_iniciais(auth_header):
    """Cria unidade de medida, material e produto necessários antes da ordem"""
    # Unidade de medida
    client.post(
        "/unidades_medida/",
        json={"nome": "Quilograma", "sigla": "kg"},
        headers=auth_header
    )

    unidades = client.get("/unidades_medida/", headers=auth_header).json()
    unidade_id = unidades[0]["id"]

    # Material
    resp_mat = client.post(
        "/materiais/",
        json={
            "nome": "Aço Inox1",
            "descricao": "Aço 304L",
            "codigo": "MAT0012",
            "unidade_medida_id": unidade_id,
            "custo_unitario": 25.5
        },
        headers=auth_header
    )
    assert resp_mat.status_code in (200, 201)

    materiais = client.get("/materiais/", headers=auth_header)
    assert materiais.status_code == 200
    materiais_data = materiais.json()
    print(materiais_data)
    assert any(m["codigo"] == "MAT0012" for m in materiais_data), "Material não encontrado"

    resp_prod = client.post(
        "/produtos/",
        json={
            "nome": "Chassi",
            "codigo": "PROD001",
            "descricao": "Estrutura principal",
            "custo_unitario": 200.0,
            "venda_unitario": 400.0
        },
        headers=auth_header
    )
    assert resp_mat.status_code in (200, 201)

    produtos = client.get("/produtos/", headers=auth_header)
    assert produtos.status_code == 200
    produtos_data = produtos.json()
    assert any(p["codigo"] == "PROD001" for p in produtos_data), "Produto não encontrado"

def test_criar_ordem_producao(auth_header):
    produtos = client.get("/produtos/", headers=auth_header).json()
    print(produtos)
    produto_id = produtos[0]["id"]

    response = client.post(
        "/ordens/",
        json={
            "codigo": "OP001",
            "produto_id": 1,
            "quantidade_planejada": 100,
            "data_criacao": datetime.utcnow().isoformat(),
            "status": "planejada"
        },
        headers=auth_header
    )

    assert response.status_code in (200, 201)
    data = response.json()
    assert data["codigo"] == "OP001"
    assert data["produto_id"] == produto_id


def test_listar_ordens_producao(auth_header):
    response = client.get("/ordens/", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_atualizar_ordem_producao(auth_header):
    ordens = client.get("/ordens/", headers=auth_header).json()
    ordem_id = ordens[0]["id"]

    response = client.put(
        f"/ordens/{ordem_id}",
        json={
            "quantidade_planejada": 200.0,
            "status": "em_producao",
            "observacoes": "Iniciada a produção do lote principal"
        },
        headers=auth_header
    )

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["quantidade_planejada"] == 200.0
    assert data["status"] == "em_producao"


def test_relacionar_material_ordem(auth_header):
    # Busca um material existente
    materiais = client.get("/materiais/", headers=auth_header).json()
    assert materiais, "Nenhum material encontrado para o teste"
    material_id = materiais[0]["id"]

    # Busca um produto existente
    produtos = client.get("/produtos/", headers=auth_header).json()
    assert produtos, "Nenhum produto encontrado para criar ordem"
    produto_id = produtos[0]["id"]

    # Cria ordem de produção
    ordem = client.post(
        "/ordens/",
        json={
            "codigo": "OP002",
            "produto_id": produto_id,
            "quantidade_planejada": 100,
            "data_criacao": datetime.utcnow().isoformat(),
            "status": "planejada"
        },
        headers=auth_header
    ).json()

    # Relaciona material à ordem (sem enviar ordem_id no corpo)
    response = client.post(
        f"/ordens/{ordem['id']}/materiais",
        json={
            "material_id": material_id,
            "quantidade_usada": 12.5
        },
        headers=auth_header
    )
    assert response.status_code in (200, 201), response.text

    # Verifica se o material está listado
    response_list = client.get(f"/ordens/{ordem['id']}/materiais", headers=auth_header)
    assert response_list.status_code == 200
    materiais = response_list.json()
    assert any(m["id"] == material_id for m in materiais)






def test_deletar_ordem_producao(auth_header):
    ordens = client.get("/ordens/", headers=auth_header).json()
    ordem_id = ordens[0]["id"]

    response = client.delete(f"/ordens/{ordem_id}", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert "deletada" in data["detail"].lower()
