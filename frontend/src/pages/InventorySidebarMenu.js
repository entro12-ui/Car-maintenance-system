/** Inventory submenu for sidebar dropdown navigation. */
export const INVENTORY_MENU = [
  { path: '/parts', label: 'Parts inventory', group: 'overview' },
  { path: '/transactions/item-issue', label: 'Item Issue', group: 'movement' },
  { path: '/transactions/garage-issue-requisition', label: 'Garage Issue Requisition', group: 'movement' },
  { path: '/transactions/item-reserve', label: 'Item Reserve', group: 'movement' },
  { path: '/transactions/item-issue-from-reserve', label: 'Item Issue from Reserve', group: 'movement' },
  { path: '/transactions/request-for-return', label: 'Request for Return', group: 'movement' },
  { path: '/transactions/approve-request-for-return', label: 'Approve Request For Return', group: 'movement' },
  { path: '/transactions/internal-fuel-and-lubricant-issue', label: 'Internal Fuel and Lubricant Issue', group: 'fuel' },
  { path: '/transactions/fuel-issue-km-editing', label: 'Fuel Issue KM Editing', group: 'fuel' },
]
