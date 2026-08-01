import json
import logging


class JsonFormatter(logging.Formatter):

    def format(self, record):
        payload = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "module": record.module,
        }

        if isinstance(record.msg, dict):
            payload.update(record.msg)
        else:
            payload["message"] = record.getMessage()

        if record.exc_info and record.exc_info[0]:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload)


logger = logging.getLogger("waf")

handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())

logger.addHandler(handler)
logger.setLevel(logging.INFO)
