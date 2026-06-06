from django.db.models import QuerySet, Q
from django.core.files.base import ContentFile
from django.db.models.fields.related import ReverseOneToOneDescriptor
from django_stubs_ext.db.models.manager import RelatedManager
from api import markdown
from django.utils.text import slugify
from pathlib import Path
from django_pydantic_field import SchemaField
from django.utils.translation.trans_null import _
from django.contrib.auth.hashers import identify_hasher
from typing import override, Iterable
from django.contrib.auth.models import AbstractUser
from django.db import models
from django_hashids import HashidsField


class HashidField(HashidsField):
    """A hashid provider which uses the bound model name as salt"""

    @property
    def salt(self) -> str:
        return self.attached_to_model.__name__  # type: ignore

    @salt.setter
    def salt(self, v: str): ...


class Model(models.Model):
    hashid = HashidField()
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


def is_django_hash(text: str) -> bool:
    try:
        identify_hasher(text)
        return True
    except ValueError:
        return False


class User(AbstractUser, Model):
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    # Override to make 'email' not blank
    email = models.EmailField(_("email address"), unique=True)
    interests: list[str] = SchemaField(default=list)
    messages: "RelatedManager[ChatMessage]"
    completed_sections = models.ManyToManyField("ModuleSection", related_name=None)
    completed_modules = models.ManyToManyField("Module", related_name=None)

    @property
    def available_modules(self) -> "QuerySet[Module]":
        missing = Module.objects.exclude(id__in=self.completed_modules.all())
        return Module.objects.exclude(dependencies__in=missing)

    @property
    def available_sections(self) -> "QuerySet[ModuleSection]":
        missing = ModuleSection.objects.exclude(id__in=self.completed_sections.all())
        return ModuleSection.objects.exclude(dependencies__in=missing).filter(
            module__in=self.available_modules
        )

    @override
    def save(self, **kw):
        if self.email:
            self.username = self.email
        elif self.username:
            self.email = self.username

        # hash password if not already hashed
        if not is_django_hash(self.password):
            self.set_password(self.password)
        super().save(**kw)


class ChatMessage(Model):
    class Sender(models.TextChoices):
        USER = "user"
        MODEL = "model"

    text = models.TextField()
    sender = models.CharField(max_length=5, choices=Sender)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="messages")

    def __str__(self):
        return f'{self.sender}: "{self.text}"'

    class Meta:
        ordering = ("created_at",)


class UserCreatedModel(Model):
    created_by = models.ForeignKey(User, related_name=None, on_delete=models.CASCADE)

    class Meta:
        abstract = True


def get_upload_path(instance: "ModuleSection", filename: str):
    module_name = slugify(instance.module.name)
    section_name = slugify(instance.name)
    return str(Path(f"media/module/{module_name}/section/{section_name}/content.md"))


class Module(UserCreatedModel):
    name = models.CharField(
        max_length=128,
        unique=True,
    )
    dependencies = models.ManyToManyField("self", symmetrical=False)

    sections: "RelatedManager[ModuleSection]"

    class Meta:
        ordering = ("-id",)


class ModuleSection(UserCreatedModel):
    module = models.ForeignKey(
        Module, on_delete=models.CASCADE, related_name="sections"
    )
    name = models.CharField(
        max_length=128,
    )
    content = models.FileField(upload_to=get_upload_path)
    preview = models.CharField(max_length=54)
    dependencies = models.ManyToManyField("self", symmetrical=False)

    def save(self, **kw):
        with self.content.open("r") as f:
            doc = markdown.parse(f.read())
            if not self.name:
                self.name = markdown.extract_title(doc)
            self.preview = markdown.as_preview(doc)
        super().save(**kw)
