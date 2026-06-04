from django.db.models.fields.related import ReverseOneToOneDescriptor
from django_stubs_ext.db.models.manager import RelatedManager
from re import compile
from django.utils.text import slugify
from pathlib import Path
from django_pydantic_field import SchemaField
from django.utils.translation.trans_null import _
from django.contrib.auth.hashers import is_password_usable, identify_hasher
from typing import override, Self, Iterable
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
    progress: "ReverseOneToOneDescriptor[User, UserProgress]"

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


class UserProgress(Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="progress")
    interests: list[str] = SchemaField(default=list)


class Module(Model):
    name = models.CharField(
        max_length=128,
        unique=True,
    )

    sections: "RelatedManager[ModuleSection]"


def get_upload_path(instance: "ModuleSection", filename: str):
    module_name = slugify(instance.module.name)
    section_name = slugify(instance.name)
    return str(Path(f"module/{module_name}/section/{section_name}/{filename}"))


def extract_title(text: Iterable[str]) -> str | None:
    reg = compile(r"^# (.+)$")
    for x in text:
        if match := reg.match(x):
            return match.group(1)


class ModuleSection(Model):
    module = models.ForeignKey(
        Module, on_delete=models.CASCADE, related_name="sections"
    )
    name = models.CharField(
        max_length=128,
    )
    content = models.FileField(upload_to=get_upload_path)

    def save(self, **kw):
        with self.content.open("r") as f:
            self.name = extract_title(f)
        super().save(**kw)
