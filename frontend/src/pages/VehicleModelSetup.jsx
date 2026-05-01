import { useEffect, useMemo, useState } from 'react'
import { Plus, Printer, Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { systemSettingsApi } from '../services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/PageChrome'
import { SortableTableHead, TableSearchBar } from '@/components/ui/sortable-table'
import { useClientTableSortFilter } from '@/lib/tableSortFilter'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'vehicle_model_group', label: 'Model Group', showJobType: true },
  { id: 'car_model', label: 'Model', showJobType: false, showModelGroupAndJobType: true },
  { id: 'repair_section', label: 'Repair Section', showJobType: false },
  { id: 'maintenance_section', label: 'Maintenance Section', showJobType: false },
]

function initialForm(category) {
  return {
    setting_id: null,
    category,
    code: '',
    description: '',
    job_type: '',
    model_group: '',
    setting_type: 'string',
  }
}

function parseModelMeta(rawDescription) {
  if (!rawDescription) return { model_group: '', job_type: '' }
  try {
    const parsed = JSON.parse(rawDescription)
    return {
      model_group: (parsed?.model_group || '').toString(),
      job_type: (parsed?.job_type || '').toString(),
    }
  } catch {
    return { model_group: '', job_type: '' }
  }
}

export default function VehicleModelSetup() {
  const [tab, setTab] = useState(TABS[0].id)
  const [rows, setRows] = useState([])
  const [jobTypes, setJobTypes] = useState([])
  const [modelGroups, setModelGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(initialForm(TABS[0].id))

  const tabMeta = useMemo(() => TABS.find((t) => t.id === tab) || TABS[0], [tab])

  const tableColCount = useMemo(
    () => 4 + (tabMeta.showJobType ? 1 : 0) + (tabMeta.showModelGroupAndJobType ? 2 : 0),
    [tabMeta]
  )

  const searchFields = useMemo(
    () => [(r) => `${r.setting_key || ''} ${r.setting_value || ''} ${r.description || ''}`],
    []
  )

  const sortAccessors = useMemo(
    () => ({
      code: (r) => r.setting_key || '',
      description: (r) => r.setting_value || '',
      jobCol: (r) => (tabMeta.showJobType ? r.description || '' : ''),
      modelGroup: (r) => (tabMeta.showModelGroupAndJobType ? parseModelMeta(r.description).model_group : ''),
      jobTypeModel: (r) => (tabMeta.showModelGroupAndJobType ? parseModelMeta(r.description).job_type : ''),
    }),
    [tabMeta]
  )

  const { query, setQuery, sort, toggleSort, items: displayRows } = useClientTableSortFilter(
    rows,
    searchFields,
    sortAccessors
  )

  const load = async (category = tab) => {
    setLoading(true)
    setError('')
    try {
      const [r, jt, mg] = await Promise.all([
        systemSettingsApi.list({ category, limit: 500 }),
        systemSettingsApi.list({ category: 'job_type', limit: 500 }),
        systemSettingsApi.list({ category: 'vehicle_model_group', limit: 500 }),
      ])
      setRows(r.data || [])
      setJobTypes(jt.data || [])
      setModelGroups(mg.data || [])
    } catch (e) {
      console.error(e)
      setError('Failed to load vehicle model setup values.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setForm(initialForm(tab))
    load(tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const onEdit = (row) => {
    const modelMeta = tabMeta.showModelGroupAndJobType ? parseModelMeta(row.description) : { model_group: '', job_type: '' }
    setForm({
      setting_id: row.setting_id,
      category: row.category || tab,
      code: row.setting_key || '',
      description: row.setting_value || '',
      job_type: tabMeta.showJobType ? (row.description || '') : modelMeta.job_type,
      model_group: tabMeta.showModelGroupAndJobType ? modelMeta.model_group : '',
      setting_type: row.setting_type || 'string',
    })
    setError('')
    setSuccess('')
  }

  const onDelete = async (settingId) => {
    if (!window.confirm('Delete this record?')) return
    setError('')
    setSuccess('')
    try {
      await systemSettingsApi.remove(settingId)
      await load(tab)
      setSuccess('Record deleted.')
    } catch (e) {
      console.error(e)
      setError('Delete failed.')
    }
  }

  const onSave = async () => {
    if (!form.code.trim()) {
      setError('Code is required.')
      return
    }
    if (!form.description.trim()) {
      setError('Description is required.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const modelMetaJson = tabMeta.showModelGroupAndJobType
        ? JSON.stringify({
            model_group: (form.model_group || '').trim(),
            job_type: (form.job_type || '').trim(),
          })
        : null
      const payload = {
        setting_key: form.code.trim(),
        setting_value: form.description.trim(),
        setting_type: form.setting_type || 'string',
        category: tab,
        description: tabMeta.showJobType ? (form.job_type || null) : (tabMeta.showModelGroupAndJobType ? modelMetaJson : null),
      }
      if (form.setting_id) {
        await systemSettingsApi.update(form.setting_id, payload)
      } else {
        await systemSettingsApi.create(payload)
      }
      await load(tab)
      setForm(initialForm(tab))
      setSuccess('Saved.')
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Maintenance"
        title="Vehicle model setup"
        description="Maintain model groups, vehicle models, repair sections, and maintenance sections used by garage operations."
        actions={
          <>
            <Button type="button" className="gap-2 shadow-md shadow-primary/15" onClick={() => setForm(initialForm(tab))}>
              <Plus className="h-4 w-4" />
              Add record
            </Button>
            <Button type="button" variant="outline" className="gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print preview
            </Button>
            <Button type="button" variant="outline" className="gap-2" onClick={() => load(tab)} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              Refresh
            </Button>
          </>
        }
      />

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}
      {success ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-300/50 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900"
        >
          {success}
        </div>
      ) : null}

      {tab === 'car_model' ? (
        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-transparent to-teal-500/[0.05] p-4 text-sm leading-relaxed shadow-sm sm:p-5">
          <p className="font-medium text-foreground">Model setup</p>
          <p className="mt-2 text-muted-foreground">
            Maintain model codes and descriptions, then map each model to a model group and job type.
          </p>
        </div>
      ) : null}
      {tab === 'repair_section' ? (
        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-transparent to-teal-500/[0.05] p-4 text-sm leading-relaxed shadow-sm sm:p-5">
          <p className="font-medium text-foreground">Repair section</p>
          <p className="mt-2 text-muted-foreground">
            Definitions used during job order processing and related pricing logic.
          </p>
        </div>
      ) : null}

      <Card className="overflow-hidden shadow-none hover:translate-y-0">
        <div className="flex flex-wrap gap-1 border-b border-border/55 bg-muted/35 p-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200',
                tab === t.id
                  ? 'bg-card text-primary shadow-sm ring-1 ring-primary/25'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <CardContent className="space-y-6 p-5 sm:p-6">
          <div className="rounded-xl border border-border/55 bg-muted/20 p-4 sm:p-5">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-primary">
              {form.setting_id ? 'Edit record' : 'New record'}
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="vm-code">Code</Label>
                <Input
                  id="vm-code"
                  value={form.code}
                  disabled={!!form.setting_id}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                  placeholder="e.g. SZ01"
                  className="font-mono text-sm"
                />
              </div>
              <div
                className={cn(
                  'space-y-2 md:col-span-2',
                  !tabMeta.showJobType && !tabMeta.showModelGroupAndJobType && 'xl:col-span-3'
                )}
              >
                <Label htmlFor="vm-desc">Description</Label>
                <Input
                  id="vm-desc"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Suzuki Alto"
                />
              </div>
              {tabMeta.showJobType ? (
                <div className="space-y-2">
                  <Label htmlFor="vm-job-type">Job type</Label>
                  <Select
                    id="vm-job-type"
                    value={form.job_type}
                    onChange={(e) => setForm((p) => ({ ...p, job_type: e.target.value }))}
                  >
                    <option value="">Select job type</option>
                    {jobTypes.map((j) => (
                      <option key={j.setting_id} value={j.setting_value || j.setting_key}>
                        {j.setting_value || j.setting_key}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : null}
              {tabMeta.showModelGroupAndJobType ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="vm-model-group">Model group</Label>
                    <Select
                      id="vm-model-group"
                      value={form.model_group}
                      onChange={(e) => setForm((p) => ({ ...p, model_group: e.target.value }))}
                    >
                      <option value="">Select model group</option>
                      {modelGroups.map((m) => (
                        <option key={m.setting_id} value={m.setting_value || m.setting_key}>
                          {m.setting_value || m.setting_key}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vm-job-type-2">Job type</Label>
                    <Select
                      id="vm-job-type-2"
                      value={form.job_type}
                      onChange={(e) => setForm((p) => ({ ...p, job_type: e.target.value }))}
                    >
                      <option value="">Select job type</option>
                      {jobTypes.map((j) => (
                        <option key={j.setting_id} value={j.setting_value || j.setting_key}>
                          {j.setting_value || j.setting_key}
                        </option>
                      ))}
                    </Select>
                  </div>
                </>
              ) : null}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" onClick={onSave} disabled={saving || loading}>
                {saving ? 'Saving…' : form.setting_id ? 'Update' : 'Save'}
              </Button>
              {form.setting_id ? (
                <Button type="button" variant="outline" onClick={() => setForm(initialForm(tab))}>
                  Clear
                </Button>
              ) : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60">
            <div className="border-b border-border/50 px-3 py-3 sm:px-4">
              <TableSearchBar
                value={query}
                onChange={setQuery}
                placeholder="Filter by code, description, job fields…"
                className="mb-0 max-w-none"
              />
            </div>
            <Table shell="embed">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">No</TableHead>
                  <SortableTableHead columnKey="code" sort={sort} onSort={toggleSort}>
                    {tabMeta.label}
                  </SortableTableHead>
                  <SortableTableHead columnKey="description" sort={sort} onSort={toggleSort}>
                    Description
                  </SortableTableHead>
                  {tabMeta.showJobType ? (
                    <SortableTableHead columnKey="jobCol" sort={sort} onSort={toggleSort}>
                      Job type
                    </SortableTableHead>
                  ) : null}
                  {tabMeta.showModelGroupAndJobType ? (
                    <>
                      <SortableTableHead columnKey="modelGroup" sort={sort} onSort={toggleSort}>
                        Model group
                      </SortableTableHead>
                      <SortableTableHead columnKey="jobTypeModel" sort={sort} onSort={toggleSort}>
                        Job type
                      </SortableTableHead>
                    </>
                  ) : null}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableColCount} className="py-12 text-center text-muted-foreground">
                      {loading ? 'Loading…' : rows.length === 0 ? 'No records yet.' : 'No matching records.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayRows.map((r, idx) => {
                    const modelMeta = tabMeta.showModelGroupAndJobType ? parseModelMeta(r.description) : null
                    return (
                      <TableRow key={r.setting_id}>
                        <TableCell className="tabular-nums text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-sm font-semibold">{r.setting_key}</TableCell>
                        <TableCell>{r.setting_value || '—'}</TableCell>
                        {tabMeta.showJobType ? <TableCell>{r.description || '—'}</TableCell> : null}
                        {tabMeta.showModelGroupAndJobType ? (
                          <>
                            <TableCell>{modelMeta?.model_group || '—'}</TableCell>
                            <TableCell>{modelMeta?.job_type || '—'}</TableCell>
                          </>
                        ) : null}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button type="button" size="sm" variant="ghost" className="gap-1 text-primary" onClick={() => onEdit(r)}>
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="gap-1 text-destructive hover:bg-destructive/10"
                              onClick={() => onDelete(r.setting_id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
