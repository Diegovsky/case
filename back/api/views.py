from api.serializers import UserSerializer, ModelSerializer
from api.models import User, Model
from rest_framework import viewsets


class ModelViewset(viewsets.ModelViewSet):
    lookup_field = "hashid"
    model: type[Model] | None = None

    def get_queryset(self):
        if self.model is not None:
            return self.model.objects.all()
        elif (ser := self.serializer_class) is not None and issubclass(
            ser, ModelSerializer
        ):
            return ser.Meta.model.objects.all()
        else:
            return super().get_queryset()


class UserViewSet(ModelViewset):
    serializer_class = UserSerializer
