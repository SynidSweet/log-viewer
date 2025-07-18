import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import * as fs from 'fs/promises'
import * as path from 'path'

/**
 * Performance Alerting Configuration API
 * 
 * Manages alert thresholds, notification preferences, and alert history
 */

interface AlertConfig {
  id: string
  component: string
  metric: string
  threshold: number
  severity: 'warning' | 'critical'
  enabled: boolean
  cooldownMinutes: number
  description: string
}

// Alert history interface - reserved for future use
// interface AlertHistory {
//   id: string
//   configId: string
//   timestamp: string
//   component: string
//   metric: string
//   value: number
//   threshold: number
//   severity: 'warning' | 'critical'
//   resolved: boolean
//   resolvedAt?: string
// }

const DEFAULT_ALERT_CONFIGS: AlertConfig[] = [
  {
    id: 'logviewer-mount-warning',
    component: 'LogViewer',
    metric: 'mount',
    threshold: 33,
    severity: 'warning',
    enabled: true,
    cooldownMinutes: 5,
    description: 'LogViewer mount time exceeds 30fps threshold'
  },
  {
    id: 'logviewer-mount-critical',
    component: 'LogViewer',
    metric: 'mount',
    threshold: 50,
    severity: 'critical',
    enabled: true,
    cooldownMinutes: 15,
    description: 'LogViewer mount time critically slow'
  },
  {
    id: 'logviewer-update-warning',
    component: 'LogViewer',
    metric: 'update',
    threshold: 33,
    severity: 'warning',
    enabled: true,
    cooldownMinutes: 5,
    description: 'LogViewer update time exceeds 30fps threshold'
  },
  {
    id: 'logentrylist-mount-warning',
    component: 'LogEntryList',
    metric: 'mount',
    threshold: 16,
    severity: 'warning',
    enabled: true,
    cooldownMinutes: 5,
    description: 'LogEntryList mount time exceeds 60fps threshold'
  },
  {
    id: 'memory-growth-warning',
    component: 'Memory',
    metric: 'growth-factor',
    threshold: 2.0,
    severity: 'warning',
    enabled: true,
    cooldownMinutes: 30,
    description: 'Memory growth factor exceeds 2x'
  },
  {
    id: 'memory-growth-critical',
    component: 'Memory',
    metric: 'growth-factor',
    threshold: 3.0,
    severity: 'critical',
    enabled: true,
    cooldownMinutes: 60,
    description: 'Memory growth critically high'
  },
  {
    id: 'bundle-size-warning',
    component: 'Bundle',
    metric: 'size-kb',
    threshold: 250,
    severity: 'warning',
    enabled: true,
    cooldownMinutes: 1440, // 24 hours
    description: 'Bundle size exceeds budget'
  }
]

// GET: Retrieve alert configurations
export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Try to load saved configurations
    const configs = await loadAlertConfigs()
    
    return NextResponse.json({
      configs,
      defaultConfigs: DEFAULT_ALERT_CONFIGS
    })

  } catch (error) {
    console.error('[Alert Config] Error:', error)
    return NextResponse.json({
      configs: DEFAULT_ALERT_CONFIGS,
      defaultConfigs: DEFAULT_ALERT_CONFIGS
    })
  }
}

// POST: Update alert configuration
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
    const { action, configId, updates } = body

    let configs = await loadAlertConfigs()

    switch (action) {
      case 'update':
        configs = configs.map(config => 
          config.id === configId 
            ? { ...config, ...updates, id: configId } // Preserve ID
            : config
        )
        break

      case 'reset':
        configs = DEFAULT_ALERT_CONFIGS
        break

      case 'toggle':
        configs = configs.map(config => 
          config.id === configId 
            ? { ...config, enabled: !config.enabled }
            : config
        )
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Save updated configurations
    await saveAlertConfigs(configs)

    return NextResponse.json({
      success: true,
      configs,
      updatedBy: session.user.email,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[Alert Config] Update error:', error)
    return NextResponse.json(
      { error: 'Failed to update alert configuration' },
      { status: 500 }
    )
  }
}

// Load alert configurations from storage
async function loadAlertConfigs(): Promise<AlertConfig[]> {
  try {
    const configPath = path.join(process.cwd(), '.claude-testing', 'alert-configs.json')
    const data = await fs.readFile(configPath, 'utf8')
    return JSON.parse(data)
  } catch {
    // Return defaults if no saved configs
    return DEFAULT_ALERT_CONFIGS
  }
}

// Save alert configurations to storage
async function saveAlertConfigs(configs: AlertConfig[]): Promise<void> {
  const configDir = path.join(process.cwd(), '.claude-testing')
  const configPath = path.join(configDir, 'alert-configs.json')
  
  // Ensure directory exists
  try {
    await fs.mkdir(configDir, { recursive: true })
  } catch {
    // Directory might already exist
  }

  await fs.writeFile(configPath, JSON.stringify(configs, null, 2))
}