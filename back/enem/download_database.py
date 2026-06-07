from typing import Any
import json
from httpx import AsyncClient
from pydantic import BaseModel as Schema
import asyncio

client = AsyncClient()

type JSON = dict[str, JSON] | list[JSON] | str | bool | float


class Meta(Schema):
    limit: int
    offset: int
    total: int
    hasMore: bool


class Response(Schema):
    metadata: Meta
    questions: list[Any]


async def questions(year: int, offset: int = 0) -> Response | int:
    resp = await client.get(
        f"https://api.enem.dev/v1/exams/{year}/questions",
        params={"offset": offset, "limit": 50},
    )
    print(resp.status_code)
    if resp.status_code != 200:
        return resp.status_code

    return Response.model_validate_json(resp.text)


async def all_questions(year: int) -> list[JSON]:
    items = []
    offset = 0
    waiting_time = 0.15
    while True:
        resp = await questions(year, offset)
        match resp:
            case 429:
                print(f"Rate limited. Increasing wait to {waiting_time}s")
                waiting_time *= 2
            case Response():
                waiting_time = 0.15
                gotten = len(resp.questions)
                offset += gotten
                items.extend(resp.questions)
                print(f"{gotten=!r} {offset=!r} {resp.metadata=!r}")
                if not resp.metadata.hasMore:
                    break

        await asyncio.sleep(waiting_time)
    return items


async def save_all_questions(year: int):
    questions = await all_questions(year)
    with open(f"{year}.json", "w") as f:
        json.dump(questions, f)
    print(f"Done {year}")


async def main():
    async with asyncio.TaskGroup() as tg:
        for offset in range(5):
            year = 2023 - offset
            tg.create_task(save_all_questions(year))


if __name__ == "__main__":
    asyncio.run(main())
