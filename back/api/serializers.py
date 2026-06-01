from typing import Any
from api.models import User, UserProgress
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer


class MetaMeta(type):
    def __new__(
        cls,
        name: str,
        bases: tuple[type["Meta"], ...],
        namespace: dict[str, Any],
        **kw,
    ):

        if len(bases) > 0:
            if "fields" in namespace:
                namespace["exclude"] = None

            else:
                namespace["exclude"] = bases[0].exclude + namespace.get("exclude", [])

        return super().__new__(cls, name, bases, namespace, **kw)


class Meta(metaclass=MetaMeta):
    exclude: None | list = ["id", "created_at", "modified_at"]
    fields: None | list = None


class UserProgressSerializer(ModelSerializer):
    class Meta(Meta):
        model = UserProgress
        exclude = ["user"]


class UserSerializer(ModelSerializer):
    password = serializers.CharField(write_only=True)
    progress = UserProgressSerializer()

    class Meta(Meta):
        model = User
        fields = ["hashid", "first_name", "last_name", "email", "password", "progress"]
