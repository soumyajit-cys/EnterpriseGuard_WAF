from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.auth.jwt import decode_token
from app.services.traffic_stream import traffic_stream

router = APIRouter(
    tags=["Traffic"],
)


@router.websocket("/ws/traffic")
async def ws_traffic(
    websocket: WebSocket,
    token: str = Query(""),
):
    token = token or websocket.cookies.get("access_token", "")
    payload = decode_token(token)
    if not payload.get("sub") or payload.get("type") != "access":
        await websocket.close(code=4401, reason="Unauthorized")
        return

    await websocket.accept()
    queue = await traffic_stream.connect()
    try:
        while True:
            message = await queue.get()
            await websocket.send_text(message)
    except WebSocketDisconnect:
        pass
    finally:
        traffic_stream.disconnect(queue)