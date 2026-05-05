"""AI 求职助手 — LLM 客户端（支持 chat 和 chat_json）。"""
from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

import requests


class LLMClient:
    """Minimal OpenAI-compatible chat completions client."""

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY") or os.getenv("LLM_API_KEY")
        self.base_url = (base_url or os.getenv("OPENAI_BASE_URL") or os.getenv("LLM_BASE_URL") or "https://api.openai.com/v1").rstrip("/")
        self.model = model or os.getenv("OPENAI_MODEL") or os.getenv("LLM_MODEL") or "gpt-4o-mini"

    @property
    def available(self) -> bool:
        return bool(self.api_key)

    def chat(self, messages: List[Dict[str, str]], timeout: int = 60) -> str:
        """Send messages and return plain text response."""
        if not self.available:
            raise RuntimeError("LLM API key is not configured")
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.7,
        }
        resp = requests.post(
            f"{self.base_url}/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=timeout,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]

    def chat_json(self, system_prompt: str, user_prompt: str, timeout: int = 60) -> Dict[str, Any]:
        """Send system+user prompts and return parsed JSON response."""
        if not self.available:
            raise RuntimeError("LLM API key is not configured")
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }
        resp = requests.post(
            f"{self.base_url}/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=timeout,
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        return json.loads(content)
