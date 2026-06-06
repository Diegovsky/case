from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from django.db.models import QuerySet, Q, Count, F
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

    from django.db.models import Count, Q, F

    def on_completed_modules_change(self):
        # 1. Find all section IDs that SHOULD be marked complete
        # (Sections belonging to currently completed modules)
        desired_completed_sections = set(
            ModuleSection.objects.filter(
                module_id__in=self.completed_modules.values_list("id", flat=True)
            ).values_list("id", flat=True)
        )

        # 2. Get the current state of completed sections from the database
        current_completed_sections = set(
            self.completed_sections.values_list("id", flat=True)
        )

        # 3. Calculate what needs to be added or removed
        sections_to_add = desired_completed_sections - current_completed_sections

        # We only remove a section if its parent module is no longer in completed_modules
        sections_to_remove = current_completed_sections - desired_completed_sections

        # 4. Apply changes only if differences exist (prevents infinite loop recursion)
        if sections_to_add:
            self.completed_sections.add(*sections_to_add)

        if sections_to_remove:
            # Filter to make sure we only clear sections that actually belong to the affected modules
            # to avoid accidentally wiping out sections the user is currently working on elsewhere.
            affected_module_sections = ModuleSection.objects.filter(
                module_id__in=Module.objects.values_list("id", flat=True)
            ).values_list("id", flat=True)

            actual_removals = sections_to_remove & set(affected_module_sections)
            if actual_removals:
                self.completed_sections.remove(*actual_removals)

    def on_completed_sections_change(self):
        # 1. Fetch current completed section IDs
        completed_section_ids = self.completed_sections.values_list("id", flat=True)

        # 2. Calculate which modules SHOULD be marked complete based on the sections done
        desired_completed_modules = set(
            Module.objects.annotate(
                total_sections=Count("sections"),
                completed_count=Count(
                    "sections", filter=Q(sections__id__in=completed_section_ids)
                ),
            )
            .filter(
                total_sections__gt=0,  # Ensure the module isn't empty
                completed_count=F("total_sections"),  # All sections are finished
            )
            .values_list("id", flat=True)
        )

        # 3. Get the current state of completed modules from the database
        current_completed_modules = set(
            self.completed_modules.values_list("id", flat=True)
        )

        # 4. Calculate mutations
        modules_to_add = desired_completed_modules - current_completed_modules
        modules_to_remove = current_completed_modules - desired_completed_modules

        # 5. Apply modifications safely
        if modules_to_add:
            self.completed_modules.add(*modules_to_add)

        if modules_to_remove:
            self.completed_modules.remove(*modules_to_remove)

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

    def __str__(self):
        return f'<Module "{self.name}">'

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


# Django signal for when User.completed_sections gets changed in anyway
# Allows us to run logic after the change is done.
@receiver(m2m_changed, sender=User.completed_sections.through)
def user_change_completed_sections(sender, instance: User, action: str, **kw):
    del sender, kw
    if action == "post_add":
        instance.on_completed_sections_change()


# Django signal for when User.completed_modules gets changed in anyway
# Allows us to run logic after the change is done.
@receiver(m2m_changed, sender=User.completed_modules.through)
def user_change_completed_modules(sender, instance: User, action: str, **kw):
    del sender, kw
    if action == "post_add":
        instance.on_completed_modules_change()
