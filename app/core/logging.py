import logging
import json


class JsonFormatter(logging.Formatter):

    def format(self, record):
        payload = {
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
        }

        return json.dumps(payload)


logger = logging.getLogger("waf")

handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())

logger.addHandler(handler)
logger.setLevel(logging.INFO)


