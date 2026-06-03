import pytest
from api.models import extract_title
from importlib import resources


def test_extract_title_simple():
    v = extract_title("# example title".splitlines())
    assert v is not None
    assert v == "example title"


@pytest.mark.parametrize(
    ("file", "title"),
    [
        ("example.md", "The Section title"),
        ("example2.md", "The title"),
    ],
)
def test_extract_title_complex(file: str, title: str):
    v = extract_title(resources.read_text(__name__, file).splitlines())
    assert v is not None
    assert v == title
