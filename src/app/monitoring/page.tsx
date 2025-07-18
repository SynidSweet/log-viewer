import SessionWrapper from './session-wrapper'
import MonitoringDashboard from './monitoring-dashboard'

export default function MonitoringPage() {
  return (
    <SessionWrapper>
      <MonitoringDashboard />
    </SessionWrapper>
  )
}

// Force dynamic to ensure authentication works correctly
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'