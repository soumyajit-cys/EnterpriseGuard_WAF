from pydantic import BaseModel


class WAFDecision(BaseModel):
    block: bool
    reason: str | None = None
    score: int = 0