from typing import Any
import json
from rest_framework.response import Response
from rest_framework.test import APIClient


class ClientException(Exception):
    response: Response
    content: Any

    def __init__(self, content: Any, response: Response):
        super().__init__(f"Error [{response.status_code}]: {content}")
        self.response = response
        self.content = content


type BodyClass[T] = type[T] | type[dict]


class Client:
    _client: APIClient

    def __init__(self):
        self._client = APIClient()
        self._access = None

    def _process_response[T](self, response: Response, cls: BodyClass[T]) -> T:
        try:
            content = json.loads(response.content)
        except:
            raise ClientException(response.content.decode("utf-8"), response)

        if not 200 <= response.status_code < 300:
            raise ClientException(content, response)

        assert isinstance(content, cls)
        return content

    def post[T](self, path: str, data: dict, cls: BodyClass[T] = dict) -> T:
        response = self._client.post(path, data=data, format="json")
        return self._process_response(response, cls)

    def get[T](
        self, path: str, cls: BodyClass[T] = dict, params: dict | None = None
    ) -> T:
        response = self._client.get(path, data=params)
        return self._process_response(response, cls)

    def login(self, email: str, password: str) -> dict:
        data = self.post(
            "/auth/login/", data={"username": email, "password": password}, cls=dict
        )

        self._access = data["access"]
        self._refresh = data["refresh"]
        self._client.credentials(HTTP_AUTHORIZATION=f"Bearer {self._access}")
        return data["user"]

    def logout(self):
        self._access = None
        self._refresh = None
        self._client.credentials()

    @property
    def is_authenticated(self) -> bool:
        return self._access is not None
