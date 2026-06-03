from api.models import User
from faker import Faker
import pytest

from .client import Client

faker = Faker()


def create_user(
    email: str,
    *,
    admin=False,
    password="123",
) -> User:
    user, created = User.objects.get_or_create(
        first_name=faker.name(),
        username=email,
        defaults={
            "email": email,
            "is_superuser": admin,
        },
    )
    if created:
        user.set_password(password)
        user.save()
    return user


@pytest.fixture
def client() -> Client:
    return Client()


def auth_client(client: Client, is_admin: bool) -> User:
    email = faker.email()
    password = faker.password()
    user = create_user(
        email=email,
        password=password,
        admin=is_admin,
    )
    client.login(email, password)
    return user


@pytest.fixture
def user(client: Client, db) -> User:
    return auth_client(client, False)


@pytest.fixture
def admin(client: Client, db) -> User:
    return auth_client(client, True)
