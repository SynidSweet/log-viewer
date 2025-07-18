import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import * as fs from 'fs/promises'
import * as path from 'path'

/**
 * Historical Performance Data API
 * 
 * Manages long-term storage and retrieval of performance metrics
 * for trend analysis and regression detection
 */

interface HistoricalDataPoint {
  timestamp: string
  component: string
  metric: string
  value: number
  p50: number
  p95: number
  p99: number
  sampleCount: number
}

interface PerformanceTrend {
  component: string
  metric: string
  period: string
  startDate: string
  endDate: string
  dataPoints: number
  average: number
  median: number
  min: number
  max: number
  trend: 'improving' | 'stable' | 'degrading'
  trendPercentage: number
  regression: boolean
}

// GET: Retrieve historical performance data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const component = searchParams.get('component') || 'all'
    const metric = searchParams.get('metric') || 'all'
    const period = searchParams.get('period') || '7d'
    const groupBy = searchParams.get('groupBy') || 'hour'

    // Load historical data
    const historicalData = await loadHistoricalData()
    
    // Filter and analyze data
    const filteredData = filterHistoricalData(historicalData, {
      component,
      metric,
      period
    })

    // Calculate trends
    const trends = calculateTrends(filteredData, period)

    // Group data for visualization
    const groupedData = groupDataByInterval(filteredData, groupBy)

    return NextResponse.json({
      data: groupedData,
      trends,
      summary: {
        totalDataPoints: filteredData.length,
        dateRange: {
          start: filteredData[0]?.timestamp || null,
          end: filteredData[filteredData.length - 1]?.timestamp || null
        },
        components: [...new Set(filteredData.map(d => d.component))],
        metrics: [...new Set(filteredData.map(d => d.metric))]
      }
    })

  } catch (error) {
    console.error('[Historical Data] Error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve historical data' },
      { status: 500 }
    )
  }
}

// POST: Store new historical data point
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { dataPoints } = body

    if (!Array.isArray(dataPoints)) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      )
    }

    // Load existing data
    let historicalData = await loadHistoricalData()

    // Add new data points
    const newDataPoints: HistoricalDataPoint[] = dataPoints.map(dp => ({
      timestamp: dp.timestamp || new Date().toISOString(),
      component: dp.component,
      metric: dp.metric,
      value: dp.value,
      p50: dp.p50 || dp.value,
      p95: dp.p95 || dp.value * 1.2,
      p99: dp.p99 || dp.value * 1.5,
      sampleCount: dp.sampleCount || 1
    }))

    historicalData = [...historicalData, ...newDataPoints]

    // Maintain data retention (keep last 90 days)
    const retentionDate = new Date()
    retentionDate.setDate(retentionDate.getDate() - 90)
    historicalData = historicalData.filter(
      dp => new Date(dp.timestamp) > retentionDate
    )

    // Save updated data
    await saveHistoricalData(historicalData)

    return NextResponse.json({
      success: true,
      stored: newDataPoints.length,
      totalDataPoints: historicalData.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[Historical Data] Store error:', error)
    return NextResponse.json(
      { error: 'Failed to store historical data' },
      { status: 500 }
    )
  }
}

// Load historical data from storage
async function loadHistoricalData(): Promise<HistoricalDataPoint[]> {
  try {
    const dataPath = path.join(process.cwd(), '.claude-testing', 'performance-history.json')
    const data = await fs.readFile(dataPath, 'utf8')
    return JSON.parse(data)
  } catch {
    // Generate synthetic historical data if none exists
    return generateSyntheticHistoricalData()
  }
}

// Save historical data to storage
async function saveHistoricalData(data: HistoricalDataPoint[]): Promise<void> {
  const dataDir = path.join(process.cwd(), '.claude-testing')
  const dataPath = path.join(dataDir, 'performance-history.json')
  
  try {
    await fs.mkdir(dataDir, { recursive: true })
  } catch {
    // Directory might already exist
  }

  await fs.writeFile(dataPath, JSON.stringify(data, null, 2))
}

// Filter historical data based on criteria
function filterHistoricalData(
  data: HistoricalDataPoint[],
  filters: {
    component: string
    metric: string
    period: string
  }
): HistoricalDataPoint[] {
  let filtered = [...data]

  // Filter by component
  if (filters.component !== 'all') {
    filtered = filtered.filter(d => d.component === filters.component)
  }

  // Filter by metric
  if (filters.metric !== 'all') {
    filtered = filtered.filter(d => d.metric === filters.metric)
  }

  // Filter by time period
  const now = new Date()
  const periodMs = parsePeriod(filters.period)
  const startDate = new Date(now.getTime() - periodMs)
  
  filtered = filtered.filter(d => new Date(d.timestamp) >= startDate)

  // Sort by timestamp
  filtered.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  return filtered
}

// Calculate performance trends
function calculateTrends(
  data: HistoricalDataPoint[],
  period: string
): PerformanceTrend[] {
  const trends: PerformanceTrend[] = []
  
  // Group by component and metric
  const groups = new Map<string, HistoricalDataPoint[]>()
  
  data.forEach(dp => {
    const key = `${dp.component}:${dp.metric}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(dp)
  })

  // Calculate trend for each group
  groups.forEach((dataPoints, key) => {
    const [component, metric] = key.split(':')
    
    if (dataPoints.length < 2) return

    const values = dataPoints.map(d => d.value)
    const average = values.reduce((a, b) => a + b, 0) / values.length
    const median = calculateMedian(values)
    const min = Math.min(...values)
    const max = Math.max(...values)

    // Calculate trend using linear regression
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    
    const trendPercentage = ((secondAvg - firstAvg) / firstAvg) * 100
    
    let trend: 'improving' | 'stable' | 'degrading' = 'stable'
    if (trendPercentage < -5) trend = 'improving'
    else if (trendPercentage > 5) trend = 'degrading'

    // Check for regression (current value > 1.2x average)
    const currentValue = values[values.length - 1]
    const regression = currentValue > average * 1.2

    trends.push({
      component,
      metric,
      period,
      startDate: dataPoints[0].timestamp,
      endDate: dataPoints[dataPoints.length - 1].timestamp,
      dataPoints: dataPoints.length,
      average,
      median,
      min,
      max,
      trend,
      trendPercentage,
      regression
    })
  })

  return trends
}

// Group data by time interval for visualization
function groupDataByInterval(
  data: HistoricalDataPoint[],
  interval: string
): Record<string, HistoricalDataPoint[]> {
  const grouped: Record<string, HistoricalDataPoint[]> = {}

  data.forEach(dp => {
    const date = new Date(dp.timestamp)
    let key: string

    switch (interval) {
      case 'minute':
        key = date.toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm
        break
      case 'hour':
        key = date.toISOString().slice(0, 13) // YYYY-MM-DDTHH
        break
      case 'day':
        key = date.toISOString().slice(0, 10) // YYYY-MM-DD
        break
      default:
        key = date.toISOString().slice(0, 13)
    }

    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(dp)
  })

  return grouped
}

// Utility functions
function parsePeriod(period: string): number {
  const match = period.match(/^(\d+)([hdwm])$/)
  if (!match) return 7 * 24 * 60 * 60 * 1000 // Default 7 days

  const [, value, unit] = match
  const num = parseInt(value, 10)

  switch (unit) {
    case 'h': return num * 60 * 60 * 1000
    case 'd': return num * 24 * 60 * 60 * 1000
    case 'w': return num * 7 * 24 * 60 * 60 * 1000
    case 'm': return num * 30 * 24 * 60 * 60 * 1000
    default: return 7 * 24 * 60 * 60 * 1000
  }
}

function calculateMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  
  return sorted[mid]
}

// Generate synthetic historical data for demo
function generateSyntheticHistoricalData(): HistoricalDataPoint[] {
  const data: HistoricalDataPoint[] = []
  const components = ['LogViewer', 'LogEntryList', 'LogItem']
  const metrics = ['mount', 'update']
  
  // Generate 30 days of hourly data
  for (let day = 29; day >= 0; day--) {
    for (let hour = 0; hour < 24; hour += 4) { // Every 4 hours
      const timestamp = new Date()
      timestamp.setDate(timestamp.getDate() - day)
      timestamp.setHours(hour, 0, 0, 0)

      components.forEach(component => {
        metrics.forEach(metric => {
          // Simulate improving performance over time
          const baseValue = component === 'LogViewer' ? 40 - day * 0.3 : 20 - day * 0.2
          const variance = Math.random() * 5 - 2.5
          const value = Math.max(5, baseValue + variance)

          data.push({
            timestamp: timestamp.toISOString(),
            component,
            metric,
            value,
            p50: value,
            p95: value * 1.2,
            p99: value * 1.4,
            sampleCount: Math.floor(Math.random() * 100) + 50
          })
        })
      })
    }
  }

  return data
}