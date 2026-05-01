import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { enterpriseAdminApi } from '../services/api'

const DEFAULT_QUERY_DEFINITION = {
  report_section: 'Labour',
  data_source: 'job_orders',
  fields: [],
}

function toText(v) {
  return v == null ? '' : String(v)
}

export default function EditUserDefinedReport() {
  const queryClient = useQueryClient()
  const [params] = useSearchParams()
  const reportIdRaw = params.get('report_id')
  const reportId = reportIdRaw ? Number(reportIdRaw) : null

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { data, isLoading, error: loadError, refetch } = useQuery({
    queryKey: ['userDefinedReports'],
    queryFn: () => enterpriseAdminApi.listUserDefinedReports({}),
  })

  const rows = data?.data || data?.result || data || []

  const selected = useMemo(() => {
    if (!reportId) return null
    return rows.find((r) => Number(r.report_id) === Number(reportId)) || null
  }, [rows, reportId])

  const [form, setForm] = useState({
    report_code: '',
    report_name: '',
    report_group: 'UserDefined',
    description: '',
    query_definition: JSON.stringify(DEFAULT_QUERY_DEFINITION, null, 2),
    is_active: true,
  })

  useEffect(() => {
    if (!selected) return
    const parsed = (() => {
      try {
        return typeof selected.query_definition === 'string' && selected.query_definition
          ? JSON.parse(selected.query_definition)
          : selected.query_definition
      } catch {
        return null
      }
    })()

    setForm({
      report_code: toText(selected.report_code),
      report_name: toText(selected.report_name),
      report_group: toText(selected.report_group || 'UserDefined'),
      description: toText(selected.description),
      query_definition: parsed ? JSON.stringify(parsed, null, 2) : toText(selected.query_definition),
      is_active: selected.is_active ?? true,
    })
  }, [selected])

  const mutationCreate = useMutation({
    mutationFn: (payload) => enterpriseAdminApi.createUserDefinedReport(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userDefinedReports'] })
      setSuccess('Report definition created.')
      setError('')
    },
    onError: (e) => {
      setError(e?.response?.data?.detail || 'Failed to create report.')
      setSuccess('')
    },
  })

  const mutationUpdate = useMutation({
    mutationFn: (payload) => enterpriseAdminApi.updateUserDefinedReport(reportId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userDefinedReports'] })
      setSuccess('Report definition updated.')
      setError('')
    },
    onError: (e) => {
      setError(e?.response?.data?.detail || 'Failed to update report.')
      setSuccess('')
    },
  })

  const onSave = () => {
    setError('')
    setSuccess('')

    if (!form.report_code.trim()) {
      setError('report_code is required.')
      return
    }
    if (!form.report_name.trim()) {
      setError('report_name is required.')
      return
    }

    let queryDefinitionValue = form.query_definition
    // Backend expects query_definition as string (optional). Keep it valid JSON if possible.
    try {
      const parsed = JSON.parse(form.query_definition)
      queryDefinitionValue = JSON.stringify(parsed)
    } catch {
      // Keep raw string; backend will store it. UI will still show invalid JSON text.
    }

    const payload = {
      report_code: form.report_code.trim(),
      report_name: form.report_name.trim(),
      report_group: form.report_group || 'UserDefined',
      description: form.description || null,
      query_definition: queryDefinitionValue,
      is_active: Boolean(form.is_active),
    }

    if (reportId) mutationUpdate.mutate(payload)
    else mutationCreate.mutate(payload)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{reportId ? `Edit User Defined Report (#${reportId})` : 'Create User Defined Report'}</CardTitle>
          <CardDescription>
            This editor stores report definitions in `user_defined_reports` (report_name, report_code, query_definition).
          </CardDescription>
        </CardHeader>

        <div className="px-6 pb-6 space-y-4">
          {loadError ? <div className="text-sm text-red-600">{loadError?.message || 'Failed to load reports.'}</div> : null}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="block text-sm">
              <span className="text-muted-foreground">Report Id</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={reportId ?? ''} disabled />
            </label>
            <label className="block text-sm">
              <span className="text-muted-foreground">Report Code</span>
              <input className="w-full mt-1 border rounded px-3 py-2" value={form.report_code} onChange={(e) => setForm((p) => ({ ...p, report_code: e.target.value }))} />
            </label>
            <label className="block text-sm">
              <span className="text-muted-foreground">Report Group</span>
              <input className="w-full mt-1 border rounded px-3 py-2" value={form.report_group} onChange={(e) => setForm((p) => ({ ...p, report_group: e.target.value }))} />
            </label>
          </div>

          <label className="block text-sm">
            <span className="text-muted-foreground">Report Name</span>
            <input className="w-full mt-1 border rounded px-3 py-2" value={form.report_name} onChange={(e) => setForm((p) => ({ ...p, report_name: e.target.value }))} />
          </label>

          <label className="block text-sm">
            <span className="text-muted-foreground">Description</span>
            <textarea className="w-full mt-1 border rounded px-3 py-2 min-h-[70px]" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </label>

          <label className="block text-sm">
            <span className="text-muted-foreground">query_definition (JSON)</span>
            <textarea
              className="w-full mt-1 border rounded px-3 py-2 min-h-[180px] font-mono text-xs"
              value={form.query_definition}
              onChange={(e) => setForm((p) => ({ ...p, query_definition: e.target.value }))}
            />
          </label>

          <div className="flex items-center gap-2">
            <input type="checkbox" checked={Boolean(form.is_active)} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
            <span className="text-sm text-foreground/90">Active</span>
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          {success ? <div className="text-sm text-green-600">{success}</div> : null}

          <div className="flex gap-2">
            <Button type="button" onClick={onSave} disabled={isLoading || mutationCreate.isPending || mutationUpdate.isPending}>
              {mutationCreate.isPending || mutationUpdate.isPending ? 'Saving...' : 'Save Report'}
            </Button>
            <Button type="button" variant="outline" onClick={() => refetch()} disabled={mutationCreate.isPending || mutationUpdate.isPending}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-dashed bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick JSON preview</CardTitle>
          <CardDescription>Helps catch invalid JSON before saving.</CardDescription>
        </CardHeader>
        <div className="px-6 pb-6">
          <pre className="text-xs whitespace-pre-wrap bg-white border rounded p-3 overflow-x-auto">
            {(() => {
              const parsed = safeParse(form.query_definition)
              return parsed ? JSON.stringify(parsed, null, 2) : 'Invalid JSON'
            })()}
          </pre>
        </div>
      </Card>
    </div>
  )
}

function safeParse(s) {
  try {
    return s ? JSON.parse(s) : null
  } catch {
    return null
  }
}

