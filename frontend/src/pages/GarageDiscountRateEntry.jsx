import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { garageInvoicesApi } from '../services/api'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

export default function GarageDiscountRateEntry() {
  const queryClient = useQueryClient()

  const [scope, setScope] = useState('JobOrder')
  const [jobOrderId, setJobOrderId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [discountRate, setDiscountRate] = useState('')
  const [authorityName, setAuthorityName] = useState('')
  const [remark, setRemark] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')

  const idOk = scope === 'JobOrder' ? !!jobOrderId : !!customerId

  const { data: listData } = useQuery({
    queryKey: ['discountRates', { scope, jobOrderId, customerId }],
    queryFn: () => {
      const params = { scope }
      if (scope === 'JobOrder') params.job_order_id = Number(jobOrderId)
      else params.customer_id = Number(customerId)
      return garageInvoicesApi.listDiscountRates(params)
    },
    enabled: idOk,
  })

  const entries = useMemo(() => listData?.data || [], [listData])

  const createMutation = useMutation({
    mutationFn: (payload) => garageInvoicesApi.createDiscountRate(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['discountRates'] })
      setDiscountRate('')
      setAuthorityName('')
      setRemark('')
    },
  })

  const save = () => {
    const rate = Number(discountRate)
    if (!Number.isFinite(rate)) return

    const payload = {
      scope,
      discount_rate: rate,
      authority_name: authorityName || null,
      remark: remark || null,
      valid_from: validFrom || null,
      valid_to: validTo || null,
    }

    if (scope === 'JobOrder') payload.job_order_id = Number(jobOrderId)
    else payload.customer_id = Number(customerId)

    createMutation.mutate(payload)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Discount Rate Entry</h1>
        <p className="text-muted-foreground">Register discount rate for a job order or customer.</p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground/90">Scope</label>
            <select
              className="mt-1 w-full border rounded-md px-3 py-2"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value)
                setJobOrderId('')
                setCustomerId('')
              }}
            >
              <option value="JobOrder">Job Order</option>
              <option value="Customer">Customer</option>
            </select>
          </div>

          {scope === 'JobOrder' ? (
            <div>
              <label className="text-sm font-medium text-foreground/90">Job Order ID</label>
              <Input className="mt-1" value={jobOrderId} onChange={(e) => setJobOrderId(e.target.value)} placeholder="e.g. 123" />
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-foreground/90">Customer ID</label>
              <Input className="mt-1" value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="e.g. 45" />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground/90">Discount Rate (%)</label>
            <Input className="mt-1" value={discountRate} onChange={(e) => setDiscountRate(e.target.value)} placeholder="e.g. 10" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground/90">Authority (optional)</label>
            <Input className="mt-1" value={authorityName} onChange={(e) => setAuthorityName(e.target.value)} placeholder="Authority name" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground/90">Valid From (optional)</label>
            <Input className="mt-1" type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground/90">Valid To (optional)</label>
            <Input className="mt-1" type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-foreground/90">Remark (optional)</label>
            <Input className="mt-1" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Remark" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" onClick={save} disabled={createMutation.isPending || !idOk}>
            {createMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
          {createMutation.error && (
            <div className="text-sm text-red-600">
              {createMutation.error?.response?.data?.detail || 'Failed to save'}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold text-foreground mb-3">Recent Entries</div>
        {!idOk ? (
          <div className="text-sm text-muted-foreground">Enter an ID to view entries.</div>
        ) : entries.length === 0 ? (
          <div className="text-sm text-muted-foreground">No entries.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Rate</th>
                  <th className="text-left py-2 px-2">Authority</th>
                  <th className="text-left py-2 px-2">Valid</th>
                  <th className="text-left py-2 px-2">Remark</th>
                  <th className="text-left py-2 px-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.discount_entry_id} className="border-b last:border-0">
                    <td className="py-2 px-2">{Number(e.discount_rate).toFixed(2)}%</td>
                    <td className="py-2 px-2">{e.authority_name || '-'}</td>
                    <td className="py-2 px-2">
                      {(e.valid_from || '-') + ' → ' + (e.valid_to || '-')}
                    </td>
                    <td className="py-2 px-2">{e.remark || '-'}</td>
                    <td className="py-2 px-2">{e.created_at ? new Date(e.created_at).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
