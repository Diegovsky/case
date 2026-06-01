from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api.views import UserViewSet
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)

from django.urls import path, include


router = DefaultRouter()
router.register("user", UserViewSet, "user")

urlpatterns = [
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("auth/", include("dj_rest_auth.urls")),
    path("", include("rest_framework.urls", namespace="rest_framework")),
    path("", include(router.urls)),
]
