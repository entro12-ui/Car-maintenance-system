import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { jobOrdersApi } from '../services/api'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

export default function GarageCancelVrvEntry() {
  const [jobOrderId, setJobOrderId] = useState('')
  const [reason, setReason] = useState('')

  const mutation = useMutation({
    mutationFn: ({ id, payload }) => jobOrdersApi.vrvCancel(id, payload),
  })

  const submit = () => {
    const id = Number(jobOrderId)
    if (!Number.isFinite(id) || id <= 0) return
    mutation.mutate({ id, payload: { reason: (reason || '').trim() || null } })
  }

  const result = mutation.data?.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cancel VRV Entry</h1>
        <p className="text-muted-foreground">Cancel delivery/VRV entry so VRV can be reprocessed later.</p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground/90">Job Order ID</label>
            <Input className="mt-1" value={jobOrderId} onChange={(e) => setJobOrderId(e.target.value)} placeholder="e.g. 123" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground/90">Reason (optional)</label>
            <Input className="mt-1" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Cancelling...' : 'Cancel VRV Entry'}
          </Button>
          {mutation.error && (
            <div className="text-sm text-red-600">
              {mutation.error?.response?.data?.detail || 'Cancel failed'}
            </div>
          )}
          {mutation.isSuccess && <div className="text-sm text-green-700">Cancelled.</div>}
        </div>

        {result && (
          <div className="text-sm text-foreground/90">
            Updated job: <span className="font-mono">{result.job_order_number}</span>
          </div>
        )}
      </Card>
    </div>
  )
}
