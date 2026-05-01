import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { partsApi } from '../services/api'
import { AlertCircle, Package } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const INITIAL_FORM = {
  part_code: '',
  part_name: '',
  description: '',
  category: '',
  unit_price: '',
  cost_price: '',
  stock_quantity: 0,
  min_stock_level: 5,
  supplier_id: '',
  compatible_models: '',
}

const CATEGORIES = [
  'Engine',
  'Transmission',
  'Brake',
  'Suspension',
  'Electrical',
  'Body',
  'Interior',
  'Exterior',
  'Filter',
  'Fluid',
  'Other',
]

export default function AddPartModal({ isOpen, onClose }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setFormData(INITIAL_FORM)
      setError('')
    }
  }, [isOpen])

  const createMutation = useMutation({
    mutationFn: (data) => partsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] })
      queryClient.invalidateQueries({ queryKey: ['parts', 'low-stock'] })
      onClose()
      setFormData(INITIAL_FORM)
      setError('')
    },
    onError: (err) => {
      setError(err.response?.data?.detail || 'Failed to create part')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!formData.part_code || !formData.part_name) {
      setError('Part code and name are required')
      return
    }

    if (!formData.unit_price || !formData.cost_price) {
      setError('Unit price and cost price are required')
      return
    }

    const partData = {
      part_code: formData.part_code.trim().toUpperCase(),
      part_name: formData.part_name.trim(),
      description: formData.description || null,
      category: formData.category || null,
      unit_price: parseFloat(formData.unit_price),
      cost_price: parseFloat(formData.cost_price),
      stock_quantity: parseInt(formData.stock_quantity, 10) || 0,
      min_stock_level: parseInt(formData.min_stock_level, 10) || 5,
      supplier_id: formData.supplier_id ? parseInt(formData.supplier_id, 10) : null,
      compatible_models: formData.compatible_models || null,
    }

    createMutation.mutate(partData)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        className={cn(
          'flex max-h-[min(90vh,880px)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl',
          '[&>button]:text-muted-foreground [&>button]:hover:bg-muted'
        )}
      >
        <DialogHeader className="shrink-0 space-y-2 border-b border-border/60 bg-muted/[0.35] px-6 pb-4 pt-7 pr-14">
          <DialogTitle className="flex items-center gap-2 text-left font-display text-xl tracking-tight">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Package className="h-5 w-5" aria-hidden />
            </span>
            Add new part
          </DialogTitle>
          <DialogDescription className="text-left">
            Create a catalog SKU with pricing and stock. Required fields are marked with{' '}
            <span className="text-destructive">*</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {error ? (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="add-part-code">
                  Part code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="add-part-code"
                  type="text"
                  name="part_code"
                  value={formData.part_code}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                  placeholder="e.g. ENG-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-part-name">
                  Part name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="add-part-name"
                  type="text"
                  name="part_name"
                  value={formData.part_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Engine oil filter"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-part-category">Category</Label>
                <Select id="add-part-category" name="category" value={formData.category} onChange={handleChange}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-unit-price">
                  Unit price (ETB) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="add-unit-price"
                  type="number"
                  name="unit_price"
                  value={formData.unit_price}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-cost-price">
                  Cost price (ETB) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="add-cost-price"
                  type="number"
                  name="cost_price"
                  value={formData.cost_price}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-stock-qty">Initial stock quantity</Label>
                <Input
                  id="add-stock-qty"
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-min-stock">Minimum stock level</Label>
                <Input
                  id="add-min-stock"
                  type="number"
                  name="min_stock_level"
                  value={formData.min_stock_level}
                  onChange={handleChange}
                  min="0"
                  placeholder="5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-supplier-id">Supplier ID (optional)</Label>
                <Input
                  id="add-supplier-id"
                  type="number"
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleChange}
                  min="1"
                  placeholder="—"
                />
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="add-description">Description</Label>
              <Textarea
                id="add-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Part description and specifications…"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-compatible">Compatible models</Label>
              <Input
                id="add-compatible"
                type="text"
                name="compatible_models"
                value={formData.compatible_models}
                onChange={handleChange}
                placeholder="e.g. Toyota Corolla 2015–2020"
              />
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-border/60 bg-muted/25 px-6 py-4 sm:gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="min-w-[8.5rem]">
              <Package className="h-4 w-4" />
              {createMutation.isPending ? 'Adding…' : 'Add part'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
