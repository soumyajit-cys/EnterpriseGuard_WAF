from fastapi import APIRouter
from fastapi import Depends

from app.auth.dependencies import (
    get_current_user
)

router = APIRouter(
    prefix="/rules",
    tags=["Rules"]
)


@router.get("/")
async def list_rules(
    user=Depends(
        get_current_user
    )
):
    return {
        "rules": []
    }


@router.post("/")
async def create_rule(
    payload: dict,
    user=Depends(
        get_current_user
    )
):
    return {
        "message": "rule created"
    }


@router.put("/{rule_id}")
async def update_rule(
    rule_id: int,
    payload: dict,
    user=Depends(
        get_current_user
    )
):
    return {
        "message": "updated"
    }


@router.delete("/{rule_id}")
async def delete_rule(
    rule_id: int,
    user=Depends(
        get_current_user
    )
):
    return {
        "message": "deleted"
    }