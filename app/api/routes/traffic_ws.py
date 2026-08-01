from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.traffic_stream import traffic_stream

router = APIRouter(
    tags=["Traffic"],
)


@router.websocket("/ws/traffic")
async def ws_traffic(websocket: WebSocket):
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
