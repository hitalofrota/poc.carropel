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

def test_update_password(client):
    # 1️⃣ Cria usuário
    response = client.post("/auth/register", json={
        "nome": "Arthur",
        "email": "arthur_update@teste.com",
        "senha": "senha_antiga"
    })
    assert response.status_code == 200

    # 2️⃣ Faz login e obtém token
    response = client.post("/auth/login", json={
        "email": "arthur_update@teste.com",
        "senha": "senha_antiga"
    })
    assert response.status_code == 200
    token = response.json()["access_token"]

    # 3️⃣ Tenta trocar a senha com senha incorreta (deve falhar)
    response = client.put(
        "/auth/update-password",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "senha_atual": "senha_errada",
            "nova_senha": "nova_senha123",
            "repetir_nova_senha": "nova_senha123"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Senha atual incorreta."

    # 4️⃣ Tenta trocar a senha com confirmação incorreta (deve falhar)
    response = client.put(
        "/auth/update-password",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "senha_atual": "senha_antiga",
            "nova_senha": "nova_senha123",
            "repetir_nova_senha": "diferente123"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "As novas senhas não coincidem."

    # 5️⃣ Troca a senha corretamente
    response = client.put(
        "/auth/update-password",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "senha_atual": "senha_antiga",
            "nova_senha": "nova_senha123",
            "repetir_nova_senha": "nova_senha123"
        }
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Senha atualizada com sucesso."

    # 6️⃣ Faz login novamente com a nova senha (deve funcionar)
    response = client.post("/auth/login", json={
        "email": "arthur_update@teste.com",
        "senha": "nova_senha123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
