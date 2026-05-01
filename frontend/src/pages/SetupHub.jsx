import { Link } from 'react-router-dom'
import { SETUP_MENU } from './SetupSidebarMenu'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/PageChrome'

const BLURBS = {
  '/global-parameters':
    'Central catalogue of codes and labels (makes, models, job types, bays, and more) that feed lists everywhere.',
  '/setup/working-hours': 'Standard open and close times by weekday for scheduling and capacity.',
  '/setup/working-calendar': 'Holidays, shutdowns, and exceptions layered on top of base hours.',
  '/setup/work-groups': 'Teams or bays for dispatch roll-ups and shop-floor grouping.',
  '/technicians': 'Mechanic master records: rates, supervisors, payroll flags, active status.',
  '/job-type-allowed-by-user': 'Per-user matrix of which job types they may use on orders.',
}

export default function SetupHub() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Configuration"
        title="Setup"
        description="HillMaster-style maintenance setup. Open any card for a structured screen with a review checklist and related links. Placeholder routes show a sample layout until backend rules are wired."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {SETUP_MENU.map((item) => (
          <Link key={item.path} to={item.path} className="group block h-full">
            <Card className="h-full transition-all border-border/80 shadow-sm hover:border-primary/40 hover:shadow-md hover:bg-gradient-to-br hover:from-primary/[0.03] hover:to-transparent">
              <CardHeader className="space-y-2">
                <CardTitle className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                  {item.label}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed min-h-[3.5rem]">
                  {BLURBS[item.path] || 'Configuration screen.'}
                </CardDescription>
                <span className="text-xs font-medium text-primary pt-1 group-hover:underline">Open screen →</span>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
