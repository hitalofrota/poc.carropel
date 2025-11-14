# app/tests/test_unidades_medida.py
def test_criar_unidade_medida(client):
    # Cria usuário e faz login
    client.post("/auth/register", json={
        "nome": "Arthur",
        "email": "arthur@teste.com",
        "senha": "123456"
    })
    token = client.post("/auth/login", json={
        "email": "arthur@teste.com",
        "senha": "123456"
    }).json()["access_token"]

    # Cria unidade de medida
    response = client.post(
        "/unidades_medida/",
        json={"nome": "Metro",
              "sigla": "m"
              },
        headers={"Authorization": f"Bearer {token}"}
    )
    print(response.json())

    assert response.status_code == 200
    print(response.json())

    assert response.json()["nome"] == "Metro"
