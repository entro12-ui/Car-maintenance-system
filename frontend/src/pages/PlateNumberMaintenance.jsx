import { useEffect, useMemo, useState } from 'react'
import { Car, Pencil, Plus, Printer, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import SetupScreenFrame from './SetupScreenFrame'
import { systemSettingsApi } from '../services/api'
import { SortableTableHead, TableSearchBar } from '@/components/ui/sortable-table'
import { useClientTableSortFilter } from '@/lib/tableSortFilter'
import { cn } from '@/lib/utils'

const CATEGORY = 'company_vehicle_plate_number'

const EMPTY_FORM = {
  setting_id: null,
  plate_number: '',
  owner_name: '',
  department: '',
  use_diesel_fuel: false,
  account_number: '',
  is_active: true,
  created_by: 'administrator',
  created_on: '',
  created_ws: '',
  modified_by: '',
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function parseRecord(row) {
  let data = {}
  try {
    data = row.setting_value ? JSON.parse(row.setting_value) : {}
  } catch {
    data = {}
  }
  return {
    ...EMPTY_FORM,
    ...data,
    setting_id: row.setting_id,
    plate_number: data.plate_number || row.setting_key || '',
    owner_name: data.owner_name || row.description || '',
    created_on: data.created_on || row.created_at || row.created_on || '',
  }
}

export default function PlateNumberMaintenance() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await systemSettingsApi.list({ category: CATEGORY, limit: 1000 })
      setRows((res.data || []).map(parseRecord))
    } catch (err) {
      console.error(err)
      setError('Failed to load plate number setup.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const searchFields = useMemo(
    () => [
      (row) =>
        [
          row.plate_number,
          row.owner_name,
          row.department,
          row.account_number,
          row.created_by,
          row.created_ws,
          row.use_diesel_fuel ? 'diesel yes' : 'diesel no',
          row.is_active ? 'active' : 'inactive',
          row.created_on ? String(row.created_on).slice(0, 10) : '',
        ]
          .filter(Boolean)
          .join(' '),
    ],
    []
  )

  const sortAccessors = useMemo(
    () => ({
      plate: (r) => r.plate_number || '',
      owner: (r) => r.owner_name || '',
      department: (r) => r.department || '',
      diesel: (r) => !!r.use_diesel_fuel,
      account: (r) => r.account_number || '',
      active: (r) => !!r.is_active,
      createdBy: (r) => r.created_by || '',
      createdOn: (r) => (r.created_on ? String(r.created_on).slice(0, 10) : ''),
      ws: (r) => r.created_ws || '',
    }),
    []
  )

  const { query, setQuery, sort, toggleSort, items: displayRows } = useClientTableSortFilter(
    rows,
    searchFields,
    sortAccessors
  )

  const isEditMode = Boolean(form.setting_id)

  const startNew = () => {
    setForm({ ...EMPTY_FORM, created_on: today(), created_ws: 'USER-PC' })
    setEditing(true)
    setError('')
    setSuccess('')
  }

  const startEdit = (row) => {
    setForm({
      ...row,
      created_on: row.created_on ? String(row.created_on).slice(0, 10) : today(),
    })
    setEditing(true)
    setError('')
    setSuccess('')
  }

  const closeDialog = () => {
    setEditing(false)
  }

  const save = async (e) => {
    e.preventDefault()
    if (!form.plate_number.trim()) {
      setError('Plate number is required.')
      return
    }

    const payload = {
      plate_number: form.plate_number.trim(),
      owner_name: form.owner_name || null,
      department: form.department || null,
      use_diesel_fuel: !!form.use_diesel_fuel,
      account_number: form.account_number || null,
      is_active: !!form.is_active,
      created_by: form.created_by || 'administrator',
      created_on: form.created_on || today(),
      created_ws: form.created_ws || null,
      modified_by: form.modified_by || null,
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      if (form.setting_id) {
        await systemSettingsApi.update(form.setting_id, {
          setting_value: JSON.stringify(payload),
          setting_type: 'json',
          category: CATEGORY,
          description: payload.owner_name,
        })
      } else {
        await systemSettingsApi.create({
          setting_key: payload.plate_number,
          setting_value: JSON.stringify(payload),
          setting_type: 'json',
          category: CATEGORY,
          description: payload.owner_name,
        })
      }
      closeDialog()
      setForm(EMPTY_FORM)
      setSuccess('Saved.')
      await load()
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.detail || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row) => {
    if (!window.confirm(`Delete plate number ${row.plate_number}?`)) return
    setError('')
    setSuccess('')
    try {
      await systemSettingsApi.remove(row.setting_id)
      setSuccess('Deleted.')
      await load()
    } catch (err) {
      console.error(err)
      setError('Delete failed.')
    }
  }

  return (
    <SetupScreenFrame
      hubTo="/maintenance-hub"
      hubLabel="Maintenance"
      title="Company Vehicles"
      subtitle="Record vehicles owned by the company. Internal vehicles can be treated differently for spare parts, labour costs, and standard invoice printing."
      actions={
        <>
          <Button type="button" className="gap-2 shadow-md shadow-primary/15" onClick={startNew}>
            <Plus className="h-4 w-4" />
            Add record
          </Button>
          <Button type="button" variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print preview
          </Button>
          <Button type="button" variant="outline" className="gap-2" onClick={load} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-transparent to-teal-500/[0.05] p-4 text-sm leading-relaxed text-foreground/90 shadow-sm sm:p-5">
          <p className="font-medium text-foreground">Company-owned vehicles</p>
          <p className="mt-2 text-muted-foreground">
            Use this list for internal fleet plates. Billing and parts/labour rules can differ from external customer
            vehicles.
          </p>
        </div>

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

        <Card className="overflow-hidden shadow-none hover:translate-y-0">
          <CardContent className="p-0 sm:p-1">
            <div className="px-3 pt-3 sm:px-4">
              <TableSearchBar
                value={query}
                onChange={setQuery}
                placeholder="Filter by plate, owner, department, account…"
                className="max-w-none"
              />
            </div>
            <Table shell="embed">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">No</TableHead>
                  <SortableTableHead columnKey="plate" sort={sort} onSort={toggleSort}>
                    Plate number
                  </SortableTableHead>
                  <SortableTableHead columnKey="owner" sort={sort} onSort={toggleSort}>
                    Owner
                  </SortableTableHead>
                  <SortableTableHead columnKey="department" sort={sort} onSort={toggleSort}>
                    Department
                  </SortableTableHead>
                  <SortableTableHead columnKey="diesel" sort={sort} onSort={toggleSort} className="text-center">
                    Diesel
                  </SortableTableHead>
                  <SortableTableHead columnKey="account" sort={sort} onSort={toggleSort}>
                    Account / COA
                  </SortableTableHead>
                  <SortableTableHead columnKey="active" sort={sort} onSort={toggleSort} className="text-center">
                    Active
                  </SortableTableHead>
                  <SortableTableHead columnKey="createdBy" sort={sort} onSort={toggleSort}>
                    Created by
                  </SortableTableHead>
                  <SortableTableHead columnKey="createdOn" sort={sort} onSort={toggleSort}>
                    Created on
                  </SortableTableHead>
                  <SortableTableHead columnKey="ws" sort={sort} onSort={toggleSort}>
                    WS
                  </SortableTableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="py-12 text-center text-muted-foreground">
                      {loading
                        ? 'Loading…'
                        : rows.length === 0
                          ? 'No company vehicle plate numbers yet. Add a record to begin.'
                          : 'No matching records.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  displayRows.map((row, idx) => (
                    <TableRow key={row.setting_id}>
                      <TableCell className="tabular-nums text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-semibold">{row.plate_number}</TableCell>
                      <TableCell>{row.owner_name || '—'}</TableCell>
                      <TableCell>{row.department || '—'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={row.use_diesel_fuel ? 'secondary' : 'outline'}>
                          {row.use_diesel_fuel ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.account_number || '—'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={row.is_active ? 'success' : 'secondary'}>
                          {row.is_active ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.created_by || '—'}</TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {row.created_on ? String(row.created_on).slice(0, 10) : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{row.created_ws || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-primary"
                            onClick={() => startEdit(row)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => remove(row)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog
          open={editing}
          onOpenChange={(open) => {
            if (!open) closeDialog()
          }}
        >
          <DialogContent
            className={cn(
              'flex max-h-[min(92vh,760px)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl',
              '[&>button]:text-muted-foreground [&>button]:hover:bg-muted'
            )}
          >
            <DialogHeader className="shrink-0 space-y-2 border-b border-border/60 bg-muted/[0.35] px-6 pb-4 pt-7 pr-14">
              <DialogTitle className="flex items-center gap-2 text-left font-display text-xl tracking-tight">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Car className="h-5 w-5" aria-hidden />
                </span>
                {isEditMode ? 'Edit company vehicle' : 'Add company vehicle'}
              </DialogTitle>
              <DialogDescription className="text-left">
                Plate number cannot be changed after save. Optional COA and diesel flag support internal billing rules.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
                <div className="space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Vehicle</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="plate-no">
                        Plate number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="plate-no"
                        value={form.plate_number}
                        disabled={!!form.setting_id}
                        onChange={(e) => setForm((p) => ({ ...p, plate_number: e.target.value }))}
                        placeholder="e.g. AA-12345"
                        autoComplete="off"
                      />
                      {isEditMode ? (
                        <p className="text-xs text-muted-foreground">Locked while editing this record.</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="owner-name">Owner name</Label>
                      <Input
                        id="owner-name"
                        value={form.owner_name}
                        onChange={(e) => setForm((p) => ({ ...p, owner_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dept">Department</Label>
                      <Input
                        id="dept"
                        value={form.department}
                        onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="account-coa">Account no. / COA</Label>
                      <Input
                        id="account-coa"
                        value={form.account_number}
                        onChange={(e) => setForm((p) => ({ ...p, account_number: e.target.value }))}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/55 bg-muted/25 px-4 py-3 text-sm font-medium shadow-sm transition hover:bg-muted/40">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input text-primary focus:ring-teal-500/35"
                        checked={!!form.use_diesel_fuel}
                        onChange={(e) => setForm((p) => ({ ...p, use_diesel_fuel: e.target.checked }))}
                      />
                      Use diesel fuel
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/55 bg-muted/25 px-4 py-3 text-sm font-medium shadow-sm transition hover:bg-muted/40">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input text-primary focus:ring-teal-500/35"
                        checked={!!form.is_active}
                        onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                      />
                      Active
                    </label>
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-border/50 bg-muted/20 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    System metadata
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="created-by">Created by</Label>
                      <Input
                        id="created-by"
                        value={form.created_by}
                        onChange={(e) => setForm((p) => ({ ...p, created_by: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="created-on">Created on</Label>
                      <Input
                        id="created-on"
                        type="date"
                        value={form.created_on || ''}
                        onChange={(e) => setForm((p) => ({ ...p, created_on: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="created-ws">Created WS</Label>
                      <Input
                        id="created-ws"
                        value={form.created_ws}
                        onChange={(e) => setForm((p) => ({ ...p, created_ws: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="modified-by">Modified by</Label>
                      <Input
                        id="modified-by"
                        value={form.modified_by}
                        onChange={(e) => setForm((p) => ({ ...p, modified_by: e.target.value }))}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="shrink-0 gap-2 border-t border-border/60 bg-muted/25 px-6 py-4 sm:gap-3">
                <Button type="button" variant="outline" onClick={closeDialog} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="min-w-[7rem]">
                  {saving ? 'Saving…' : isEditMode ? 'Update' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </SetupScreenFrame>
  )
}
