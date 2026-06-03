from api.models import User
import pytest
from faker import Faker
from tests.client import Client, ClientException

faker = Faker()


def test_create_user(client: Client, db):
    del db
    data = {
        "email": faker.email(),
        "password": faker.password(),
    }
    user = client.post("/user/", data)
    assert user["email"] == data["email"]
    assert user["is_admin"] is False
    assert "password" not in user


def test_user_login(user: User, client: Client):
    expected = client.get("/user/me/")
    assert user.hashid == expected["hashid"]


def create_user_admin_fail(client: Client):
    data = {
        "email": faker.email(),
        "password": faker.password(),
        "is_admin": True,
    }
    with pytest.raises(ClientException) as e:
        client.post("/user/", data)

    assert e.value.response.status_code == 400


def test_create_user_admin_fail_anon(client: Client, db):
    del db
    create_user_admin_fail(client)


def test_create_user_admin_fail_authed(user, client: Client):
    create_user_admin_fail(client)


def test_create_user_admin(admin: User, client: Client, db):
    data = {
        "email": faker.email(),
        "password": faker.password(),
        "is_admin": True,
    }
    user = client.post("/user/", data)
    assert user["is_admin"] is True
    assert user["hashid"] != admin.hashid
    assert user["email"] != admin.email
