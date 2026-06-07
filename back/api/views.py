import pprint
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
    TopicSerializer,
    ModuleSerializer,
    ChatMessageSerializer,
    SendMessageSerializer,
    AIUserInfo,
    CompleteSectionSerializer,
    ReceiveMessagesSerializer,
)
from api.models import User, Model, Module, ChatMessage, Topic
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


@autourl(name="topic")
class TopicViewSet(ModelViewSet):
    serializer_class = TopicSerializer


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
    def complete_topic(self, request: Request):
        ser = CompleteSectionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        topic: Topic = ser.validated_data["hashid"]
        self.user.completed_topics.add(topic)

        return Response(status=204)

    @extend_schema(
        request=None,
        responses={200: None},
    )
    @action(methods=["post"], detail=True)
    @atomic
    def clear_messages(self, request: Request):
        self.user.messages.all().delete()
        return Response(None, 200)

    @action(methods=["post"], detail=True)
    @atomic
    def set_module(self, request: Request):
        mod = Module.objects.get(hashid=request.data["hashid"])
        self.user.completed_modules.set([mod, *mod.dependencies.all()])
        return Response(None, 200)

    def make_system_info(self) -> str:
        mods = ModuleSerializer(instance=Module.objects.all(), many=True).data
        pprint.pp(mods)
        return json.dumps(mods)

    @extend_schema(
        request=SendMessageSerializer(),
        responses={200: ReceiveMessagesSerializer()},
    )
    @action(methods=["post"], detail=True)
    @atomic
    def send_message(self, request: Request):
        print(request.data)
        ser = SendMessageSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.validated_data["user"] = self.user

        data = ser.validated_data
        context = data.pop("context")
        responses = [ser.data]

        history = list(self.user.messages.all())

        print(data, str(ChatMessage.Sender.USER))
        # Only persist messages sent by the user
        if data["sender"] == str(ChatMessage.Sender.USER):
            history.append(ser.create(data))
        else:
            history.append(ChatMessage(**data))
            responses.pop()

        user_info = json.dumps(AIUserInfo(self.user).data)
        system_prompt = [
            """
                You are a helpful personal teacher.
                Your response should follow this base schema and add fields if asked:
               {
                   "text": <your response>,
               }""",
            f"User info: {user_info}",
            f"Modules: {self.make_system_info()}",
            """If you ever encounter useful information about the user's personal preferences in learning, good analogies etc. Add the field `updateUserInfo` containing a string of relevant user information. This information will always be included in the next prompts and is meant as memory for you.""",
        ]

        if context:
            system_prompt.append(
                f""" Here's some context of what the user sees/relevant to what you're doing: {context}"""
            )

        messages = [
            {
                "role": m.sender,
                "parts": [{"text": m.text}],
            }
            for m in history
        ]

        if True:
            response = {"sender": "model", "text": "sample", "updateUserInfo": "ola"}
        else:
            response = AI_CLIENT.call_model(
                messages,
                config=Config(system_instruction=system_prompt),
            )

        updated_info = False
        if new_info := response.pop("updateUserInfo", None):
            updated_info = True
            self.user.info = new_info
            self.user.save()

        new_message = {
            "text": response.pop("text"),
            "sender": ChatMessage.Sender.MODEL,
        }

        resp_ser = ChatMessageSerializer(data=new_message)
        resp_ser.is_valid(raise_exception=True)
        resp_ser.validated_data["user"] = self.user
        resp_ser.create(resp_ser.validated_data)

        responses.append(resp_ser.data)

        return Response(
            {"messages": responses, "updated_info": updated_info, "extra": response}
        )
