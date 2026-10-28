import json
import time
from abc import ABC, abstractmethod


class Tool(ABC):
    @abstractmethod
    def execute(self, data, config): ...


class JSONFormatter(Tool):
    def execute(self, data, config):
        return {"text": json.dumps(data, indent=2, sort_keys=True), "data": data}


class EmailDraft(Tool):
    def execute(self, data, config):
        return {
            "subject": config.get("subject", "Your inquiry"),
            "body": data.get("text", str(data)),
            "status": "draft",
        }


class DocumentParser(Tool):
    def execute(self, data, config):
        text = str(data.get("text", ""))
        return {"text": text, "words": len(text.split()), "lines": len(text.splitlines())}


class Delay(Tool):
    def execute(self, data, config):
        time.sleep(min(max(float(config.get("seconds", 0.1)), 0), 5))
        return data


TOOLS = {
    "json_formatter": JSONFormatter(),
    "email_draft": EmailDraft(),
    "document_parser": DocumentParser(),
    "delay": Delay(),
}
