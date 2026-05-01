import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function GarageReportRun() {
  const { reportId } = useParams()
  const reportIdNum = useMemo(() => Number(reportId), [reportId])

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [status, setStatus] = useState('')

  const onGenerate = () => {
    // Standard garage report engine is not wired in backend yet.
    // This screen provides the "double click generates report" workflow and captures the parameters.
    setStatus(
      `Report generation is not wired yet. (report_id=${Number.isFinite(reportIdNum) ? reportIdNum : reportId})` +
        (fromDate || toDate ? ` Params: from=${fromDate || '-'} to=${toDate || '-'}` : '')
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Generate Garage Report</h1>
        <p className="text-sm text-muted-foreground">Run the report by ID (double click from listing table).</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Report</CardTitle>
          <CardDescription>
            <span className="font-mono">report_id = {reportIdNum}</span>
          </CardDescription>
        </CardHeader>

        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="block text-sm">
            <span className="text-muted-foreground">From Date (optional)</span>
            <input type="date" className="w-full mt-1 border rounded px-3 py-2" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">To Date (optional)</span>
            <input type="date" className="w-full mt-1 border rounded px-3 py-2" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
          <div className="md:pt-6 flex items-end gap-2">
            <Button type="button" onClick={onGenerate}>Generate</Button>
          </div>
        </div>

        {status && (
          <div className="px-6 pb-6">
            <div className="text-sm text-foreground/90 whitespace-pre-wrap">{status}</div>
          </div>
        )}
      </Card>
    </div>
  )
}

