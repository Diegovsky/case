from django.apps import AppConfig


class ApiConfig(AppConfig):
    name = "api"

    def ready(self):
        from api.schema import HashIdDictSerializerExtension

        print(HashIdDictSerializerExtension)
