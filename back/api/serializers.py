from api.models import User
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer


class Meta:
    exclude: None | list = ["id"]
    fields: None | list = None

    def __init_subclass__(cls):
        pass
        if hasattr(cls, "fields"):
            cls.exclude = None

        elif hasattr(cls, "exclude"):
            cls.exclude += super().exclude


class UserSerializer(ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta(Meta):
        model = User
        fields = [
            "hashid",
            "first_name",
            "last_name",
            "email",
            "password",
        ]
