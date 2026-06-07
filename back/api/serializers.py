from api.other_serializers import HashIdDictSerializer
from rest_framework.serializers import Serializer
from rest_framework.fields import SerializerMethodField
from django.contrib.auth.models import AnonymousUser
from rest_framework.request import Request
from typing import Any, overload
from api.models import User, Module, Topic, ChatMessage, Test
from rest_framework import serializers

# from django_pydantic_field.rest_framework import SchemaField as PydanticSchemaField
from django_pydantic_field.v2.rest_framework import SchemaField
# from drf_spectacular.drainage import set_override


# class SchemaField(PydanticSchemaField):
#     def __init__(self, schema, **kwargs):
#         set_override(self, "field", schema)
#         super().__init__(schema=schema, **kwargs)


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
        kwargs["slug_field"] = slug_field
        super().__init__(**kwargs)


class ModelSerializer(serializers.ModelSerializer):
    serializer_related_field = HashidField

    @overload
    def __init__(self, *a, many_dict=bool, **kw): ...
    @overload
    def __init__(self, *a, **kw): ...

    def __init__(self, *a, **kw):
        return super().__init__(*a, **kw)

    def __new__(cls, *a, **kw):
        many_dict = kw.pop("many_dict", False)
        if many_dict:
            return HashIdDictSerializer.many_init(cls, *a, **kw)
        return super().__new__(cls, *a, **kw)

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


class TopicSerializer(ModelSerializer):
    content = SerializerMethodField()
    tests = SchemaField(list[Test])
    module = SerializerMethodField()

    def get_module(self, instance: Topic) -> str:
        return instance.module.hashid

    def get_content(self, instance: Topic) -> str:
        return instance.content.read()

    class Meta(Meta):
        list_serializer_class = HashIdDictSerializer
        model = Topic


class BriefTopicSerializer(ModelSerializer):
    class Meta(Meta):
        model = Topic
        exclude = ["module", "content", "tests"]


class ModuleSerializer(ModelSerializer):
    topics = BriefTopicSerializer(many_dict=True)

    class Meta(Meta):
        model = Module
        list_serializer_class = HashIdDictSerializer


class UserSerializer(ModelSerializer):
    password = serializers.CharField(write_only=True)
    is_admin = serializers.BooleanField(source="is_superuser", default=False)
    messages = ChatMessageSerializer(read_only=True, many=True)
    available_topics = SerializerMethodField()
    available_modules = SerializerMethodField()

    def get_available_topics(self, instance: User) -> list[str]:
        return list(instance.available_topics.values_list("hashid", flat=True))

    def get_available_modules(self, instance: User) -> list[str]:
        return list(instance.available_modules.values_list("hashid", flat=True))

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
            "info",
            "email",
            "password",
            "messages",
            "completed_topics",
            "completed_modules",
            "available_topics",
            "available_modules",
        ]


class AIUserInfo(ModelSerializer):
    completed_topics = serializers.SerializerMethodField()
    completed_modules = serializers.SerializerMethodField()
    available_topics = serializers.SerializerMethodField()
    available_modules = serializers.SerializerMethodField()

    def make_data(self, queryset):
        return list(queryset.values_list("name", "hashid"))

    def get_completed_topics(self, model: User) -> list[str]:
        return self.make_data(model.completed_topics)

    def get_completed_modules(self, model: User) -> list[str]:
        return self.make_data(model.completed_modules)

    def get_available_topics(self, model: User) -> list[str]:
        return self.make_data(model.available_topics)

    def get_available_modules(self, model: User) -> list[str]:
        return self.make_data(model.available_modules)

    class Meta(Meta):
        model = User
        fields = [
            "info",
            "first_name",
            "last_name",
            "completed_topics",
            "completed_modules",
            "available_topics",
            "available_modules",
        ]


class SendMessageSerializer(ChatMessageSerializer):
    context = serializers.CharField(write_only=True)

    def create(self, validated_data):
        validated_data.pop("context", None)
        return super().create(validated_data)


class ReceiveMessagesSerializer(Serializer):
    messages = ChatMessageSerializer(many=True)
    updated_info = serializers.BooleanField()
    extra = serializers.JSONField()


class CompleteSectionSerializer(Serializer):
    hashid = HashidField(queryset=Topic.objects.all())
