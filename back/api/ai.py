import json

from google import genai
from google.genai import types

import os

Config = types.GenerateContentConfig


class AIClient:
    client: genai.Client

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

    def call_model(
        self,
        messages: types.ContentListUnionDict,
        /,
        model="gemini-3.1-flash-lite",
        # model="gemma-4-31b-it",
        config: Config = Config(max_output_tokens=3072),
    ) -> dict:
        assert len(messages) > 0
        config.response_mime_type = "application/json"
        # retry a single time if it fails
        for _ in range(2):
            try:
                completion = self.client.models.generate_content(
                    model=model, contents=messages, config=config
                )
                if completion.text == "...":
                    continue
                print(f'"{completion.text}"')
                assert completion.text
                return json.loads(completion.text)
            except:
                raise

        raise NotImplementedError("Unreachable")


AI_CLIENT = AIClient()
