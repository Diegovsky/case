from django.core.files.base import ContentFile
import pytest
from api.models import User, Module, Topic

type Named[T] = dict[str, T]


def create_named[M: Topic | Module](
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
) -> tuple[Named[Topic], Named[Module]]:
    mods = create_named(Module, user, deps)
    default_mod = list(mods.values())[0]
    topics = create_named(Topic, user, deps, module=default_mod, content=NULL_FILE)
    return topics, mods


def test_available(user: User):
    topics, mods = create(
        user,
        {
            "1": [],
            "2": ["1"],
        },
    )

    assert set(user.available_modules.all()) == {mods["1"]}
    assert set(user.available_topics.all()) == {topics["1"]}


def test_available_complex(user: User):
    topics, mods = create(
        user,
        {
            "1": [],
            "2": ["1", "3"],
            "3": ["1"],
        },
    )

    assert set(user.available_modules.all()) == {mods["1"]}
    assert set(user.available_topics.all()) == {topics["1"]}


def test_available_mod_unlocked(user: User):
    topics, mods = create(
        user,
        {
            "1": [],
            "2": ["1", "3"],
            "3": ["1"],
        },
    )
    user.completed_modules.set([mods["1"]])

    assert set(user.available_modules.all()) == {mods["1"], mods["3"]}
    assert set(user.available_topics.all()) == {topics["1"], topics["3"]}


def test_on_complete_topic(user: User):
    mods = create_named(Module, user, {"mod1": [], "mod2": ["mod1"]})
    mod1 = mods["mod1"]
    topics = create_named(
        Topic,
        user,
        {
            "1": [],
            "2": [],
            "3": [],
        },
        module=mod1,
        content=NULL_FILE,
    )
    # complete all topics of mod1
    user.completed_topics.set(list(topics.values()))

    assert set(user.completed_topics.all()) == set(topics.values())
    assert set(user.completed_modules.all()) == {mod1}


def test_on_complete_single_topic(user: User):
    mods = create_named(Module, user, {"mod1": [], "mod2": ["mod1"]})
    mod1 = mods["mod1"]
    topics = create_named(
        Topic,
        user,
        {
            "1": [],
            "2": [],
            "3": [],
        },
        module=mod1,
        content=NULL_FILE,
    )
    # complete single topic
    user.completed_topics.add(topics["1"])

    assert set(user.completed_topics.all()) == {topics["1"]}
    assert set(user.completed_modules.all()) == set()


def test_on_complete_module(user: User):
    mods = create_named(Module, user, {"mod1": [], "mod2": ["mod1"]})
    mod1 = mods["mod1"]
    topics = create_named(
        Topic,
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

    assert set(user.completed_topics.all()) == set(topics.values())
    assert set(user.completed_modules.all()) == {mod1}
