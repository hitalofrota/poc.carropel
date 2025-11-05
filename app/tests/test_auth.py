# app/tests/test_auth.py
def test_register_and_login(client):
    # Cria usuário
    response = client.post("/auth/register", json={
        "nome": "Arthur",
        "email": "arthur@teste.com",
        "senha": "123456"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "arthur@teste.com"

    # Faz login
    response = client.post("/auth/login", json={
        "email": "arthur@teste.com",
        "senha": "123456"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
