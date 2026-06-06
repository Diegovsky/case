from django.core.files.base import ContentFile
import pytest
from api.models import User, Module, ModuleSection

type Named[T] = dict[str, T]


def create_named[M: ModuleSection | Module](
    cls: type[M], user: User, deps: dict[str, list[str]], **kw
) -> Named[M]:
    objs = {}
    for name in deps.keys():
        obj = cls(created_by=user, name=name, **kw)
        obj.save()  # type: ignore
        objs[name] = obj

    for name, obj in objs.items():
        obj.dependencies.set([objs[dep] for dep in deps[name]])

    return objs


NULL_FILE = ContentFile("", "null")


def create(
    user: User, deps: dict[str, list[str]]
) -> tuple[Named[ModuleSection], Named[Module]]:
    mods = create_named(Module, user, deps)
    default_mod = list(mods.values())[0]
    secs = create_named(
        ModuleSection, user, deps, module=default_mod, content=NULL_FILE
    )
    return secs, mods


def test_available(user: User):
    secs, mods = create(
        user,
        {
            "1": [],
            "2": ["1"],
        },
    )

    assert set(user.available_modules.all()) == {mods["1"]}
    assert set(user.available_sections.all()) == {secs["1"]}


def test_available_complex(user: User):
    secs, mods = create(
        user,
        {
            "1": [],
            "2": ["1", "3"],
            "3": ["1"],
        },
    )

    assert set(user.available_modules.all()) == {mods["1"]}
    assert set(user.available_sections.all()) == {secs["1"]}


def test_available_mod_unlocked(user: User):
    secs, mods = create(
        user,
        {
            "1": [],
            "2": ["1", "3"],
            "3": ["1"],
        },
    )
    user.completed_modules.set([mods["1"]])

    assert set(user.available_modules.all()) == {mods["1"], mods["3"]}
    assert set(user.available_sections.all()) == {secs["1"]}


def test_on_complete_section(user: User):
    mods = create_named(Module, user, {"mod1": [], "mod2": ["mod1"]})
    mod1 = mods["mod1"]
    secs = create_named(
        ModuleSection,
        user,
        {
            "1": [],
            "2": [],
            "3": [],
        },
        module=mod1,
        content=NULL_FILE,
    )
    # complete all sections of mod1
    user.completed_sections.set(list(secs.values()))

    assert set(user.completed_sections.all()) == set(secs.values())
    assert set(user.completed_modules.all()) == {mod1}


def test_on_complete_single_section(user: User):
    mods = create_named(Module, user, {"mod1": [], "mod2": ["mod1"]})
    mod1 = mods["mod1"]
    secs = create_named(
        ModuleSection,
        user,
        {
            "1": [],
            "2": [],
            "3": [],
        },
        module=mod1,
        content=NULL_FILE,
    )
    # complete single section
    user.completed_sections.add(secs["1"])

    assert set(user.completed_sections.all()) == {secs["1"]}
    assert set(user.completed_modules.all()) == set()


def test_on_complete_module(user: User):
    mods = create_named(Module, user, {"mod1": [], "mod2": ["mod1"]})
    mod1 = mods["mod1"]
    secs = create_named(
        ModuleSection,
        user,
        {
            "1": [],
            "2": [],
            "3": [],
        },
        module=mod1,
        content=NULL_FILE,
    )
    # complete mod1
    user.completed_modules.add(mod1)

    assert set(user.completed_sections.all()) == set(secs.values())
    assert set(user.completed_modules.all()) == {mod1}
