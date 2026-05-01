import { Link } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MAINTENANCE_MENU, maintenancePath } from './MaintenanceSidebarMenu'

const GROUP_TITLE = {
  1: 'Parameters',
  2: 'Job order',
  3: 'Customer and vehicle',
  4: 'Charges and sublet setup',
  5: 'Control',
  6: 'Vehicle and job type',
}

const BLURBS = {
  'global-parameters': 'Maintain global lookup values used across the garage module.',
  'name-value-parameter': 'Configure name/value application settings.',
  'job-order': 'Open new job orders and maintain general info, repair details, client info, job text, and audit log.',
  'open-job-from-appointment': 'Open or prepare work from existing appointments.',
  'customer-maintenance': 'Maintain customer master information.',
  'plate-number': 'Maintain vehicle / plate information.',
  'canceled-jobs-registry': 'Review and control cancelled job records.',
  'labour-types': 'Maintain labour categories and rates used on jobs.',
  'other-charge-setup': 'Maintain other charge definitions.',
  'lubricants-and-fuel': 'Maintain fuel and lubricant charge definitions.',
  'miscellaneous-charges': 'Maintain miscellaneous charge definitions.',
  'sublet-work-type': 'Maintain sublet work type catalogues.',
  'consumable-charge-setup': 'Maintain consumable charge setup.',
  'sublet-supplier-maintenance': 'Maintain sublet supplier records.',
  'block-release-job-order': 'Block or release job orders for operational control.',
  'register-sold-vehicle': 'Register sold vehicles for downstream history.',
  'vehicle-model-setup': 'Maintain vehicle model setup and repair sections.',
  'job-type-per-hour-rate': 'Maintain per-hour rates by job type.',
}

export default function MaintenanceHub() {
  const groups = [1, 2, 3, 4, 5, 6]

  return (
    <div className="space-y-8">
      <div className="space-y-2 max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Maintenance</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          HillMaster-style <strong>Maintenance</strong> menu for parameters, job order setup, customers, vehicles,
          charge catalogues, sublet suppliers, and control entries.
        </p>
      </div>

      <div className="space-y-8">
        {groups.map((group) => {
          const items = MAINTENANCE_MENU.filter((item) => item.group === group)
          if (items.length === 0) return null

          return (
            <div key={group}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                {GROUP_TITLE[group]}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item) => (
                  <Link key={item.slug} to={maintenancePath(item)} className="group block h-full">
                    <Card className="h-full transition-all border-border/80 shadow-sm hover:border-primary/40 hover:shadow-md hover:bg-gradient-to-br hover:from-primary/[0.03] hover:to-transparent">
                      <CardHeader className="space-y-2 py-4">
                        <CardTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {item.label}
                        </CardTitle>
                        <CardDescription className="text-xs leading-relaxed">
                          {BLURBS[item.slug] || 'Maintenance setup screen.'}
                        </CardDescription>
                        <span className="text-xs font-medium text-primary pt-0.5 group-hover:underline">Open →</span>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
