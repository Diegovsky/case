from api.views import router, implicit_router
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)

from django.urls import path, include
from dj_rest_auth.urls import urlpatterns as auth_urls

auth_urls = [x for x in auth_urls if x.name != "rest_user_details"]


urlpatterns = [
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("auth/", include(auth_urls)),
    path("", include("rest_framework.urls", namespace="rest_framework")),
    path("", include(router.urls)),
    path("", include(implicit_router.urls)),
]
