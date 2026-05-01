import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function GarageReportListingBase({ title, subtitle, reports }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    if (!qq) return reports
    return reports.filter((r) => String(r.name || '').toLowerCase().includes(qq) || String(r.reportId).includes(qq))
  }, [q, reports])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Report listing</CardTitle>
          <CardDescription>Search and double click a report name to run by report id.</CardDescription>
        </CardHeader>

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <input
              className="w-full sm:flex-1 border rounded px-3 py-2"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Enter text to search..."
            />
            <Button type="button" variant="outline" onClick={() => setQ('')}>Clear</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3 w-32 text-right">Report Id</th>
                  <th className="py-2 pr-3 w-28" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td className="py-4 text-sm text-muted-foreground" colSpan={3}>No reports found.</td>
                  </tr>
                ) : (
                  filtered.map((r, idx) => (
                    <tr key={`${r.reportId}-${idx}`} className="border-b hover:bg-muted/10">
                      <td className="py-2 pr-3">
                        <div
                          className="font-medium text-indigo-700 cursor-pointer select-none"
                          onDoubleClick={() => navigate(`/garage-reports/run/${r.reportId}`)}
                          title="Double click to generate"
                          role="button"
                          tabIndex={0}
                        >
                          {r.name}
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-right font-mono">{r.reportId}</td>
                      <td className="py-2 pr-3 text-right">
                        <Button type="button" size="sm" variant="outline" onClick={() => navigate(`/garage-reports/run/${r.reportId}`)}>
                          Run
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}

