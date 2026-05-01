import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { laborPriceListsApi, laborTypesApi, otherChargeTypesApi } from '../services/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import SetupScreenFrame from './SetupScreenFrame'

const TABS = [
  { id: 'rate', label: 'Rate Per Hour' },
  { id: 'charge', label: 'Charge Category' },
  { id: 'price', label: 'Labour Price List' },
]

export default function JobTypeHourlyRateSetup() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('rate')
  const [savingId, setSavingId] = useState(null)
  const [newPlId, setNewPlId] = useState('')
  const [newPlDesc, setNewPlDesc] = useState('')
  const [newPlRate, setNewPlRate] = useState('')

  const laborQuery = useQuery({
    queryKey: ['laborTypes', { active_only: false, screen: 'jobTypeHourly' }],
    queryFn: () => laborTypesApi.list({ active_only: false }),
  })

  const otherChargesQuery = useQuery({
    queryKey: ['otherChargeTypes', { active_only: false, screen: 'jobTypeHourly' }],
    queryFn: () => otherChargeTypesApi.list({ active_only: false }),
  })
  const laborPriceListsQuery = useQuery({
    queryKey: ['laborPriceLists', { active_only: false, screen: 'jobTypeHourly' }],
    queryFn: () => laborPriceListsApi.list({ active_only: false }),
  })

  const laborRows = useMemo(() => laborQuery.data?.data || [], [laborQuery.data])
  const chargeRows = useMemo(() => otherChargesQuery.data?.data || [], [otherChargesQuery.data])
  const priceRows = useMemo(() => laborPriceListsQuery.data?.data || [], [laborPriceListsQuery.data])

  const updateLabor = useMutation({
    mutationFn: ({ id, payload }) => laborTypesApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['laborTypes'] })
    },
  })

  const updateCharge = useMutation({
    mutationFn: ({ id, payload }) => otherChargeTypesApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['otherChargeTypes'] })
    },
  })
  const createPriceList = useMutation({
    mutationFn: (payload) => laborPriceListsApi.create(payload),
    onSuccess: async () => {
      setNewPlId('')
      setNewPlDesc('')
      setNewPlRate('')
      await queryClient.invalidateQueries({ queryKey: ['laborPriceLists'] })
    },
  })
  const updatePriceList = useMutation({
    mutationFn: ({ id, payload }) => laborPriceListsApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['laborPriceLists'] })
    },
  })

  const patchLaborRow = (row, patch) => {
    setSavingId(row.labor_type_id)
    updateLabor.mutate(
      { id: row.labor_type_id, payload: patch },
      {
        onSettled: () => setSavingId(null),
      },
    )
  }

  const patchChargeRow = (row, patch) => {
    setSavingId(row.other_charge_type_id)
    updateCharge.mutate(
      { id: row.other_charge_type_id, payload: patch },
      {
        onSettled: () => setSavingId(null),
      },
    )
  }

  const patchPriceRow = (row, patch) => {
    setSavingId(`pl-${row.labor_price_list_id}`)
    updatePriceList.mutate(
      { id: row.labor_price_list_id, payload: patch },
      {
        onSettled: () => setSavingId(null),
      },
    )
  }

  const onCreatePrice = (e) => {
    e.preventDefault()
    const plId = Number(newPlId)
    const desc = (newPlDesc || '').trim()
    const rate = Number(newPlRate)
    if (!Number.isFinite(plId) || plId <= 0) return
    if (!desc) return
    if (!Number.isFinite(rate) || rate < 0) return
    createPriceList.mutate({
      pl_id: plId,
      description: desc,
      rate_per_hour: rate,
      created_by: 'administrator',
    })
  }

  const status = laborQuery.isLoading ? 'Loading…' : 'Ready'

  return (
    <SetupScreenFrame
      hubTo="/maintenance-hub"
      hubLabel="Maintenance"
      title="Job type per hour rate setup"
      subtitle="Configure default labour rates and related charge references. Additional tabs mirror the HillMaster layout."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-blue-700">{status}</span>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              laborQuery.refetch()
              otherChargesQuery.refetch()
              laborPriceListsQuery.refetch()
            }}
          >
            Refresh
          </Button>
        </div>
      }
    >
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="flex flex-wrap border-b bg-slate-50/80">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${
                tab === t.id ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {tab === 'rate' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Rate Per Hour by Sections Guidance</p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Maintain per-hour rates for job types (ID and Description shown in first columns).</li>
                  <li>Set the default <strong>Rate/Hr</strong> for the selected job type.</li>
                  <li>Set <strong>Consumable</strong> charge code for small materials used in operations.</li>
                  <li>Set <strong>Unit Cost</strong> for labor WIP posting and cost tracking.</li>
                  <li>Set <strong>Department</strong> owning the job type/service unit.</li>
                  <li>
                    <strong>S/Station</strong>, <strong>E/Station</strong>, and <strong>Transfer All</strong> are mainly for
                    assembly-line scenarios.
                  </li>
                  <li>
                    <strong>3rd Party</strong> indicates flat rate can be sourced from manufacturer/third-party supplied
                    references where supported.
                  </li>
                </ul>
              </div>
              <div className="overflow-auto">
                <table className="min-w-[1100px] w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-2">Id</th>
                      <th className="py-2 pr-2">Description</th>
                      <th className="py-2 pr-2">Rate/Hr</th>
                      <th className="py-2 pr-2">Consumable</th>
                      <th className="py-2 pr-2">Unit Cost</th>
                      <th className="py-2 pr-2">Department</th>
                      <th className="py-2 pr-2">S/Station</th>
                      <th className="py-2 pr-2">E/Station</th>
                      <th className="py-2 pr-2">Transfer All</th>
                      <th className="py-2 pr-2">Hold S</th>
                      <th className="py-2 pr-2">In Active</th>
                      <th className="py-2 pr-2">3rd Party</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laborRows.map((row) => (
                      <tr key={row.labor_type_id} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                        <td className="py-2 pr-2 font-mono text-xs">{row.labor_type_id}</td>
                        <td className="py-2 pr-2 font-medium">{row.labor_type_name}</td>
                        <td className="py-2 pr-2 w-28">
                          <Input
                            defaultValue={String(row.hourly_rate ?? '')}
                            onBlur={(e) => {
                              const v = Number(e.target.value)
                              if (!Number.isFinite(v) || v < 0) return
                              if (v === Number(row.hourly_rate)) return
                              patchLaborRow(row, { hourly_rate: v })
                            }}
                          />
                        </td>
                        <td className="py-2 pr-2 w-36">
                          <Input
                            defaultValue={row.consumable_charge_code || ''}
                            onBlur={(e) => {
                              const v = (e.target.value || '').trim()
                              const cur = (row.consumable_charge_code || '').trim()
                              if (v === cur) return
                              patchLaborRow(row, { consumable_charge_code: v || null })
                            }}
                          />
                        </td>
                        <td className="py-2 pr-2 w-28">
                          <Input
                            defaultValue={String(row.unit_cost ?? '')}
                            onBlur={(e) => {
                              const v = Number(e.target.value)
                              if (!Number.isFinite(v) || v < 0) return
                              if (v === Number(row.unit_cost ?? 0)) return
                              patchLaborRow(row, { unit_cost: v })
                            }}
                          />
                        </td>
                        <td className="py-2 pr-2 w-44">
                          <Input
                            defaultValue={row.department || ''}
                            onBlur={(e) => {
                              const v = (e.target.value || '').trim()
                              const cur = (row.department || '').trim()
                              if (v === cur) return
                              patchLaborRow(row, { department: v || null })
                            }}
                          />
                        </td>
                        <td className="py-2 pr-2 w-40">
                          <Input
                            defaultValue={row.start_station || ''}
                            onBlur={(e) => {
                              const v = (e.target.value || '').trim()
                              const cur = (row.start_station || '').trim()
                              if (v === cur) return
                              patchLaborRow(row, { start_station: v || null })
                            }}
                          />
                        </td>
                        <td className="py-2 pr-2 w-40">
                          <Input
                            defaultValue={row.end_station || ''}
                            onBlur={(e) => {
                              const v = (e.target.value || '').trim()
                              const cur = (row.end_station || '').trim()
                              if (v === cur) return
                              patchLaborRow(row, { end_station: v || null })
                            }}
                          />
                        </td>
                        <td className="py-2 pr-2 text-center">
                          <input
                            type="checkbox"
                            checked={!!row.transfer_all_sections}
                            disabled={savingId === row.labor_type_id}
                            onChange={(e) => patchLaborRow(row, { transfer_all_sections: e.target.checked })}
                          />
                        </td>
                        <td className="py-2 pr-2 text-center">
                          <input
                            type="checkbox"
                            checked={!!row.hold_section}
                            disabled={savingId === row.labor_type_id}
                            onChange={(e) => patchLaborRow(row, { hold_section: e.target.checked })}
                          />
                        </td>
                        <td className="py-2 pr-2 text-center">
                          <input
                            type="checkbox"
                            checked={row.is_active === false}
                            disabled={savingId === row.labor_type_id}
                            onChange={(e) => patchLaborRow(row, { is_active: !e.target.checked })}
                          />
                        </td>
                        <td className="py-2 pr-2 text-center">
                          <input
                            type="checkbox"
                            checked={!!row.take_from_third_party}
                            disabled={savingId === row.labor_type_id}
                            onChange={(e) => patchLaborRow(row, { take_from_third_party: e.target.checked })}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'charge' && (
            <div className="space-y-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Charge Category Guidance</p>
                <p className="mt-1">
                  Use this tab to define charge-category level discount and journal behavior for the default charge type
                  categories available in the system.
                </p>
              </div>
              <div className="overflow-auto">
                <table className="min-w-[1000px] w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-2">No</th>
                      <th className="py-2 pr-2">Charge Cat Code</th>
                      <th className="py-2 pr-2">Description</th>
                      <th className="py-2 pr-2">Discount Charge Code</th>
                      <th className="py-2 pr-2">Allow To Journalize</th>
                      <th className="py-2 pr-2">Auto Create Journal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chargeRows.map((row, idx) => (
                      <tr key={row.other_charge_type_id} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                        <td className="py-2 pr-2 font-medium">{idx + 1}</td>
                        <td className="py-2 pr-2 w-44">
                          <Input
                            defaultValue={row.charge_category_code || row.charge_code || ''}
                            onBlur={(e) => {
                              const v = (e.target.value || '').trim()
                              const cur = (row.charge_category_code || row.charge_code || '').trim()
                              if (v === cur) return
                              patchChargeRow(row, { charge_category_code: v || null })
                            }}
                          />
                        </td>
                        <td className="py-2 pr-2 w-52">
                          <Input
                            defaultValue={row.description || ''}
                            onBlur={(e) => {
                              const v = (e.target.value || '').trim()
                              const cur = (row.description || '').trim()
                              if (v === cur) return
                              patchChargeRow(row, { description: v || null })
                            }}
                          />
                        </td>
                        <td className="py-2 pr-2 w-52">
                          <Input
                            defaultValue={row.discount_charge_code || ''}
                            onBlur={(e) => {
                              const v = (e.target.value || '').trim()
                              const cur = (row.discount_charge_code || '').trim()
                              if (v === cur) return
                              patchChargeRow(row, { discount_charge_code: v || null })
                            }}
                          />
                        </td>
                        <td className="py-2 pr-2 text-center">
                          <input
                            type="checkbox"
                            checked={!!row.allow_to_journalize}
                            disabled={savingId === row.other_charge_type_id}
                            onChange={(e) => patchChargeRow(row, { allow_to_journalize: e.target.checked })}
                          />
                        </td>
                        <td className="py-2 pr-2 text-center">
                          <input
                            type="checkbox"
                            checked={!!row.auto_create_journal}
                            disabled={savingId === row.other_charge_type_id}
                            onChange={(e) => patchChargeRow(row, { auto_create_journal: e.target.checked })}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'price' && (
            <div className="space-y-4">
              <form onSubmit={onCreatePrice} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <Input value={newPlId} onChange={(e) => setNewPlId(e.target.value)} placeholder="PL Id" />
                <Input value={newPlDesc} onChange={(e) => setNewPlDesc(e.target.value)} placeholder="Description" />
                <Input value={newPlRate} onChange={(e) => setNewPlRate(e.target.value)} placeholder="Rate/Hour" />
                <Button type="submit" disabled={createPriceList.isPending}>
                  {createPriceList.isPending ? 'Adding...' : 'Add New Record'}
                </Button>
              </form>

              <div className="overflow-auto">
                <table className="min-w-[800px] w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-2">No</th>
                      <th className="py-2 pr-2">PL Id</th>
                      <th className="py-2 pr-2">Description</th>
                      <th className="py-2 pr-2">Rate/Hour</th>
                      <th className="py-2 pr-2">Created By</th>
                      <th className="py-2 pr-2">In Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceRows.map((row, idx) => (
                      <tr key={row.labor_price_list_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 pr-2 font-medium">{idx + 1}</td>
                        <td className="py-2 pr-2 w-28">
                          <Input
                            defaultValue={String(row.pl_id)}
                            onBlur={(e) => {
                              const v = Number(e.target.value)
                              if (!Number.isFinite(v) || v <= 0) return
                              if (v === Number(row.pl_id)) return
                              patchPriceRow(row, { pl_id: v })
                            }}
                          />
                        </td>
                        <td className="py-2 pr-2 w-72">
                          <Input
                            defaultValue={row.description || ''}
                            onBlur={(e) => {
                              const v = (e.target.value || '').trim()
                              const cur = (row.description || '').trim()
                              if (!v || v === cur) return
                              patchPriceRow(row, { description: v })
                            }}
                          />
                        </td>
                        <td className="py-2 pr-2 w-36">
                          <Input
                            defaultValue={String(row.rate_per_hour ?? '')}
                            onBlur={(e) => {
                              const v = Number(e.target.value)
                              if (!Number.isFinite(v) || v < 0) return
                              if (v === Number(row.rate_per_hour)) return
                              patchPriceRow(row, { rate_per_hour: v })
                            }}
                          />
                        </td>
                        <td className="py-2 pr-2">{row.created_by || ''}</td>
                        <td className="py-2 pr-2 text-center">
                          <input
                            type="checkbox"
                            checked={row.is_active === false}
                            disabled={savingId === `pl-${row.labor_price_list_id}`}
                            onChange={(e) => patchPriceRow(row, { is_active: !e.target.checked })}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </SetupScreenFrame>
  )
}
