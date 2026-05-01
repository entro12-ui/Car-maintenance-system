import { Fragment, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { servicesApi } from '../services/api'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp, Wrench, DollarSign, Calendar, MapPin, User, FileText, Star } from 'lucide-react'
import { PageHeader, PageLoading } from '@/components/PageChrome'
import { Card, CardContent } from '@/components/ui/card'
import { DataTableShell } from '@/components/ui/table'
import { SortableTh, TableSearchBar } from '@/components/ui/sortable-table'
import { useClientTableSortFilter } from '@/lib/tableSortFilter'

export default function Services() {
  const [expandedRows, setExpandedRows] = useState(new Set())
  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAll(),
  })

  const searchFields = useMemo(
    () => [
      (s) =>
        `${s.service_id} ${s.service_type || ''} ${s.reference_number || ''} ${s.branch || ''} ${s.payment_status || ''} ${s.vehicle?.license_plate || ''} ${s.vehicle?.make || ''} ${s.vehicle?.model || ''}`,
    ],
    []
  )

  const sortAccessors = useMemo(
    () => ({
      id: (s) => s.service_id,
      type: (s) => s.service_type || '',
      vehicle: (s) =>
        s.vehicle ? `${s.vehicle.license_plate || ''} ${s.vehicle.make || ''} ${s.vehicle.model || ''}` : '',
      date: (s) => new Date(s.service_date).getTime(),
      mileage: (s) => parseFloat(s.mileage_at_service) || 0,
      ref: (s) => s.reference_number || '',
      branch: (s) => s.branch || '',
      total: (s) => parseFloat(s.grand_total) || 0,
      status: (s) => s.payment_status || '',
    }),
    []
  )

  const { query, setQuery, sort, toggleSort, items } = useClientTableSortFilter(
    services?.data || [],
    searchFields,
    sortAccessors
  )

  const toggleRow = (serviceId) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId)
    } else {
      newExpanded.add(serviceId)
    }
    setExpandedRows(newExpanded)
  }

  if (isLoading) {
    return <PageLoading label="Loading services…" />
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="After-sales"
        title="Services"
        description="Browse completed and in-progress workshop services. Expand a row for labour, parts, and checklist detail."
      />

      <Card>
        <CardContent className="p-4 sm:p-6">
        <TableSearchBar value={query} onChange={setQuery} placeholder="Filter services by ID, type, vehicle, reference…" />
        <DataTableShell>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/65 bg-muted/60 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.45)]">
                <th className="w-12 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground" />
                <SortableTh columnKey="id" sort={sort} onSort={toggleSort}>
                  Service ID
                </SortableTh>
                <SortableTh columnKey="type" sort={sort} onSort={toggleSort}>
                  Service Type
                </SortableTh>
                <SortableTh columnKey="vehicle" sort={sort} onSort={toggleSort}>
                  Vehicle
                </SortableTh>
                <SortableTh columnKey="date" sort={sort} onSort={toggleSort}>
                  Date
                </SortableTh>
                <SortableTh columnKey="mileage" sort={sort} onSort={toggleSort}>
                  Mileage
                </SortableTh>
                <SortableTh columnKey="ref" sort={sort} onSort={toggleSort}>
                  Reference
                </SortableTh>
                <SortableTh columnKey="branch" sort={sort} onSort={toggleSort}>
                  Branch
                </SortableTh>
                <SortableTh columnKey="total" sort={sort} onSort={toggleSort}>
                  Total
                </SortableTh>
                <SortableTh columnKey="status" sort={sort} onSort={toggleSort}>
                  Status
                </SortableTh>
              </tr>
            </thead>
            <tbody>
              {items.map((service) => {
                const isExpanded = expandedRows.has(service.service_id)
                return (
                  <Fragment key={service.service_id}>
                    <tr
                      className="cursor-pointer border-b border-border/55 transition-colors duration-150 hover:bg-primary/[0.055]"
                      onClick={() => toggleRow(service.service_id)}
                    >
                      <td className="px-4 py-4">
                        {isExpanded ? (
                          <ChevronUp size={18} className="text-muted-foreground" />
                        ) : (
                          <ChevronDown size={18} className="text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-4 py-4 text-[13px] font-semibold">#{service.service_id}</td>
                      <td className="px-4 py-4 text-[13px]">
                        <div className="flex items-center space-x-2">
                          <Wrench size={16} className="text-muted-foreground/75" />
                          <span>{service.service_type || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[13px]">
                        {service.vehicle ? (
                          <div>
                            <div className="font-medium">
                              {service.vehicle.license_plate || `${service.vehicle.make || ''} ${service.vehicle.model || ''}`.trim()}
                            </div>
                            {service.vehicle.make && service.vehicle.model && (
                              <div className="text-xs text-muted-foreground">
                                {service.vehicle.make} {service.vehicle.model} {service.vehicle.year ? `(${service.vehicle.year})` : ''}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/75">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-[13px]">
                        <div className="flex items-center space-x-2">
                          <Calendar size={14} className="text-muted-foreground/75" />
                          <span>{format(new Date(service.service_date), 'MMM dd, yyyy')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[13px]">{parseFloat(service.mileage_at_service).toLocaleString()} km</td>
                      <td className="px-4 py-4 text-[13px]">
                        {service.reference_number ? (
                          <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {service.reference_number}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/75">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-[13px]">
                        {service.branch ? (
                          <div className="flex items-center space-x-1">
                            <MapPin size={14} className="text-muted-foreground/75" />
                            <span className="text-sm">{service.branch}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/75">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-[13px] font-semibold">
                        <div className="flex items-center space-x-1">
                          <DollarSign size={16} className="text-green-600" />
                          <span>ETB {parseFloat(service.grand_total).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[13px]">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            service.payment_status === 'Paid'
                              ? 'bg-green-100 text-green-800'
                              : service.payment_status === 'Free Service'
                              ? 'bg-purple-100 text-purple-800'
                              : service.payment_status === 'Partial'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {service.payment_status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-muted/35">
                        <td colSpan={10} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Service Details */}
                            <div>
                              <h4 className="font-semibold text-foreground/90 mb-3 flex items-center space-x-2">
                                <Wrench size={16} />
                                <span>Service Details</span>
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Service Type:</span>
                                  <span className="font-medium">{service.service_type || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Service Date:</span>
                                  <span className="font-medium">
                                    {format(new Date(service.service_date), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                                {service.next_service_date && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Next Service:</span>
                                    <span className="font-medium">
                                      {format(new Date(service.next_service_date), 'MMM dd, yyyy')}
                                    </span>
                                  </div>
                                )}
                                {service.next_service_mileage && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Next Mileage:</span>
                                    <span className="font-medium">
                                      {parseFloat(service.next_service_mileage).toLocaleString()} km
                                    </span>
                                  </div>
                                )}
                                {service.oil_type && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Oil Type:</span>
                                    <span className="font-medium">{service.oil_type}</span>
                                  </div>
                                )}
                                {service.service_note && (
                                  <div>
                                    <span className="text-muted-foreground">Note:</span>
                                    <p className="font-medium mt-1">{service.service_note}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Financial Breakdown */}
                            <div>
                              <h4 className="font-semibold text-foreground/90 mb-3 flex items-center space-x-2">
                                <DollarSign size={16} />
                                <span>Financial Breakdown</span>
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Labor Cost:</span>
                                  <span className="font-medium">
                                    ETB {parseFloat(service.total_labor_cost || 0).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Parts Cost:</span>
                                  <span className="font-medium">
                                    ETB {parseFloat(service.total_parts_cost || 0).toLocaleString()}
                                  </span>
                                </div>
                                {service.discount_amount > 0 && (
                                  <div className="flex justify-between text-red-600">
                                    <span>Discount:</span>
                                    <span className="font-medium">
                                      -ETB {parseFloat(service.discount_amount).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Tax (15%):</span>
                                  <span className="font-medium">
                                    ETB {parseFloat(service.tax_amount || 0).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-border">
                                  <span className="font-semibold text-foreground/90">Grand Total:</span>
                                  <span className="font-bold text-lg text-green-600">
                                    ETB {parseFloat(service.grand_total).toLocaleString()}
                                  </span>
                                </div>
                                {service.payment_method && (
                                  <div className="flex justify-between mt-2">
                                    <span className="text-muted-foreground">Payment Method:</span>
                                    <span className="font-medium">{service.payment_method}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Additional Information */}
                            <div>
                              <h4 className="font-semibold text-foreground/90 mb-3 flex items-center space-x-2">
                                <FileText size={16} />
                                <span>Additional Information</span>
                              </h4>
                              <div className="space-y-2 text-sm">
                                {service.serviced_by_name && (
                                  <div className="flex items-center space-x-2">
                                    <User size={14} className="text-muted-foreground/75" />
                                    <div>
                                      <span className="text-muted-foreground">Serviced By:</span>
                                      <span className="font-medium ml-2">{service.serviced_by_name}</span>
                                    </div>
                                  </div>
                                )}
                                {service.branch && (
                                  <div className="flex items-center space-x-2">
                                    <MapPin size={14} className="text-muted-foreground/75" />
                                    <div>
                                      <span className="text-muted-foreground">Branch:</span>
                                      <span className="font-medium ml-2">{service.branch}</span>
                                    </div>
                                  </div>
                                )}
                                {service.reference_number && (
                                  <div>
                                    <span className="text-muted-foreground">Reference:</span>
                                    <span className="font-mono font-medium ml-2 bg-muted px-2 py-1 rounded">
                                      {service.reference_number}
                                    </span>
                                  </div>
                                )}
                                {service.rating && (
                                  <div className="flex items-center space-x-2">
                                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                    <div>
                                      <span className="text-muted-foreground">Rating:</span>
                                      <span className="font-medium ml-2">
                                        {service.rating}/5
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {service.mechanic_notes && (
                                  <div className="mt-3">
                                    <span className="text-muted-foreground block mb-1">Mechanic Notes:</span>
                                    <p className="text-foreground bg-muted p-2 rounded text-xs">
                                      {service.mechanic_notes}
                                    </p>
                                  </div>
                                )}
                                {service.customer_feedback && (
                                  <div className="mt-3">
                                    <span className="text-muted-foreground block mb-1">Customer Feedback:</span>
                                    <p className="text-foreground bg-blue-50 p-2 rounded text-xs">
                                      {service.customer_feedback}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Wrench size={48} className="mx-auto mb-4 text-muted-foreground/75" />
              <p>No services found</p>
            </div>
          )}
        </DataTableShell>
        </CardContent>
      </Card>
    </div>
  )
}
