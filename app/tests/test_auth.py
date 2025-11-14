# app/tests/test_auth.py
def test_register_and_login(client):
    # Cria usuário
    response = client.post("/auth/register", json={
        "name": "Arthur",
        "email": "arthur@teste.com",
        "password": "123456"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "arthur@teste.com"

    # Faz login
    response = client.post("/auth/login", json={
        "email": "arthur@teste.com",
        "password": "123456"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data

def test_update_password(client):
    # 1️⃣ Cria usuário
    response = client.post("/auth/register", json={
        "name": "Arthur",
        "email": "arthur_update@teste.com",
        "password": "password_antiga"
    })
    assert response.status_code == 200

    # 2️⃣ Faz login e obtém token
    response = client.post("/auth/login", json={
        "email": "arthur_update@teste.com",
        "password": "password_antiga"
    })
    assert response.status_code == 200
    token = response.json()["access_token"]

    # 3️⃣ Tenta trocar a password com password incorreta (deve falhar)
    response = client.put(
        "/auth/update-password",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "current_password": "password_errada",
            "new_password": "new_password123",
            "repeat_new_password": "new_password123"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "password atual incorreta."

    # 4️⃣ Tenta trocar a password com confirmação incorreta (deve falhar)
    response = client.put(
        "/auth/update-password",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "current_password": "password_antiga",
            "new_password": "new_password123",
            "repeat_new_password": "diferente123"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "As novas passwords não coincidem."

    # 5️⃣ Troca a password corretamente
    response = client.put(
        "/auth/update-password",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "current_password": "password_antiga",
            "new_password": "new_password123",
            "repeat_new_password": "new_password123"
        }
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Senha atualizada com sucesso."

    # 6️⃣ Faz login novamente com a nova password (deve funcionar)
    response = client.post("/auth/login", json={
        "email": "arthur_update@teste.com",
        "password": "new_password123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
