import json
from django.db.transaction import atomic
from rest_framework.response import Response
from api.ai import AI_CLIENT, Config
from rest_framework.request import Request
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.mixins import CreateModelMixin, RetrieveModelMixin, UpdateModelMixin
import functools
from typing import override
from rest_framework import permissions
from rest_framework.viewsets import ViewSetMixin
from rest_framework.routers import DefaultRouter
from django.utils.text import slugify
from api.serializers import (
    UserSerializer,
    ModelSerializer,
    ModuleSectionSerializer,
    ModuleSerializer,
    ChatMessageSerializer,
    SendMessageSerializer,
    AIUserInfo,
    CompleteSectionSerializer,
)
from api.models import User, Model, Module, ChatMessage, ModuleSection
from api.router import ImplicitRouter
from rest_framework import viewsets

router = DefaultRouter()
implicit_router = ImplicitRouter()


def autourl(
    cls: type[ViewSetMixin] | None = None, implicit=False, name: str | None = None
):
    if cls is None:
        return functools.partial(autourl, implicit=implicit, name=name)

    slug = slugify(cls.__name__).removesuffix("viewset") if name is None else name
    if implicit:
        implicit_router.register(slug, cls, slug)
    else:
        router.register(slug, cls, slug)

    return cls


class ViewSetMixin(viewsets.GenericViewSet):
    lookup_field = "hashid"
    model: type[Model] | None = None

    @property
    def user(self) -> User:
        user = self.request.user
        assert isinstance(user, User)
        return user

    def get_queryset(self):
        if self.model is not None:
            return self.model.objects.all()
        elif (ser := self.serializer_class) is not None and issubclass(
            ser, ModelSerializer
        ):
            return ser.Meta.model.objects.all()
        else:
            return super().get_queryset()


class ModelViewSet(ViewSetMixin, viewsets.ModelViewSet):
    pass


@autourl
class ModuleViewSet(ModelViewSet):
    serializer_class = ModuleSerializer


@autourl(name="section")
class ModuleSectionViewSet(ModelViewSet):
    serializer_class = ModuleSectionSerializer


@autourl(implicit=True)
class UserViewSet(CreateModelMixin, RetrieveModelMixin, UpdateModelMixin, ViewSetMixin):
    serializer_class = UserSerializer

    @override
    def get_object(self):
        return self.user

    @override
    def get_permissions(self):
        # Allow anyone to create an account
        if self.action == "create":
            permission_classes = [permissions.AllowAny]
        else:
            return super().get_permissions()

        return [permission() for permission in permission_classes]

    @extend_schema(
        request=CompleteSectionSerializer(),
        responses={204: None},
    )
    @action(methods=["post"], detail=True)
    @atomic
    def complete_section(self, request: Request):
        ser = CompleteSectionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        section: ModuleSection = ser.validated_data["hashid"]
        self.user.completed_sections.add(section)

        return Response(status=204)

    @extend_schema(
        request=SendMessageSerializer(),
        responses={200: ChatMessageSerializer(many=True)},
    )
    @action(methods=["post"], detail=True)
    @atomic
    def send_message(self, request: Request):
        ser = SendMessageSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        text = data["text"]
        context = data["context"]

        ser = ChatMessageSerializer(
            ChatMessage.objects.create(
                text=text,
                sender=ChatMessage.Sender.USER,
                user=self.user,
            )
        )

        messages = ChatMessageSerializer(
            many=True, instance=self.user.messages.all()
        ).data

        messages = [
            {
                "role": m["sender"],
                "parts": [{"text": m["text"]}],
            }
            for m in messages
        ]

        print(messages)
        user_info = json.dumps(AIUserInfo(self.user).data)

        system_prompt = [
            """
                You are a helpful personal teacher.
                Your response should follow this schema:
               {
                   'sender': 'model',
                   'text': <your response>,
               }""",
            f"User info: {user_info}",
        ]
        if context:
            system_prompt.append(f"""
            Here's some context of what the user sees:
            {context}
            """)

        new_message = AI_CLIENT.call_model(
            messages,
            config=Config(system_instruction=system_prompt),
        )
        print(new_message)

        resp_ser = ChatMessageSerializer(data=new_message)
        resp_ser.is_valid(raise_exception=True)

        data = resp_ser.validated_data
        data["user"] = self.user
        resp_ser.create(data)

        return Response([ser.data, resp_ser.data])
