from typing import Any
from django.core.files.base import ContentFile
from django.core.files import File
import json
from django.db.transaction import atomic
from pathlib import Path
from api.models import User, Module, Topic, ChatMessage, Test
from django.core.management.base import BaseCommand


def open_json(p: Path | str) -> Any:
    with open(p) as f:
        return json.load(f)


class Command(BaseCommand):
    @atomic
    def handle(self, *args, **opts):
        admin = User.objects.first()
        if admin is None:
            admin = User.objects.create_superuser(
                "admin@email.com",
                password="admin",
                first_name="Fulano",
                last_name="Da Silva",
            )
        Module.objects.all().delete()
        Topic.objects.all().delete()
        modules = {}
        topics = {}
        for module in Path("lessons").iterdir():
            # skip files
            if not module.is_dir():
                continue
            # maps topic filename to a Section object, e.g:
            # `probability.md` -> Topic(content=<contents of `probability.md>`)

            # Create DB Module
            module_obj = Module.objects.create(
                created_by=admin,
                name=module.stem.split("-")[-1].title(),
            )
            # add module to module-name lookup table
            modules[module_obj.name.lower()] = module_obj
            for topic in module.iterdir():
                # skip non-md files
                if topic.suffix != ".md":
                    continue
                # I wish I could use the normal File and have django read it,
                # but a weird bug makes it throw an 'io on closed file' error.
                sec_file = ContentFile(open(topic).read(), name=str(topic))
                topics[topic.stem] = Topic.objects.create(
                    module=module_obj, content=sec_file, created_by=admin
                )

            # builds the topic dependency graph
            dependencies = open_json(module / "dependencies.json")
            for topic_name, topic in topics.items():
                try:
                    topic.dependencies.set(
                        [topics[s] for s in dependencies[topic_name]]
                    )
                except KeyError:
                    continue

        module_deps = open_json("lessons/dependencies.json")
        for name, module_obj in modules.items():
            module_obj.dependencies.set([modules[name] for name in module_deps[name]])

        topic_tests = open_json("lessons/tests.json")
        for obj in topic_tests:
            topic_name = obj.pop("topic")
            topic = topics[topic_name]
            topic.tests.append(Test(**obj))
            topic.save()
