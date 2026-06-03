from dj_rest_auth.jwt_auth import JWTCookieAuthentication
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from api.models import User
from api.serializers import ModelSerializer, Meta


class LoginSerializer(TokenObtainPairSerializer):
    class Meta(Meta):
        model = User
        fields = ["email", "password"]
