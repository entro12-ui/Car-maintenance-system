import { Link } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/PageChrome'

/** Matches HillMaster Job Order → Utilities menu; each item opens its utility screen. */
export const UTILITIES_MENU = [
  { slug: 'close-job-order', label: 'Close Job Order' },
  { slug: 'job-order-check-sheet', label: 'Job Order Check Sheet' },
  { slug: 'reopen-job-order', label: 'Reopen Job Order' },
  { slug: 'deliver-job-order', label: 'Deliver Job Order' },
  { slug: 'receive-assembled-job', label: 'Receive Assembled Job' },
  { slug: 'copy-job-waiting', label: 'Copy Job to Waiting' },
  { slug: 'copy-invoiced-job-order', label: 'Copy Invoiced Job Order' },
  { slug: 'split-job-order', label: 'Split Job Order' },
  { slug: 'split-job-order-ai', label: 'Split Job Order - AI' },
  { slug: 'pairing-job-order', label: 'Pairing Job Order' },
  { slug: 'journalize-transaction', label: 'Journalize Transaction' },
  { slug: 'journal-listing', label: 'Journal Listing' },
  { slug: 'post-journals-gl', label: 'Post Journals to GL' },
  { slug: 'signed-estimated-letter', label: 'Signed Estimated Letter Entry' },
  { slug: 'estimation-letters', label: 'Estimation Letters' },
  { slug: 'credit-invoice-waiver', label: 'Credit Invoice Waiver' },
  { slug: 'update-menu-definition', label: 'Update Menu Definition' },
  { slug: 'calculator', label: 'Calculator' },
]

export default function UtilitiesHub() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Job order"
        title="Utilities"
        description="HillMaster-style job order utilities. Each card opens the same screen linked from the sidebar."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {UTILITIES_MENU.map((item) => (
          <Link key={item.slug} to={`/utilities/${item.slug}`} className="group block h-full">
            <Card className="h-full transition-all border-border/80 shadow-sm hover:border-primary/40 hover:shadow-md hover:bg-gradient-to-br hover:from-primary/[0.03] hover:to-transparent">
              <CardHeader className="space-y-2 py-4">
                <CardTitle className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                  {item.label}
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed">Open workflow →</CardDescription>
                <span className="text-xs font-medium text-primary pt-0.5 group-hover:underline">Launch →</span>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
