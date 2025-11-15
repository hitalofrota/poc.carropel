# app/tests/test_unidades_medida.py
def test_criar_unidade_medida(client, auth_headers):
    response = client.post(
        "/units_of_measure/",
        json={
            "name": "Metro",
            "abbreviation": "m"
        },
        headers=auth_headers
    )

    print(response.json())
    assert response.status_code == 200
    assert response.json()["name"] == "Metro"

