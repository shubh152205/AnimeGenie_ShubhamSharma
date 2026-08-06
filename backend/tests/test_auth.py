import pytest

def test_jwt_register_and_login(client):
    username = "testuser_jwt"
    password = "password123"
    email = "testjwt@salesgenie.ai"

    # 1. Test Register
    reg_response = client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": password}
    )
    assert reg_response.status_code == 200
    reg_data = reg_response.json()
    assert "access_token" in reg_data
    assert reg_data["username"] == username
    token = reg_data["access_token"]

    # 2. Test Protected Route with Token
    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["username"] == username

    # 3. Test Login
    login_response = client.post(
        "/api/auth/login",
        json={"username": username, "password": password}
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert "access_token" in login_data

def test_jwt_invalid_login(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "nonexistent_user", "password": "wrongpassword"}
    )
    assert response.status_code == 401
