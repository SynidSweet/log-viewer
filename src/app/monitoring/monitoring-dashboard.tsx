'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Activity, AlertTriangle, TrendingUp, Clock, Database } from '@/components/icons'

interface PerformanceMetrics {
  timestamp: string
  component: string
  phase: 'mount' | 'update'
  duration: number
  threshold: number
  status: 'pass' | 'warning' | 'fail'
}

interface PerformanceTrend {
  period: string
  average: number
  p95: number
  p99: number
  trend: 'improving' | 'stable' | 'degrading'
}

interface Alert {
  id: string
  timestamp: string
  severity: 'warning' | 'critical'
  component: string
  message: string
  value: number
  threshold: number
}

interface PerformanceBudget {
  component: string
  metric: string
  budget: number
  current: number
  status: 'pass' | 'warning' | 'fail'
  remaining: number
}

export default function MonitoringDashboard() {
  const { data: session, status } = useSession()
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [, setTrends] = useState<PerformanceTrend[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [budgets, setBudgets] = useState<PerformanceBudget[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [historicalData, setHistoricalData] = useState<{ date: string; avgDuration: number }[]>([])

  // Performance monitoring logic
  useEffect(() => {
    if (!isMonitoring) return

    const monitoringInterval = setInterval(async () => {
      try {
        // Fetch real-time performance data
        const response = await fetch('/api/monitoring/metrics')
        if (response.ok) {
          const data = await response.json()
          
          // Update metrics
          setMetrics(data.metrics || [])
          setTrends(data.trends || [])
          setAlerts(prev => [...prev, ...(data.newAlerts || [])].slice(-20))
          setBudgets(data.budgets || [])
          setHistoricalData(data.historical || [])
          setLastUpdate(new Date())
        }
      } catch (error) {
        console.error('Monitoring fetch error:', error)
      }
    }, 5000) // Update every 5 seconds

    return () => clearInterval(monitoringInterval)
  }, [isMonitoring])

  // Authentication check
  if (status === 'loading') {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">🔒 Authentication Required</h1>
          <p className="text-gray-600 mb-4">
            This performance monitoring dashboard requires authentication to access.
          </p>
          <Button 
            onClick={() => window.location.href = '/api/auth/signin'}
            className="w-full"
          >
            Sign In with Google
          </Button>
        </Card>
      </div>
    )
  }

  // Calculate summary statistics
  const calculateSummaryStats = () => {
    const recentMetrics = metrics.slice(-100)
    if (recentMetrics.length === 0) {
      return { avgDuration: 0, passRate: 0, criticalCount: 0 }
    }

    const avgDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
    const passRate = (recentMetrics.filter(m => m.status === 'pass').length / recentMetrics.length) * 100
    const criticalCount = alerts.filter(a => a.severity === 'critical').length

    return { avgDuration, passRate, criticalCount }
  }

  const stats = calculateSummaryStats()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Performance Monitoring Dashboard</h1>
          <Badge variant={session ? 'default' : 'secondary'}>
            {session.user?.email}
          </Badge>
        </div>
        <p className="text-gray-600">
          Production-ready performance monitoring with real-time metrics, alerts, and budget tracking
        </p>
      </div>

      {/* Control Panel */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setIsMonitoring(!isMonitoring)}
              variant={isMonitoring ? 'destructive' : 'default'}
            >
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </Button>
            <Badge variant={isMonitoring ? 'default' : 'secondary'}>
              <Activity className="w-3 h-3 mr-1" />
              {isMonitoring ? 'Live' : 'Paused'}
            </Badge>
            {lastUpdate && (
              <span className="text-sm text-gray-500">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Duration</p>
              <p className="text-2xl font-bold">{stats.avgDuration.toFixed(2)}ms</p>
            </div>
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pass Rate</p>
              <p className="text-2xl font-bold">{stats.passRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Alerts</p>
              <p className="text-2xl font-bold">{alerts.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Issues</p>
              <p className="text-2xl font-bold">{stats.criticalCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Performance Budgets */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Performance Budgets</h2>
        <div className="space-y-3">
          {budgets.length === 0 ? (
            <p className="text-gray-500">No budget data available. Start monitoring to see budgets.</p>
          ) : (
            budgets.map((budget, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{budget.component}</span>
                    <Badge variant={budget.status === 'pass' ? 'default' : budget.status === 'warning' ? 'secondary' : 'destructive'}>
                      {budget.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{budget.metric}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{budget.current}ms / {budget.budget}ms</p>
                  <p className="text-sm text-gray-600">
                    {budget.remaining > 0 ? `${budget.remaining}ms remaining` : `${Math.abs(budget.remaining)}ms over budget`}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Current Performance */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Real-time Performance</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {metrics.length === 0 ? (
              <p className="text-gray-500">No metrics available. Start monitoring to see real-time data.</p>
            ) : (
              metrics.slice(-10).reverse().map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-2 border-b">
                  <div className="flex items-center gap-2">
                    <Badge variant={metric.status === 'pass' ? 'default' : metric.status === 'warning' ? 'secondary' : 'destructive'}>
                      {metric.status}
                    </Badge>
                    <span className="text-sm">{metric.component} ({metric.phase})</span>
                  </div>
                  <span className={`text-sm font-medium ${metric.status === 'pass' ? 'text-green-600' : metric.status === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
                    {metric.duration.toFixed(2)}ms
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Alerts */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Performance Alerts</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-gray-500">No alerts. Performance is within acceptable thresholds.</p>
            ) : (
              alerts.slice(-10).reverse().map((alert) => (
                <div key={alert.id} className={`p-3 rounded ${alert.severity === 'critical' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-4 h-4 ${alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'}`} />
                      <span className="font-medium text-sm">{alert.component}</span>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm mt-1">{alert.message}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {alert.value.toFixed(2)}ms (threshold: {alert.threshold}ms)
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Historical Trends */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Historical Performance Trends</h2>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
          {historicalData.length === 0 ? (
            <div className="text-center text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Historical data will appear here once monitoring begins</p>
            </div>
          ) : (
            <div className="w-full p-4">
              {/* Simple text-based visualization for now */}
              <div className="space-y-2">
                {historicalData.slice(-7).map((data, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{data.date}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-48 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${data.avgDuration < 33 ? 'bg-green-500' : data.avgDuration < 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min((data.avgDuration / 100) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-20 text-right">{data.avgDuration.toFixed(2)}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}