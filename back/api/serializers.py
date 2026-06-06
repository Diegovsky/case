from rest_framework.serializers import Serializer
from rest_framework.fields import SerializerMethodField
from django.contrib.auth.models import AnonymousUser
from rest_framework.request import Request
from typing import Any, override
from api.models import User, Module, ModuleSection, ChatMessage
from rest_framework import serializers

from django_pydantic_field.fields import PydanticSchemaField as ModelSchemaField
from django_pydantic_field.rest_framework import SchemaField as PydanticSchemaField
from drf_spectacular.drainage import set_override


class SchemaField(PydanticSchemaField):
    def __init__(self, schema, **kwargs):
        set_override(self, "field", schema)
        super().__init__(schema=schema, **kwargs)


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


class HashidField(serializers.SlugRelatedField):
    def __init__(self, **kwargs) -> None:
        slug_field = "id"
        if (queryset := kwargs.get("queryset", None)) is not None and hasattr(
            queryset.model, "hashid"
        ):
            slug_field = "hashid"
        super().__init__(slug_field, **kwargs)


class ModelSerializer(serializers.ModelSerializer):
    serializer_related_field = HashidField

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


class ChatMessageSerializer(ModelSerializer):
    class Meta(Meta):
        model = ChatMessage
        exclude = ["user"]
        extra_kwargs = {"sender": {"read_only": True}}


class ModuleSectionSerializer(ModelSerializer):
    content = SerializerMethodField()

    def get_content(self, instance: ModuleSection) -> str:
        return instance.content.read()

    class Meta(Meta):
        model = ModuleSection
        exclude = ["module"]


class BriefModuleSectionSerializer(ModelSerializer):
    class Meta(Meta):
        model = ModuleSection
        exclude = ["module", "content"]


class ModuleSerializer(ModelSerializer):
    sections = BriefModuleSectionSerializer(many=True)

    class Meta(Meta):
        model = Module


class UserSerializer(ModelSerializer):
    password = serializers.CharField(write_only=True)
    is_admin = serializers.BooleanField(source="is_superuser", default=False)
    interests = SchemaField(list[str])
    messages = ChatMessageSerializer(read_only=True, many=True)
    completed_sections = BriefModuleSectionSerializer(read_only=True, many=True)
    completed_modules = ModuleSerializer(read_only=True, many=True)
    available_sections = BriefModuleSectionSerializer(read_only=True, many=True)
    available_modules = ModuleSerializer(read_only=True, many=True)

    def validate_is_admin(self, value: bool):
        if value and not self.maybe_user.is_superuser:
            raise serializers.ValidationError("Only admins can create admins.")

        return value

    class Meta(Meta):
        model = User
        fields = [
            "hashid",
            "first_name",
            "last_name",
            "is_admin",
            "email",
            "password",
            "messages",
            "interests",
            "completed_sections",
            "completed_modules",
            "available_sections",
            "available_modules",
        ]


class AIUserInfo(ModelSerializer):
    interests = SchemaField(list[str])
    completed_sections = serializers.SerializerMethodField()
    completed_modules = serializers.SerializerMethodField()

    def get_completed_sections(self, model: User) -> list[str]:
        return list(model.completed_sections.values_list("name", flat=True))

    def get_completed_modules(self, model: User) -> list[str]:
        return list(model.completed_modules.values_list("name", flat=True))

    class Meta(Meta):
        model = User
        fields = [
            "first_name",
            "last_name",
            "interests",
            "completed_sections",
            "completed_modules",
        ]


class SendMessageSerializer(Serializer):
    text = serializers.CharField()
    context = serializers.CharField()


class CompleteSectionSerializer(Serializer):
    hashid = HashidField(queryset=ModuleSection.objects.all())
