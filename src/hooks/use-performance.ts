import { useEffect, useRef, useCallback } from 'react'

interface PerformanceMetrics {
  renderTime: number
  componentName: string
  timestamp: number
}

// Hook to measure component render performance
export function useRenderPerformance(componentName: string) {
  const renderStartTime = useRef<number>(0)
  const renderCount = useRef<number>(0)

  useEffect(() => {
    renderStartTime.current = performance.now()
    
    return () => {
      const renderEndTime = performance.now()
      const renderTime = renderEndTime - renderStartTime.current
      renderCount.current++

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName} rendered in ${renderTime.toFixed(2)}ms (render #${renderCount.current})`)
      }

      // Send metrics to analytics in production
      if (process.env.NODE_ENV === 'production' && renderTime > 100) {
        // Log slow renders
        sendPerformanceMetrics({
          renderTime,
          componentName,
          timestamp: Date.now(),
        })
      }
    }
  })
}

// Hook to debounce expensive operations
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  ) as T

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

// Hook to detect and warn about performance issues
export function usePerformanceMonitor(threshold = 16.67) {
  // 16.67ms = 60fps
  const frameRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number>(0)
  const slowFramesRef = useRef<number>(0)

  useEffect(() => {
    const checkPerformance = (timestamp: number) => {
      if (lastFrameTimeRef.current) {
        const frameDuration = timestamp - lastFrameTimeRef.current
        
        if (frameDuration > threshold) {
          slowFramesRef.current++
          
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[Performance] Slow frame detected: ${frameDuration.toFixed(2)}ms`)
          }
        }
      }
      
      lastFrameTimeRef.current = timestamp
      frameRef.current = requestAnimationFrame(checkPerformance)
    }

    frameRef.current = requestAnimationFrame(checkPerformance)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [threshold])

  return {
    slowFrames: slowFramesRef.current,
  }
}

// Memory leak detection hook
export function useMemoryLeakDetector(componentName: string) {
  const mountedRef = useRef(true)
  const listenersRef = useRef<Set<() => void>>(new Set())

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      
      // Check for potential memory leaks
      if (listenersRef.current.size > 0) {
        console.warn(
          `[Memory Leak] ${componentName} unmounted with ${listenersRef.current.size} active listeners`
        )
      }
    }
  }, [componentName])

  const addListener = useCallback((listener: () => void) => {
    listenersRef.current.add(listener)
  }, [])

  const removeListener = useCallback((listener: () => void) => {
    listenersRef.current.delete(listener)
  }, [])

  const isMounted = useCallback(() => mountedRef.current, [])

  return {
    addListener,
    removeListener,
    isMounted,
  }
}

// Utility function to send performance metrics
async function sendPerformanceMetrics(metrics: PerformanceMetrics) {
  try {
    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to analytics endpoint
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics),
      })
    }
  } catch (error) {
    console.error('Failed to send performance metrics:', error)
  }
}