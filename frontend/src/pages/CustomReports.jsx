import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { enterpriseAdminApi } from '../services/api'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function safeJsonParse(v) {
  try {
    if (!v) return null
    return typeof v === 'string' ? JSON.parse(v) : v
  } catch {
    return null
  }
}

export default function CustomReports({ mode = 'custom' }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['userDefinedReports'],
    queryFn: () => enterpriseAdminApi.listUserDefinedReports({}),
  })

  const rows = data?.data || data?.result || data || []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      return (
        String(r.report_name || '').toLowerCase().includes(q) ||
        String(r.report_id || '').includes(q) ||
        String(r.report_code || '').toLowerCase().includes(q)
      )
    })
  }, [rows, search])

  const selected = useMemo(() => rows.find((r) => Number(r.report_id) === Number(selectedId)) || null, [rows, selectedId])
  const selectedDef = useMemo(() => safeJsonParse(selected?.query_definition), [selected])
  const selectedFields = useMemo(() => {
    const fields = selectedDef?.fields
    return Array.isArray(fields) ? fields : []
  }, [selectedDef])
  const isUserDefined = mode === 'user-defined'

  const onDoubleClick = (id) => {
    setSelectedId(id)
    setStatus('')
    // The backend “report generation by report_id” is not wired yet.
    setStatus(`Report run not wired yet. (report_id=${id})`)
  }

  const onShowReport = () => {
    if (!selectedId) {
      setStatus('Select (double click) a report first.')
      return
    }
    const from = fromDate || '-'
    const to = toDate || '-'
    setStatus(`Custom report generated (stub). report_id=${selectedId} from=${from} to=${to}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Button type="button" size="sm" variant="outline" onClick={onShowReport} disabled={!selectedId}>
          Show Report
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => refetch()}>
          Refresh
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            if (!selectedId) return
            navigate(`/reports-hub/edit-user-defined-report?report_id=${selectedId}`)
          }}
          disabled={!selectedId}
        >
          User Defined Report
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{isUserDefined ? 'User Defined Reports' : 'Custom Reports'}</CardTitle>
          <CardDescription>
            This page lists any {isUserDefined ? 'user defined' : 'custom'} reports so you can generate as needed.
            You can also define your own reports using available database fields.
          </CardDescription>
        </CardHeader>

        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            <div className="border rounded">
              <div className="p-3 border-b">
                <div className="text-xs text-muted-foreground mb-2">Saved Reports</div>
                <div className="flex gap-2">
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Enter text to search..."
                  />
                  <Button type="button" variant="outline" onClick={() => setSearch('')}>
                    Clear
                  </Button>
                </div>
              </div>
              {isLoading ? (
                <div className="text-sm text-muted-foreground p-3">Loading...</div>
              ) : error ? (
                <div className="text-sm text-red-600 p-3">Failed to load reports.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 px-3 w-16">Id</th>
                        <th className="py-2 px-3">Report Name</th>
                        <th className="py-2 px-3">Report Header</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 px-3 text-sm text-muted-foreground">
                            No reports found.
                          </td>
                        </tr>
                      ) : (
                        filtered.map((r) => (
                          <tr key={r.report_id} className="border-b hover:bg-muted/10">
                            <td className="py-2 px-3 font-mono">{r.report_id}</td>
                            <td className="py-2 px-3">
                              <div
                                className="font-medium text-indigo-700 cursor-pointer select-none"
                                onDoubleClick={() => onDoubleClick(r.report_id)}
                                role="button"
                                tabIndex={0}
                                title="Double click to generate"
                              >
                                {r.report_name || r.report_code || `#${r.report_id}`}
                              </div>
                            </td>
                            <td className="py-2 px-3">{r.report_code || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="border rounded">
              <div className="p-3 border-b text-xs text-muted-foreground">Filed/Column Name</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 px-3">Filed/Column Name</th>
                      <th className="py-2 px-3">Filter From</th>
                      <th className="py-2 px-3">Filter To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFields.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-4 px-3 text-sm text-muted-foreground">
                          No fields defined for selected report.
                        </td>
                      </tr>
                    ) : (
                      selectedFields.map((f, idx) => (
                        <tr key={`${f?.name || f?.field || 'f'}-${idx}`} className="border-b">
                          <td className="py-2 px-3">{f?.name || f?.field || '-'}</td>
                          <td className="py-2 px-3">{f?.filter_from || '-'}</td>
                          <td className="py-2 px-3">{f?.filter_to || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="border-dashed bg-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Run / Generate</CardTitle>
          <CardDescription>Select a report (double click name) then generate.</CardDescription>
        </CardHeader>

        <div className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="block text-sm">
              <span className="text-muted-foreground">From Date (optional)</span>
              <input type="date" className="w-full mt-1 border rounded px-3 py-2" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="text-muted-foreground">To Date (optional)</span>
              <input type="date" className="w-full mt-1 border rounded px-3 py-2" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </label>
                <div className="md:pt-6 flex gap-2 items-end">
              <Button type="button" onClick={onShowReport} disabled={!selectedId}>Show Report</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!selectedId) return
                  navigate(`/reports-hub/edit-user-defined-report?report_id=${selectedId}`)
                }}
                disabled={!selectedId}
              >
                Edit Fields
              </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!selectedId) return
                      navigate(`/reports-hub/edit-user-defined-report?report_id=${selectedId}`)
                    }}
                    disabled={!selectedId}
                  >
                    Save Report
                  </Button>
            </div>
          </div>

          {selected ? (
            <div className="rounded border bg-white p-3 text-sm">
              <div className="font-semibold mb-1">Selected Report</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Name:</span> {selected.report_name}
                </div>
                <div>
                  <span className="text-muted-foreground">Code:</span> <span className="font-mono">{selected.report_code}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">Group:</span> {selected.report_group || '-'}
                </div>
                <div>
                  <span className="text-muted-foreground">Custom Report Section:</span> {selectedDef?.report_section || '-'}
                </div>
                <div>
                  <span className="text-muted-foreground">Data Source:</span> {selectedDef?.data_source || '-'}
                </div>
              </div>
              <div className="mt-3">
                <div className="text-muted-foreground mb-1">Definition (query_definition)</div>
                <pre className="text-xs bg-muted/30 p-2 rounded whitespace-pre-wrap">
                  {JSON.stringify(safeJsonParse(selected.query_definition), null, 2) || String(selected.query_definition || '')}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No report selected.</div>
          )}

          {status ? <div className="text-sm text-foreground/90 whitespace-pre-wrap">{status}</div> : null}
        </div>
      </Card>
    </div>
  )
}

