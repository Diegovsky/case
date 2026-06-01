from rest_framework.mixins import CreateModelMixin, RetrieveModelMixin, UpdateModelMixin
import functools
from typing import override
from rest_framework import permissions
from rest_framework.viewsets import ViewSetMixin
from rest_framework.routers import DefaultRouter
from django.utils.text import slugify
from api.serializers import UserSerializer, ModelSerializer
from api.models import User, Model
from api.router import ImplicitRouter
from rest_framework import viewsets

router = DefaultRouter()
implicit_router = ImplicitRouter()


def autourl(cls: type[ViewSetMixin] | None = None, implicit=False):
    if cls is None:
        return functools.partial(autourl, implicit=implicit)
    slug = slugify(cls.__name__).removesuffix("viewset")
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
