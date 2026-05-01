import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { jobOrdersApi } from '../services/api'
import { PageHeader, PageLoading } from '@/components/PageChrome'
import { Button } from '@/components/ui/button'
import { DataTableShell } from '@/components/ui/table'
import { SortableTh, TableSearchBar } from '@/components/ui/sortable-table'
import { useClientTableSortFilter } from '@/lib/tableSortFilter'

export default function JobOrders() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['jobOrders'],
    queryFn: () => jobOrdersApi.list(),
  })

  const rows = data?.data || []

  const searchFields = useMemo(
    () => [
      (jo) =>
        `${jo.job_order_number ?? ''} ${jo.status ?? ''} ${jo.invoice_type ?? ''} ${jo.vehicle_id ?? ''} ${jo.customer_id ?? ''} ${jo.opened_date ?? ''} ${jo.is_blocked ? 'blocked' : ''}`,
    ],
    []
  )

  const sortAccessors = useMemo(
    () => ({
      jobNo: (jo) => jo.job_order_number || '',
      status: (jo) => jo.status || '',
      invoice: (jo) => jo.invoice_type || '',
      vehicle: (jo) => jo.vehicle_id ?? 0,
      customer: (jo) => jo.customer_id ?? 0,
      opened: (jo) => jo.opened_date || '',
      blocked: (jo) => (jo.is_blocked ? 1 : 0),
    }),
    []
  )

  const { query, setQuery, sort, toggleSort, items } = useClientTableSortFilter(rows, searchFields, sortAccessors)

  if (isLoading) {
    return <PageLoading label="Loading job orders…" />
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-6 text-sm text-destructive">
        Failed to load job orders.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workshop"
        title="Job orders"
        description="Open new work orders and continue jobs already in the shop. Blocked customers or plates must be released before opening jobs."
        actions={
          <Button asChild className="gap-2 shadow-md shadow-primary/15">
            <Link to="/work-order-creation">New work order</Link>
          </Button>
        }
        footer={
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 text-sm leading-relaxed text-amber-950 shadow-sm">
            <p className="font-semibold text-amber-950">Guidance</p>
            <p className="mt-1">
              Use tabs on the work order screen for general info, repair detail, client messaging, job text, charges,
              and audit trail.
            </p>
            <p className="mt-1">
              For any new job, the <strong>General Info</strong> and <strong>Job Text / Charge</strong> sections are
              required.
            </p>
          </div>
        }
      />

      <TableSearchBar value={query} onChange={setQuery} placeholder="Filter by job no., status, invoice, vehicle, customer…" />

      <DataTableShell>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/65 bg-muted/60 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.45)]">
              <SortableTh columnKey="jobNo" sort={sort} onSort={toggleSort}>
                Job No
              </SortableTh>
              <SortableTh columnKey="status" sort={sort} onSort={toggleSort}>
                Status
              </SortableTh>
              <SortableTh columnKey="invoice" sort={sort} onSort={toggleSort}>
                Invoice
              </SortableTh>
              <SortableTh columnKey="vehicle" sort={sort} onSort={toggleSort}>
                Vehicle
              </SortableTh>
              <SortableTh columnKey="customer" sort={sort} onSort={toggleSort}>
                Customer
              </SortableTh>
              <SortableTh columnKey="opened" sort={sort} onSort={toggleSort}>
                Opened
              </SortableTh>
              <SortableTh columnKey="blocked" sort={sort} onSort={toggleSort}>
                Blocked
              </SortableTh>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:nth-child(even)]:bg-muted/[0.22]">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No job orders match your filters.
                </td>
              </tr>
            ) : (
              items.map((jo) => (
                <tr
                  key={jo.job_order_id}
                  className="border-b border-border/55 transition-colors duration-150 hover:bg-primary/[0.055]"
                >
                  <td className="px-4 py-4 font-mono text-sm">{jo.job_order_number}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        jo.status === 'Closed'
                          ? 'bg-muted text-foreground'
                          : jo.status === 'Cancelled'
                          ? 'bg-red-100 text-red-800'
                          : jo.status === 'Delivered'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {jo.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[13px]">{jo.invoice_type || '-'}</td>
                  <td className="px-4 py-4 text-[13px]">#{jo.vehicle_id}</td>
                  <td className="px-4 py-4 text-[13px]">{jo.customer_id ? `#${jo.customer_id}` : '-'}</td>
                  <td className="px-4 py-4 text-[13px]">{jo.opened_date || '-'}</td>
                  <td className="px-4 py-4 text-[13px]">{jo.is_blocked ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-4 text-right text-[13px]">
                    <Link to={`/job-orders/${jo.job_order_id}`} className="font-medium text-primary hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </DataTableShell>
    </div>
  )
}
