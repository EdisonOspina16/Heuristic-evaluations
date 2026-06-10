# -*- coding: utf-8 -*-
import os, json, urllib.request
from deepeval.models.base_model import DeepEvalBaseLLM


class OllamaModel(DeepEvalBaseLLM):
    def __init__(self):
        self.model_name = os.getenv("DEEPEVAL_OLLAMA_MODEL", "llama3.2:latest")
        self.base_url   = os.getenv("DEEPEVAL_OLLAMA_BASE_URL", "http://localhost:11434")

    def load_model(self):
        return self

    def generate(self, prompt: str) -> str:
        payload = json.dumps({
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "system": (
                "You are a JSON-only evaluation assistant. "
                "Respond ONLY with a valid JSON object. "
                "Do not include markdown, code blocks, explanations, "
                "or any text outside the JSON."
            ),
            "options": {
                "temperature": 0,
            },
        }).encode("utf-8")
        req = urllib.request.Request(
            f"{self.base_url}/api/generate",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("response", "")

    async def a_generate(self, prompt: str) -> str:
        return self.generate(prompt)

    def get_model_name(self) -> str:
        return self.model_name


def get_model():
    return OllamaModel()
