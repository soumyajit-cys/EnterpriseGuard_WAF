from app.waf.runtime import waf_mode


def should_block(score: int):

    if waf_mode.is_prevention:
        return score >= 50

    return False
