import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { partsApi } from '../services/api'
import { AlertTriangle, Package, Plus } from 'lucide-react'
import AddPartModal from '../components/AddPartModal'
import { PageHeader } from '@/components/PageChrome'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import { SortableTableHead, TableSearchBar } from '@/components/ui/sortable-table'
import { useClientTableSortFilter } from '@/lib/tableSortFilter'
import { cn } from '@/lib/utils'

export default function Parts() {
  const [showLowStock, setShowLowStock] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const { data: parts, isLoading } = useQuery({
    queryKey: ['parts'],
    queryFn: async () => {
      const response = await partsApi.getAll({ limit: 10000, skip: 0 })
      return response.data
    },
  })

  const { data: lowStockParts } = useQuery({
    queryKey: ['parts', 'low-stock'],
    queryFn: async () => {
      const response = await partsApi.getLowStock()
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading parts catalog…</p>
      </div>
    )
  }

  const lowCount = lowStockParts?.length ?? 0

  const catalogRows = parts || []

  const searchFields = useMemo(
    () => [(p) => `${p.part_code || ''} ${p.part_name || ''} ${p.category || ''} ${p.is_active ? 'active' : 'inactive'}`],
    []
  )

  const sortAccessors = useMemo(
    () => ({
      code: (p) => p.part_code || '',
      name: (p) => p.part_name || '',
      category: (p) => p.category || '',
      stock: (p) => Number(p.stock_quantity) || 0,
      price: (p) => parseFloat(p.unit_price) || 0,
      status: (p) => (p.is_active ? 'Active' : 'Inactive'),
    }),
    []
  )

  const { query, setQuery, sort, toggleSort, items: sortedParts } = useClientTableSortFilter(
    catalogRows,
    searchFields,
    sortAccessors
  )

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Inventory"
        title="Parts inventory"
        description="Browse SKU master data, on-hand quantities, and pricing. Toggle low stock to focus SKUs at or below minimum."
        actions={
          <>
            <Button
              type="button"
              variant={showLowStock ? 'destructive' : 'outline'}
              className="gap-2"
              onClick={() => setShowLowStock(!showLowStock)}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Low stock ({lowCount})
            </Button>
            <Button type="button" className="gap-2 shadow-md shadow-primary/20" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 shrink-0" />
              Add part
            </Button>
          </>
        }
      />

      {showLowStock && lowCount === 0 ? (
        <Card className="border-dashed border-primary/25 bg-primary/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Low stock</CardTitle>
            <CardDescription>Every tracked SKU is currently above its minimum level.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {showLowStock && lowStockParts && lowStockParts.length > 0 ? (
        <Card className="border-destructive/25 bg-gradient-to-br from-destructive/[0.04] to-transparent">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Low stock items
            </CardTitle>
            <CardDescription>{lowStockParts.length} SKUs need attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {lowStockParts.map((part) => (
                <div
                  key={part.part_id}
                  className="rounded-xl border border-destructive/20 bg-card/95 p-4 shadow-sm transition hover:border-destructive/35"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-snug text-foreground">{part.part_name}</p>
                    <Badge variant={part.stock_status === 'OUT OF STOCK' ? 'danger' : 'outline'}>
                      {part.stock_status}
                    </Badge>
                  </div>
                  <p className="mt-2 font-mono text-xs text-muted-foreground">{part.part_code}</p>
                  <div className="mt-3 flex justify-between text-sm">
                    <span className="text-muted-foreground">Stock</span>
                    <span className="font-semibold tabular-nums">
                      {part.stock_quantity} / {part.min_stock_level}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-sm">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-semibold tabular-nums">ETB {Number(part.unit_price).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-1 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Catalog
            </CardTitle>
            <CardDescription className="mt-1">
              {(parts?.length ?? 0).toLocaleString()} parts loaded (up to 10,000 per request).
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-6 pt-4 sm:px-6">
            <TableSearchBar value={query} onChange={setQuery} placeholder="Filter catalog by code, name, category…" />
            <Table shell="embed">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortableTableHead columnKey="code" sort={sort} onSort={toggleSort}>
                    Part code
                  </SortableTableHead>
                  <SortableTableHead columnKey="name" sort={sort} onSort={toggleSort}>
                    Name
                  </SortableTableHead>
                  <SortableTableHead columnKey="category" sort={sort} onSort={toggleSort}>
                    Category
                  </SortableTableHead>
                  <SortableTableHead columnKey="stock" sort={sort} onSort={toggleSort}>
                    Stock
                  </SortableTableHead>
                  <SortableTableHead columnKey="price" sort={sort} onSort={toggleSort}>
                    Unit price
                  </SortableTableHead>
                  <SortableTableHead columnKey="status" sort={sort} onSort={toggleSort}>
                    Status
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedParts.map((part) => (
                  <TableRow key={part.part_id}>
                    <TableCell className="font-mono text-xs">{part.part_code}</TableCell>
                    <TableCell className="font-medium">{part.part_name}</TableCell>
                    <TableCell className="text-muted-foreground">{part.category || '—'}</TableCell>
                    <TableCell className="tabular-nums">
                      <span
                        className={cn(
                          part.stock_quantity <= part.min_stock_level && 'font-semibold text-destructive'
                        )}
                      >
                        {part.stock_quantity}
                      </span>
                      <span className="text-muted-foreground text-sm"> / {part.min_stock_level}</span>
                    </TableCell>
                    <TableCell className="tabular-nums">ETB {parseFloat(part.unit_price).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={part.is_active ? 'success' : 'secondary'}>
                        {part.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

      <AddPartModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  )
}
