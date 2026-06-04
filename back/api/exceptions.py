from typing import Any
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import traceback
from django.conf import settings


def global_exception_handler(exc: Exception, context):
    response = exception_handler(exc, context)
    traceback.print_exc()

    if response is None:
        error_payload: dict[str, Any] = {
            "code": "internal-error",
            "detail": str(exc),
        }

        if settings.DEBUG:
            error_payload["traceback"] = traceback.format_exc().split("\n")

        response = Response(error_payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # # If DRF *did* handle it, make sure it doesn't try to use the Browsable API HTML renderer
    if settings.DEBUG:
        # Forces JSON structure over the default browsable HTML wrapper
        response.accepted_renderer = None
        response.accepted_media_type = None

    return response
