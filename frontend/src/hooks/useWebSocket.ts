import { useEffect, useRef, useCallback } from "react"

interface UseWebSocketOptions {
  onOpen?: () => void
  onClose?: () => void
  onMessage?: (data: any) => void
  onError?: (error: Event) => void
  reconnectInterval?: number
  maxRetries?: number
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const {
    onOpen,
    onClose,
    onMessage,
    onError,
    reconnectInterval = 3000,
    maxRetries = 10,
  } = options

  const wsRef = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)
  const mountedRef = useRef(true)

  const connect = useCallback(() => {
    if (!mountedRef.current || retriesRef.current >= maxRetries) return

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        retriesRef.current = 0
        onOpen?.()
      }

      ws.onclose = () => {
        onClose?.()
        if (mountedRef.current) {
          setTimeout(() => {
            retriesRef.current++
            connect()
          }, reconnectInterval)
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onMessage?.(data)
        } catch {
          onMessage?.(event.data)
        }
      }

      ws.onerror = (error) => {
        onError?.(error)
      }
    } catch (error) {
      if (mountedRef.current) {
        setTimeout(() => {
          retriesRef.current++
          connect()
        }, reconnectInterval)
      }
    }
  }, [url, onOpen, onClose, onMessage, onError, reconnectInterval, maxRetries])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      wsRef.current?.close()
    }
  }, [connect])

  return { ws: wsRef.current }
}
