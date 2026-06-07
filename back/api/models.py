from pydantic import BaseModel, Field, AliasChoices
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
    messages: "RelatedManager[ChatMessage]"
    completed_topics = models.ManyToManyField("Topic", related_name=None, blank=True)
    completed_modules = models.ManyToManyField("Module", related_name=None, blank=True)
    info = models.TextField(default="", blank=True)

    @property
    def available_modules(self) -> "QuerySet[Module]":
        missing = Module.objects.exclude(id__in=self.completed_modules.all())
        return Module.objects.exclude(dependencies__in=missing)

    @property
    def available_topics(self) -> "QuerySet[Topic]":
        remaining = Topic.objects.exclude(id__in=self.completed_topics.all())
        return Topic.objects.exclude(dependencies__in=remaining).filter(
            module__in=self.available_modules
        )

    from django.db.models import Count, Q, F

    def on_completed_modules_change(self):
        # 1. Find all topic IDs that SHOULD be marked complete
        # (Sections belonging to currently completed modules)
        desired_completed_topics = set(
            Topic.objects.filter(
                module_id__in=self.completed_modules.values_list("id", flat=True)
            ).values_list("id", flat=True)
        )

        # 2. Get the current state of completed topics from the database
        current_completed_topics = set(
            self.completed_topics.values_list("id", flat=True)
        )

        # 3. Calculate what needs to be added or removed
        topics_to_add = desired_completed_topics - current_completed_topics

        # We only remove a topic if its parent module is no longer in completed_modules
        topics_to_remove = current_completed_topics - desired_completed_topics

        # 4. Apply changes only if differences exist (prevents infinite loop recursion)
        if topics_to_add:
            self.completed_topics.add(*topics_to_add)

        if topics_to_remove:
            # Filter to make sure we only clear topics that actually belong to the affected modules
            # to avoid accidentally wiping out topics the user is currently working on elsewhere.
            affected_module_topics = Topic.objects.filter(
                module_id__in=Module.objects.values_list("id", flat=True)
            ).values_list("id", flat=True)

            actual_removals = topics_to_remove & set(affected_module_topics)
            if actual_removals:
                self.completed_topics.remove(*actual_removals)

    def on_completed_topics_change(self):
        # 1. Fetch current completed topic IDs
        completed_topic_ids = self.completed_topics.values_list("id", flat=True)

        # 2. Calculate which modules SHOULD be marked complete based on the topics done
        desired_completed_modules = set(
            Module.objects.annotate(
                total_topics=Count("topics"),
                completed_count=Count(
                    "topics", filter=Q(topics__id__in=completed_topic_ids)
                ),
            )
            .filter(
                total_topics__gt=0,  # Ensure the module isn't empty
                completed_count=F("total_topics"),  # All topics are finished
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


def get_upload_path(instance: "Topic", filename: str):
    module_name = slugify(instance.module.name)
    topic_name = slugify(instance.name)
    return str(Path(f"media/module/{module_name}/topic/{topic_name}/content.md"))


class Module(UserCreatedModel):
    name = models.CharField(
        max_length=128,
        unique=True,
    )
    dependencies = models.ManyToManyField("self", symmetrical=False)

    topics: "RelatedManager[Topic]"

    def __str__(self):
        return f'<Module "{self.name}">'

    class Meta:
        ordering = ("id",)


class Alternative(BaseModel):
    letter: str
    text: str
    file: str | None
    is_correct: bool


class Test(BaseModel):
    context: str
    question: str
    alternatives: list[Alternative]


class Topic(UserCreatedModel):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="topics")
    name = models.CharField(
        max_length=128,
    )
    content = models.FileField(upload_to=get_upload_path)
    preview = models.CharField(max_length=54)
    tests = SchemaField(list[Test], default=[])
    dependencies = models.ManyToManyField("self", symmetrical=False)

    def save(self, **kw):
        with self.content.open("r") as f:
            doc = markdown.parse(f.read())
            if not self.name:
                self.name = markdown.extract_title(doc)
            self.preview = markdown.as_preview(doc)
        super().save(**kw)


# Django signal for when User.completed_topics gets changed in anyway
# Allows us to run logic after the change is done.
@receiver(m2m_changed, sender=User.completed_topics.through)
def user_change_completed_topics(sender, instance: User, action: str, **kw):
    del sender, kw
    if action == "post_add":
        instance.on_completed_topics_change()


# Django signal for when User.completed_modules gets changed in anyway
# Allows us to run logic after the change is done.
@receiver(m2m_changed, sender=User.completed_modules.through)
def user_change_completed_modules(sender, instance: User, action: str, **kw):
    del sender, kw
    if action == "post_add":
        instance.on_completed_modules_change()
