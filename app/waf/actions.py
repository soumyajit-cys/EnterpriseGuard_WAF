from app.core.config import settings


def should_block(score: int):

    if settings.WAF_MODE == "prevention":
        return score >= 50

    return False