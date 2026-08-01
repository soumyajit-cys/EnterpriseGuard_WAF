import asyncio
import json
from typing import Any


class TrafficStreamManager:

    def __init__(self):
        self._connections: set[asyncio.Queue] = set()

    async def connect(self):
        queue: asyncio.Queue = asyncio.Queue(maxsize=200)
        self._connections.add(queue)
        return queue

    def disconnect(self, queue):
        self._connections.discard(queue)

    async def broadcast(self, event: dict[str, Any]):
        if not self._connections:
            return
        message = json.dumps(event, default=str)
        stale = []
        for queue in self._connections:
            try:
                queue.put_nowait(message)
            except asyncio.QueueFull:
                try:
                    queue.get_nowait()
                    queue.put_nowait(message)
                except Exception:
                    stale.append(queue)
        for queue in stale:
            self.disconnect(queue)

    def connection_count(self) -> int:
        return len(self._connections)


traffic_stream = TrafficStreamManager()
