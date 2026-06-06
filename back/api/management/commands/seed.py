from django.core.files.base import ContentFile
from django.core.files import File
import json
from django.db.transaction import atomic
from pathlib import Path
from api.models import User, Module, ModuleSection, ChatMessage
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    @atomic
    def handle(self, *args, **opts):
        admin = User.objects.create_superuser(
            "admin@email.com",
            password="admin",
            first_name="Fulano",
            last_name="Da Silva",
        )
        admin.messages.create(text="Ola", sender=ChatMessage.Sender.USER)
        admin.messages.create(text="oi.", sender=ChatMessage.Sender.MODEL)
        modules = {}
        for module in Path("lessons").iterdir():
            # skip files
            if not module.is_dir():
                continue
            # maps section filename to a Section object, e.g:
            # `probability.md` -> ModuleSection(content=<contents of `probability.md>`)
            sections = {}

            # Create DB Module
            module_obj = Module.objects.create(
                created_by=admin,
                name=module.stem.split("-")[-1].title(),
            )
            # add module to module-name lookup table
            modules[module_obj.name.lower()] = module_obj
            for section in module.iterdir():
                # skip non-md files
                if section.suffix != ".md":
                    continue
                # I wish I could use the normal File and have django read it,
                # but a weird bug makes it throw an 'io on closed file' error.
                sec_file = ContentFile(open(section).read(), name=str(section))
                sections[section.name] = ModuleSection.objects.create(
                    module=module_obj, content=sec_file, created_by=admin
                )

            # builds the section dependency graph
            with open(module / "dependencies.json") as f:
                dependencies = json.load(f)
                for section_filename, section in sections.items():
                    section.dependencies.set(
                        [sections[s] for s in dependencies[section_filename]]
                    )

        with open("lessons/dependencies.json") as f:
            module_deps = json.load(f)
        for name, module_obj in modules.items():
            module_obj.dependencies.set([modules[name] for name in module_deps[name]])
