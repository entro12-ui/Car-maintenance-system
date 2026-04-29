import { Link } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FILE_MENU, fileMenuPath } from './FileSidebarMenu'

const BLURBS = {
  'company-setup': 'Maintain company, address, numbering, email/SMS footer, and application-level setup.',
  'gl-account-no-setup': 'Map stock, WIP, CGS, sales, discount, VAT, labour, misc, other charge, and sublet accounts.',
  'estimation-letter-setup': 'Configure reusable wording, headers, and footers for estimation letters.',
}

export default function FileHub() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">File</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          HillMaster-style <strong>File</strong> menu for core company setup, GL account number setup, and estimation
          letter setup.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FILE_MENU.map((item) => (
          <Link key={item.slug} to={fileMenuPath(item)} className="group block h-full">
            <Card className="h-full transition-all border-border/80 shadow-sm hover:border-primary/40 hover:shadow-md hover:bg-gradient-to-br hover:from-primary/[0.03] hover:to-transparent">
              <CardHeader className="space-y-2 py-4">
                <CardTitle className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                  {item.label}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {BLURBS[item.slug] || 'File setup screen.'}
                </CardDescription>
                <span className="text-xs font-medium text-primary pt-0.5 group-hover:underline">Open →</span>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
