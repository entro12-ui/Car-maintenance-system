import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

const emptyForm = () => ({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
})

export default function CustomerModal({ customer, onClose, onSave }) {
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => {
    if (customer) {
      setFormData({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
      })
    } else {
      setFormData(emptyForm())
    }
  }, [customer])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const isEdit = Boolean(customer)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          'flex max-h-[min(90vh,720px)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg',
          '[&>button]:text-muted-foreground [&>button]:hover:bg-muted'
        )}
      >
        <DialogHeader className="shrink-0 space-y-2 border-b border-border/60 bg-muted/[0.35] px-6 pb-4 pt-7 pr-14">
          <DialogTitle className="flex items-center gap-2 text-left font-display text-xl tracking-tight">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <UserPlus className="h-5 w-5" aria-hidden />
            </span>
            {isEdit ? 'Edit customer' : 'Add customer'}
          </DialogTitle>
          <DialogDescription className="text-left">
            {isEdit ? 'Update profile details for this account.' : 'Create a quick profile — use Customer maintenance for GL and extended fields.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="modal-first-name">
                  First name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="modal-first-name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modal-last-name">
                  Last name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="modal-last-name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="modal-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-phone">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="modal-phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-address">Address</Label>
              <Textarea
                id="modal-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-city">City</Label>
              <Input
                id="modal-city"
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-border/60 bg-muted/25 px-6 py-4 sm:gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? 'Save changes' : 'Create customer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
