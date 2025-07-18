import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import * as fs from 'fs/promises'
import * as path from 'path'

/**
 * Performance Budget Management API
 * 
 * Manages performance budgets with automated enforcement and reporting
 */

interface PerformanceBudget {
  id: string
  name: string
  category: 'timing' | 'size' | 'memory' | 'custom'
  metric: string
  value: number
  unit: 'ms' | 'kb' | 'mb' | 'count' | 'ratio'
  enforcement: 'warning' | 'error' | 'block'
  description: string
  createdAt: string
  updatedAt: string
  updatedBy: string
}

interface BudgetValidation {
  budgetId: string
  name: string
  currentValue: number
  budgetValue: number
  unit: string
  status: 'pass' | 'warning' | 'fail'
  percentUsed: number
  remaining: number
  message: string
}

const DEFAULT_BUDGETS: PerformanceBudget[] = [
  {
    id: 'logviewer-render-30fps',
    name: 'LogViewer 30fps Render',
    category: 'timing',
    metric: 'logviewer.render',
    value: 33,
    unit: 'ms',
    enforcement: 'error',
    description: 'LogViewer must render within 33ms for 30fps performance',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: 'system'
  },
  {
    id: 'logentrylist-render-60fps',
    name: 'LogEntryList 60fps Render',
    category: 'timing',
    metric: 'logentrylist.render',
    value: 16,
    unit: 'ms',
    enforcement: 'warning',
    description: 'LogEntryList should render within 16ms for 60fps performance',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: 'system'
  },
  {
    id: 'bundle-size-js',
    name: 'JavaScript Bundle Size',
    category: 'size',
    metric: 'bundle.js.gzipped',
    value: 250,
    unit: 'kb',
    enforcement: 'warning',
    description: 'Gzipped JavaScript bundle should not exceed 250KB',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: 'system'
  },
  {
    id: 'memory-growth-5k',
    name: 'Memory Growth Factor (5K entries)',
    category: 'memory',
    metric: 'memory.growth.5000',
    value: 2.0,
    unit: 'ratio',
    enforcement: 'error',
    description: 'Memory should not grow more than 2x with 5000 log entries',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: 'system'
  },
  {
    id: 'first-contentful-paint',
    name: 'First Contentful Paint',
    category: 'timing',
    metric: 'fcp',
    value: 1000,
    unit: 'ms',
    enforcement: 'warning',
    description: 'First contentful paint should occur within 1 second',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: 'system'
  }
]

// GET: Retrieve performance budgets and validation status
export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const budgets = await loadBudgets()
    const validations = await validateBudgets(budgets)

    return NextResponse.json({
      budgets,
      validations,
      summary: {
        total: validations.length,
        passing: validations.filter(v => v.status === 'pass').length,
        warnings: validations.filter(v => v.status === 'warning').length,
        failing: validations.filter(v => v.status === 'fail').length
      }
    })

  } catch (error) {
    console.error('[Performance Budgets] Error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve budgets' },
      { status: 500 }
    )
  }
}

// POST: Create or update performance budget
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
    const { action, budget, budgetId } = body

    let budgets = await loadBudgets()

    switch (action) {
      case 'create':
        const newBudget: PerformanceBudget = {
          ...budget,
          id: `budget-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: session.user.email
        }
        budgets.push(newBudget)
        break

      case 'update':
        budgets = budgets.map(b => 
          b.id === budgetId 
            ? {
                ...b,
                ...budget,
                id: budgetId,
                updatedAt: new Date().toISOString(),
                updatedBy: session.user.email
              }
            : b
        )
        break

      case 'delete':
        budgets = budgets.filter(b => b.id !== budgetId)
        break

      case 'reset':
        budgets = DEFAULT_BUDGETS
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    await saveBudgets(budgets)

    return NextResponse.json({
      success: true,
      budgets,
      updatedBy: session.user.email,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[Performance Budgets] Update error:', error)
    return NextResponse.json(
      { error: 'Failed to update budgets' },
      { status: 500 }
    )
  }
}

// Load budgets from storage
async function loadBudgets(): Promise<PerformanceBudget[]> {
  try {
    const budgetPath = path.join(process.cwd(), '.claude-testing', 'performance-budgets.json')
    const data = await fs.readFile(budgetPath, 'utf8')
    return JSON.parse(data)
  } catch {
    return DEFAULT_BUDGETS
  }
}

// Save budgets to storage
async function saveBudgets(budgets: PerformanceBudget[]): Promise<void> {
  const budgetDir = path.join(process.cwd(), '.claude-testing')
  const budgetPath = path.join(budgetDir, 'performance-budgets.json')
  
  try {
    await fs.mkdir(budgetDir, { recursive: true })
  } catch {
    // Directory might already exist
  }

  await fs.writeFile(budgetPath, JSON.stringify(budgets, null, 2))
}

// Validate budgets against current metrics
async function validateBudgets(budgets: PerformanceBudget[]): Promise<BudgetValidation[]> {
  const validations: BudgetValidation[] = []

  // In a real implementation, these would come from actual metrics
  const currentMetrics = {
    'logviewer.render': 28.5,
    'logentrylist.render': 14.2,
    'bundle.js.gzipped': 198.5,
    'memory.growth.5000': 1.8,
    'fcp': 850
  }

  for (const budget of budgets) {
    const currentValue = currentMetrics[budget.metric as keyof typeof currentMetrics] || 0
    const percentUsed = (currentValue / budget.value) * 100
    const remaining = budget.value - currentValue

    let status: 'pass' | 'warning' | 'fail' = 'pass'
    let message = 'Within budget'

    if (currentValue > budget.value) {
      status = budget.enforcement === 'error' ? 'fail' : 'warning'
      message = `Exceeds budget by ${Math.abs(remaining).toFixed(2)} ${budget.unit}`
    } else if (percentUsed > 90) {
      status = 'warning'
      message = `Using ${percentUsed.toFixed(1)}% of budget`
    }

    validations.push({
      budgetId: budget.id,
      name: budget.name,
      currentValue,
      budgetValue: budget.value,
      unit: budget.unit,
      status,
      percentUsed,
      remaining,
      message
    })
  }

  return validations
}