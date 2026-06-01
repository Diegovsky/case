from api.models import User
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def handle(self, *args, **opts):
        u = User.objects.create_superuser(
            "admin@email.com",
            password="admin",
            first_name="Fulano",
            last_name="Da Silva",
        )
