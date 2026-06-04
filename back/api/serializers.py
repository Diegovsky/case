from django.contrib.auth.models import AnonymousUser
from rest_framework.request import Request
from typing import Any, override
from api.models import User, UserProgress
from rest_framework import serializers


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


class ModelSerializer(serializers.ModelSerializer):
    @property
    def request(self) -> Request:
        request = self.context["request"]
        assert isinstance(request, Request)
        return request

    @property
    def maybe_user(self) -> User | AnonymousUser:
        user = self.request.user
        assert isinstance(user, (User, AnonymousUser))
        return user

    @property
    def user(self) -> User:
        user = self.request.user
        assert isinstance(user, User)
        return user

    def __getattr__(self, key: str):
        if (val := self.fields.get(key, None)) is not None:
            return val

        raise AttributeError(key)


class UserProgressSerializer(ModelSerializer):
    class Meta(Meta):
        model = UserProgress
        exclude = ["user"]


class UserSerializer(ModelSerializer):
    password = serializers.CharField(write_only=True)
    progress = UserProgressSerializer(required=False)
    is_admin = serializers.BooleanField(source="is_superuser", default=False)

    def validate_is_admin(self, value: bool):
        if value and not self.maybe_user.is_superuser:
            raise serializers.ValidationError("Only admins can create admins.")

        return value

    @override
    def update(self, instance: User, validated_data: dict[str, Any]):
        if (progress := validated_data.pop("progress", None)) is not None:
            try:
                self.progress.update(instance.progress, validated_data=progress)
            except User.progress.RelatedObjectDoesNotExist:
                progress["user"] = instance
                self.progress.create(progress)

        return super().update(instance, validated_data)

    class Meta(Meta):
        model = User
        fields = [
            "hashid",
            "first_name",
            "last_name",
            "is_admin",
            "email",
            "password",
            "progress",
        ]
