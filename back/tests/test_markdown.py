from api.markdown import parse, extract_title
import pytest
from importlib import resources


def test_extract_title_simple():
    doc = parse("# example title")
    v = extract_title(doc)
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
    doc = parse(resources.read_text(__name__, file))
    v = extract_title(doc)
    assert v is not None
    assert v == title
