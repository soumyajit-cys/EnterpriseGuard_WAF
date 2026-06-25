from fastapi import APIRouter

from app.core.config import settings

from app.waf.rules.blocklist import (
    BlockList
)

router = APIRouter(
    prefix="/waf",
    tags=["WAF"]
)


@router.get("/mode")
async def get_mode():

    return {
        "mode": settings.WAF_MODE
    }


@router.post("/blocklist/{ip}")
async def add_block(ip: str):

    BlockList.add(ip)

    return {
        "status": "added",
        "ip": ip
    }


@router.get("/blocklist")
async def list_blocked():

    return {
        "ips": list(
            BlockList.BLOCKED_IPS
        )
    }