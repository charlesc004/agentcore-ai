from abc import ABC, abstractmethod
import os
import httpx


class AIProvider(ABC):
    @abstractmethod
    def execute(self, role, instructions, text, model=None): ...


class DemoProvider(AIProvider):
    def execute(self, role, instructions, text, model=None):
        text = str(text)[:16000]
        category = (
            "urgent"
            if any(word in text.lower() for word in ("urgent", "broken", "refund", "error"))
            else "general"
        )
        if role == "classify":
            return {"category": category, "confidence": 0.96, "text": text}
        if role == "draft":
            return {
                "text": "Thank you for reaching out. We have reviewed your inquiry and our support team will follow up with the next steps.",
                "category": category,
            }
        if role == "route":
            return {
                "team": "Priority support" if category == "urgent" else "Customer success",
                "text": text,
            }
        return {
            "text": " ".join(text.split()[:60]),
            "word_count": len(text.split()),
            "provider": "demo",
        }


class OpenAICompatibleProvider(AIProvider):
    def execute(self, role, instructions, text, model=None):
        key = os.environ.get("AI_API_KEY")
        if not key:
            raise ValueError("Real provider requires AI_API_KEY on the server")
        response = httpx.post(
            os.environ.get("AI_API_URL", "https://api.openai.com/v1/chat/completions"),
            headers={"Authorization": f"Bearer {key}"},
            json={
                "model": model
                if model and model != "deterministic-v1"
                else os.environ.get("AI_MODEL", "gpt-4.1-mini"),
                "messages": [
                    {"role": "system", "content": instructions},
                    {"role": "user", "content": str(text)[:16000]},
                ],
                "response_format": {"type": "json_object"},
            },
            timeout=45,
        )
        response.raise_for_status()
        import json

        result = json.loads(response.json()["choices"][0]["message"]["content"])
        if not isinstance(result, dict):
            raise ValueError("AI provider must return a JSON object")
        return result
