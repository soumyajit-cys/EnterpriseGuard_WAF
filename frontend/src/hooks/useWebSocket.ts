import { useEffect, useRef, useCallback } from "react"

interface UseWebSocketOptions {
  onOpen?: () => void
  onClose?: (code: number) => void
  onMessage?: (data: unknown) => void
  onError?: (error: Event) => void
  reconnectInterval?: number
  maxRetries?: number
  noRetryCodes?: number[]
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const {
    onOpen,
    onClose,
    onMessage,
    onError,
    reconnectInterval = 3000,
    maxRetries = 10,
    noRetryCodes = [],
  } = options

  const wsRef = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)
  const mountedRef = useRef(true)

  const connect = useCallback(function connect() {
    if (!mountedRef.current || retriesRef.current >= maxRetries) return

    try {
      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.CONNECTING ||
          wsRef.current.readyState === WebSocket.OPEN)
      ) {
        wsRef.current.close()
      }

      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        retriesRef.current = 0
        onOpen?.()
      }

      ws.onclose = (event) => {
        onClose?.(event.code)
        const fatal = noRetryCodes.includes(event.code)
        if (mountedRef.current && !fatal) {
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
    } catch {
      if (mountedRef.current) {
        setTimeout(() => {
          retriesRef.current++
          connect()
        }, reconnectInterval)
      }
    }
  }, [url, onOpen, onClose, onMessage, onError, reconnectInterval, maxRetries, noRetryCodes])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      wsRef.current?.close()
    }
  }, [connect])
}
