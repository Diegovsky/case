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


def create(
    user: User, deps: dict[str, list[str]]
) -> tuple[Named[ModuleSection], Named[Module]]:
    mods = create_named(Module, user, deps)
    default_mod = list(mods.values())[0]
    secs = create_named(
        ModuleSection, user, deps, module=default_mod, content=ContentFile("", "null")
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
