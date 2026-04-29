import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function InventoryCount() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Inventory Count</h1>
        <p className="text-sm text-gray-600">
          Record stock counting sessions and review counted quantities before posting adjustments.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Count Session</CardTitle>
          <CardDescription>
            This screen is now available from the main sidebar. Item-level scan/import and posting workflow can be wired next.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-sm">
            <span className="text-gray-600">Session Name</span>
            <input className="w-full mt-1 border rounded px-3 py-2" placeholder="April 2026 Cycle Count" />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Count Date</span>
            <input type="date" className="w-full mt-1 border rounded px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Warehouse / Store</span>
            <input className="w-full mt-1 border rounded px-3 py-2" placeholder="Main Store" />
          </label>
          <div className="md:col-span-3 flex gap-2">
            <Button type="button">Start Count</Button>
            <Button type="button" variant="outline">Review Draft Sessions</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
