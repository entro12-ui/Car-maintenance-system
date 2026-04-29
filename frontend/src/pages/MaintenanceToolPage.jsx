import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import SetupScreenFrame from './SetupScreenFrame'
import { MAINTENANCE_MENU } from './MaintenanceSidebarMenu'

export default function MaintenanceToolPage() {
  const { slug } = useParams()
  const entry = useMemo(() => MAINTENANCE_MENU.find((item) => item.slug === slug), [slug])

  if (!slug || !entry) {
    return <Navigate to="/maintenance-hub" replace />
  }

  if (entry.path) {
    return <Navigate to={entry.path} replace />
  }

  return (
    <SetupScreenFrame
      hubTo="/maintenance-hub"
      hubLabel="Maintenance"
      title={entry.label}
      subtitle={`HillMaster-style maintenance screen for “${entry.label}”. A dedicated editor can be wired here where this application does not already have a matching route.`}
    >
      <Card className="border-dashed bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">Implementation status</CardTitle>
          <CardDescription>
            This maintenance menu entry is now reachable from the sidebar. Use{' '}
            <Link to="/global-parameters" className="text-primary font-medium hover:underline">
              Global Parameters
            </Link>{' '}
            and{' '}
            <Link to="/system-settings" className="text-primary font-medium hover:underline">
              System Settings
            </Link>{' '}
            for currently wired configuration data.
          </CardDescription>
        </CardHeader>
      </Card>
    </SetupScreenFrame>
  )
}
