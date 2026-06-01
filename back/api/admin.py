from django.contrib.auth.admin import UserAdmin
from api.models import User
from django.contrib import admin
from django.apps import apps

# 1. Get all models belonging to the current app
app_models = set(apps.get_app_config("api").get_models())


def register(model, admin_model):
    app_models.remove(model)
    admin.site.register(model, admin_model)


register(User, UserAdmin)

for model in app_models:
    admin.site.register(model)
