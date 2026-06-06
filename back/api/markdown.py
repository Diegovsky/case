from marko.inline import RawText
from typing import Callable, Generator, Literal
from marko.element import Element
from marko import Markdown
from marko.block import BlockElement, Heading, Document, Paragraph

_marko = Markdown()


def parse(text: str) -> Document:
    return _marko.parse(text)


def _explore(el: Element) -> Generator[Element, None | Literal["skip"], None]:
    val = yield el
    if val == "skip":
        return

    if isinstance(el, BlockElement):
        for el in el.children:
            yield from _explore(el)


def extract_title(el: Element) -> str | None:
    for el in _explore(el):
        if isinstance(el, Heading) and el.level == 1:
            return _marko.renderer.render_children(el)


def as_preview(doc: Document) -> str:
    par = ""
    it = _explore(doc)
    for el in it:
        match el:
            case Heading():
                it.send("skip")
            case Paragraph():
                par = _marko.renderer.render_children(el)
                break
    return par
