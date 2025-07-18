// components/profiler/performance-profiler.tsx
'use client'

import { Profiler, ProfilerOnRenderCallback } from 'react'
import { ReactNode } from 'react'

interface PerformanceProfilerProps {
  id: string
  children: ReactNode
  onRender?: ProfilerOnRenderCallback
}

interface ProfilerData {
  id: string
  phase: 'mount' | 'update' | 'nested-update'
  actualDuration: number
  baseDuration: number
  startTime: number
  commitTime: number
  interactions: Set<unknown>
}

/**
 * Performance Profiler Component
 * 
 * This component wraps React components with React's Profiler API to collect
 * performance data during development. It integrates with the existing
 * performance monitoring infrastructure to provide comprehensive analysis.
 * 
 * Features:
 * - Collects render timing data for wrapped components
 * - Integrates with existing performance monitoring system
 * - Provides detailed performance metrics for development analysis
 * - Automatically logs performance data to console in development
 * - Stores profiling data for historical analysis
 * 
 * Usage:
 *   <PerformanceProfiler id="LogViewer">
 *     <LogViewer />
 *   </PerformanceProfiler>
 * 
 * @param id - Unique identifier for the profiled component
 * @param children - React components to profile
 * @param onRender - Optional custom render callback
 */
export function PerformanceProfiler({ id, children, onRender }: PerformanceProfilerProps) {
  const handleRender: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  ) => {
    // Call custom onRender if provided
    if (onRender) {
      onRender(id, phase, actualDuration, baseDuration, startTime, commitTime)
    }

    // Only collect data in development mode
    if (process.env.NODE_ENV === 'development') {
      const profilerData: ProfilerData = {
        id,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
        interactions: new Set()
      }

      // Log to console for immediate debugging
      logProfilerData(profilerData)

      // Store data for historical analysis
      storeProfilerData(profilerData)

      // Check for performance issues
      checkPerformanceThresholds(profilerData)
    }
  }

  return (
    <Profiler id={id} onRender={handleRender}>
      {children}
    </Profiler>
  )
}

/**
 * Log profiler data to console
 */
function logProfilerData(data: ProfilerData) {
  const { id, phase, actualDuration, baseDuration } = data
  
  // Color-code based on performance
  const isSlowRender = actualDuration > 16 // 16ms = 60fps threshold
  const style = isSlowRender ? 'color: red; font-weight: bold;' : 'color: green;'
  
  console.log(
    `%c[React Profiler] ${id} (${phase}): ${actualDuration.toFixed(2)}ms (baseline: ${baseDuration.toFixed(2)}ms)`,
    style
  )

  // Log additional details for slow renders
  if (isSlowRender) {
    console.warn(`🐌 Slow render detected in ${id}:`, {
      actualDuration: `${actualDuration.toFixed(2)}ms`,
      baseDuration: `${baseDuration.toFixed(2)}ms`,
      phase,
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * Store profiler data for historical analysis
 */
function storeProfilerData(data: ProfilerData) {
  try {
    // Get existing data from localStorage
    const existingData = localStorage.getItem('react-profiler-data')
    const profilerHistory = existingData ? JSON.parse(existingData) : []

    // Add new data point
    profilerHistory.push({
      ...data,
      timestamp: Date.now(),
      interactions: Array.from(data.interactions) // Convert Set to Array for JSON storage
    })

    // Keep only last 100 entries to prevent storage bloat
    const recentData = profilerHistory.slice(-100)

    // Store back to localStorage
    localStorage.setItem('react-profiler-data', JSON.stringify(recentData))
  } catch (error) {
    console.error('Failed to store profiler data:', error)
  }
}

/**
 * Check performance thresholds and generate alerts
 */
function checkPerformanceThresholds(data: ProfilerData) {
  const { id, actualDuration, baseDuration, phase } = data

  // Performance thresholds
  const thresholds = {
    warning: 16,  // 16ms = 60fps
    critical: 33  // 33ms = 30fps
  }

  // Check actual duration threshold
  if (actualDuration > thresholds.critical) {
    console.error(`🚨 Critical performance issue in ${id}:`, {
      actualDuration: `${actualDuration.toFixed(2)}ms`,
      threshold: `${thresholds.critical}ms`,
      phase,
      recommendation: 'Consider optimizing this component with React.memo or useMemo'
    })

    // Integrate with existing performance monitoring
    notifyPerformanceMonitoring('CRITICAL_RENDER', {
      component: id,
      duration: actualDuration,
      threshold: thresholds.critical,
      phase
    })
  } else if (actualDuration > thresholds.warning) {
    console.warn(`⚠️ Performance warning in ${id}:`, {
      actualDuration: `${actualDuration.toFixed(2)}ms`,
      threshold: `${thresholds.warning}ms`,
      phase,
      recommendation: 'Consider profiling this component for optimization opportunities'
    })

    // Integrate with existing performance monitoring
    notifyPerformanceMonitoring('SLOW_RENDER', {
      component: id,
      duration: actualDuration,
      threshold: thresholds.warning,
      phase
    })
  }

  // Check for unnecessary re-renders - only if baseDuration is valid
  const isUnnecessaryRender = phase === 'update' && baseDuration > 0 && actualDuration > baseDuration * 2
  if (isUnnecessaryRender) {
    // Safe ratio calculation with fallback
    const ratio = baseDuration > 0 ? actualDuration / baseDuration : 0;
    const ratioText = baseDuration > 0 ? `${ratio.toFixed(2)}x baseline` : 'baseline unavailable';
    
    console.warn(`🔄 Potentially unnecessary re-render in ${id}:`, {
      actualDuration: `${actualDuration.toFixed(2)}ms`,
      baseDuration: `${baseDuration.toFixed(2)}ms`,
      ratio: ratioText,
      recommendation: 'Check for unstable props or missing memoization'
    })

    // Integrate with existing performance monitoring
    notifyPerformanceMonitoring('UNNECESSARY_RENDER', {
      component: id,
      actualDuration,
      baseDuration,
      ratio: ratio
    })
  }
}

/**
 * Notify existing performance monitoring system
 */
function notifyPerformanceMonitoring(type: string, data: unknown) {
  try {
    // Try to integrate with existing performance monitoring
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).performanceMonitor) {
      const monitor = (window as unknown as Record<string, unknown>).performanceMonitor as { recordProfilerEvent: (type: string, data: unknown) => void }
      monitor.recordProfilerEvent(type, data)
    }

    // Store in performance monitoring format
    const performanceEvent = {
      timestamp: Date.now(),
      type: 'REACT_PROFILER',
      subtype: type,
      data,
      source: 'PerformanceProfiler'
    }

    // Store in localStorage for development monitoring scripts
    const existingEvents = localStorage.getItem('performance-events')
    const events = existingEvents ? JSON.parse(existingEvents) : []
    events.push(performanceEvent)
    
    // Keep only last 50 events
    const recentEvents = events.slice(-50)
    localStorage.setItem('performance-events', JSON.stringify(recentEvents))
  } catch (error) {
    console.error('Failed to notify performance monitoring:', error)
  }
}

/**
 * Utility function to get profiler data history
 */
export function getProfilerHistory() {
  try {
    const data = localStorage.getItem('react-profiler-data')
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to get profiler history:', error)
    return []
  }
}

/**
 * Utility function to clear profiler data
 */
export function clearProfilerData() {
  try {
    localStorage.removeItem('react-profiler-data')
    localStorage.removeItem('performance-events')
    console.log('Profiler data cleared')
  } catch (error) {
    console.error('Failed to clear profiler data:', error)
  }
}

/**
 * Utility function to analyze profiler data
 */
export function analyzeProfilerData() {
  const history = getProfilerHistory()
  
  if (history.length === 0) {
    console.log('No profiler data available')
    return
  }

  // Group by component
  interface ComponentStats {
    renders: number
    totalDuration: number
    avgDuration: number
    maxDuration: number
    minDuration: number
    phases: { mount: number; update: number; 'nested-update': number }
  }
  
  const componentData = history.reduce((acc: Record<string, ComponentStats>, item: ProfilerData) => {
    if (!acc[item.id]) {
      acc[item.id] = {
        renders: 0,
        totalDuration: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
        phases: { mount: 0, update: 0, 'nested-update': 0 }
      }
    }
    
    acc[item.id].renders++
    acc[item.id].totalDuration += item.actualDuration
    acc[item.id].maxDuration = Math.max(acc[item.id].maxDuration, item.actualDuration)
    acc[item.id].minDuration = Math.min(acc[item.id].minDuration, item.actualDuration)
    acc[item.id].phases[item.phase]++
    
    return acc
  }, {} as Record<string, ComponentStats>)

  // Calculate averages
  Object.keys(componentData).forEach(id => {
    const data = componentData[id]
    data.avgDuration = data.totalDuration / data.renders
  })

  console.log('📊 React Profiler Analysis:', componentData)
  return componentData
}

// Export utilities for development use
if (process.env.NODE_ENV === 'development') {
  (window as unknown as Record<string, unknown>).reactProfiler = {
    getHistory: getProfilerHistory,
    clearData: clearProfilerData,
    analyze: analyzeProfilerData
  }
}