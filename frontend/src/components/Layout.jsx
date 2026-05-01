import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Car,
  Calendar,
  Wrench,
  Package,
  Gift,
  Menu,
  X,
  LogOut,
  ListChecks,
  DollarSign,
  FileText,
  Boxes,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Settings2,
  CheckSquare,
  PieChart,
  Receipt,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button, buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { UTILITIES_MENU } from '../pages/UtilitiesHub'
import { SETUP_MENU } from '../pages/SetupSidebarMenu'
import { TASK_MENU, taskPath } from '../pages/TaskSidebarMenu'
import { REPORT_MENU, reportsPath } from '../pages/ReportsSidebarMenu'
import { GARAGE_INVOICES_MENU } from '../pages/GarageInvoicesSidebarMenu'
import { TRANSACTION_MENU, transactionPath } from '../pages/TransactionSidebarMenu'
import { ENQUIRY_MENU, enquiryPath } from '../pages/EnquirySidebarMenu'
import { MAINTENANCE_MENU, maintenancePath } from '../pages/MaintenanceSidebarMenu'
import { FILE_MENU, fileMenuPath } from '../pages/FileSidebarMenu'
import { INVENTORY_MENU } from '../pages/InventorySidebarMenu'
import SupportChatWidget from '@/components/SupportChatWidget'

/** Primary nav row (dashboard links + icon-only collapsed hub links) */
function sidebarNavRowClass(showLabel, isActive) {
  return cn(
    'group relative flex items-center rounded-xl border transition-all duration-200 ease-out',
    showLabel ? 'min-h-11 sm:min-h-12 w-full justify-start gap-3 px-3.5 sm:px-4' : 'min-h-11 sm:min-h-12 w-full justify-center px-1',
    'border-transparent shadow-sm shadow-transparent',
    isActive
      ? 'border-primary/25 bg-gradient-to-r from-primary/[0.15] via-primary/[0.09] to-primary/[0.03] font-semibold text-primary shadow-[0_14px_38px_-22px_hsl(var(--primary)/0.45),inset_0_1px_0_0_rgba(255,255,255,0.52)]'
      : 'text-foreground/90 hover:border-primary/15 hover:bg-primary/[0.055] hover:shadow-md hover:shadow-primary/[0.07]'
  )
}

/** Expandable section headers (Inventory, Setup, …) */
function sidebarSectionClass(menuActive, expanded) {
  return cn(
    'flex w-full items-center gap-3 rounded-xl border px-3 sm:px-4 min-h-11 sm:min-h-12 text-left transition-all duration-200 ease-out',
    expanded && 'border-border/55 bg-muted/40 shadow-[inset_0_1px_3px_rgba(15,23,42,0.06)]',
    menuActive && !expanded && 'border-primary/22 bg-primary/[0.07] font-semibold text-primary',
    !(menuActive && !expanded) &&
      !expanded &&
      'border-transparent hover:border-primary/12 hover:bg-primary/[0.045]'
  )
}

/** Nested route list container */
function sidebarSubNavClass(maxHeightClass = 'max-h-[min(70vh,24rem)]') {
  return cn(
    'ml-2 mr-0.5 space-y-0.5 rounded-xl border border-border/50 bg-muted/35 py-2 pl-2 pr-1 shadow-[inset_0_1px_4px_rgba(15,23,42,0.055)]',
    maxHeightClass,
    'overflow-y-auto overflow-x-hidden'
  )
}

function sidebarChildLinkClass(active) {
  return cn(
    'flex w-full items-center rounded-lg py-2 pl-2.5 pr-2 text-xs sm:text-sm transition-colors duration-150',
    active
      ? 'bg-primary/12 font-semibold text-primary ring-1 ring-primary/20 shadow-sm'
      : 'text-foreground/88 hover:bg-background/95 hover:text-foreground'
  )
}

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAdmin, isCustomer, isAccountant } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarExpanded, setDesktopSidebarExpanded] = useState(true) // Start with sidebar expanded
  const [utilitiesOpen, setUtilitiesOpen] = useState(false)
  const [setupOpen, setSetupOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [reportsOpen, setReportsOpen] = useState(false)
  const [garageInvoicesOpen, setGarageInvoicesOpen] = useState(false)
  const [transactionsOpen, setTransactionsOpen] = useState(false)
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [enquiriesOpen, setEnquiriesOpen] = useState(false)
  const [maintenanceOpen, setMaintenanceOpen] = useState(false)
  const [fileOpen, setFileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const adminMenuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/garage-invoices/advanced-booking', icon: Calendar, label: 'Advanced Booking' },
    { path: '/system-settings', icon: ListChecks, label: 'System Settings' },
    { path: '/service-checklists', icon: ListChecks, label: 'Service Checklists' },
    { path: '/loyalty', icon: Gift, label: 'Loyalty' },
    { path: '/enterprise-admin', icon: ListChecks, label: 'Enterprise Admin' },
  ]

  const customerMenuItems = [
    { path: '/customer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/customer/vehicles', icon: Car, label: 'My Vehicles' },
    { path: '/customer/services', icon: Wrench, label: 'My Services' },
    { path: '/customer/appointments', icon: Calendar, label: 'Appointments' },
  ]

  const accountantMenuItems = [
    { path: '/accountant/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/accountant/payments', icon: DollarSign, label: 'Payments' },
  ]

  const menuItems = isAdmin ? adminMenuItems : (isAccountant ? accountantMenuItems : customerMenuItems)
  const showLabel = desktopSidebarExpanded || sidebarOpen
  const utilitiesActive = isAdmin && location.pathname.startsWith('/utilities')
  const fileActive =
    isAdmin &&
    (location.pathname.startsWith('/file-hub') ||
      location.pathname.startsWith('/file/') ||
      FILE_MENU.some((item) => item.path === location.pathname || location.pathname.startsWith(`${item.path}/`)))
  const setupActive =
    isAdmin &&
    (location.pathname.startsWith('/setup') ||
      SETUP_MENU.some((s) => s.path === location.pathname || location.pathname.startsWith(`${s.path}/`)))
  const maintenanceActive =
    isAdmin &&
    (location.pathname.startsWith('/maintenance-hub') ||
      location.pathname.startsWith('/maintenance/') ||
      MAINTENANCE_MENU.some((item) => item.path === location.pathname || location.pathname.startsWith(`${item.path}/`)))
  const taskActive = isAdmin && location.pathname.startsWith('/tasks')
  const reportsMenuActive = isAdmin && location.pathname.startsWith('/reports-hub')
  const transactionsMenuActive =
    isAdmin &&
    (location.pathname.startsWith('/transactions-hub') ||
      location.pathname.startsWith('/transactions/'))
  const inventoryTransactionPaths = new Set(
    INVENTORY_MENU.filter((item) => item.path.startsWith('/transactions/')).map((item) => item.path)
  )
  const transactionsSidebarMenu = TRANSACTION_MENU.filter(
    (item) => !inventoryTransactionPaths.has(transactionPath(item.slug))
  )
  const inventoryMenuActive =
    isAdmin &&
    INVENTORY_MENU.some(
      (item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
    )
  const enquiriesMenuActive =
    isAdmin &&
    (location.pathname.startsWith('/enquiries-hub') ||
      location.pathname.startsWith('/enquiries/'))
  const garageInvoicesMenuActive =
    isAdmin &&
    (location.pathname.startsWith('/garage-invoices-hub') ||
      location.pathname.startsWith('/garage-invoices/'))

  return (
    <div className="app-root-bg min-h-screen">
      {/* Mobile header */}
      <div className="sticky top-0 z-40 border-b border-border/50 bg-card/[0.82] shadow-[0_8px_32px_-20px_rgba(15,23,42,0.14)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <span className="text-white text-sm font-bold">CS</span>
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Car Service
            </h1>
          </div>
          <Button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      <div className="relative flex min-h-screen overflow-x-hidden lg:h-screen">
        {sidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default border-0 bg-slate-950/45 p-0 backdrop-blur-[2px] transition-opacity lg:hidden"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 ${
            sidebarOpen ? 'relative' : 'absolute lg:relative'
          } lg:sticky lg:top-0 lg:h-screen h-screen inset-y-0 left-0 z-50 w-[20rem] sm:w-[21rem] ${
            desktopSidebarExpanded ? 'lg:w-[18rem] xl:w-[19.5rem]' : 'lg:w-[5.75rem]'
          } flex-shrink-0 overflow-hidden border-r border-border/60 bg-gradient-to-b from-card/[0.96] via-card/[0.9] to-muted/[0.35] shadow-[0_20px_56px_-28px_rgba(15,23,42,0.42)] ring-1 ring-white/40 backdrop-blur-2xl transition-[width,transform] duration-300 ease-in-out`}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-[3px] bg-gradient-to-r from-primary/40 via-teal-400/70 to-primary/35"
            aria-hidden
          />
          <div className="relative flex h-full flex-col">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_-10%,_hsl(var(--primary)/0.14),_transparent_42%),radial-gradient(circle_at_100%_105%,_hsl(195_80%_50%/0.09),_transparent_46%)]"
              aria-hidden
            />
            <div className={cn('relative z-[1] p-4 sm:p-5', !desktopSidebarExpanded && 'lg:p-3')}>
              <div
                className={cn(
                  'rounded-2xl border border-border/45 bg-card/55 p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.65),0_10px_28px_-18px_hsl(var(--primary)/0.18)] backdrop-blur-md sm:p-3.5',
                  !desktopSidebarExpanded && 'lg:rounded-xl lg:p-2.5'
                )}
              >
                <div className={cn('flex items-center justify-between gap-2', !desktopSidebarExpanded && 'lg:flex-col lg:gap-3')}>
                  <div className={cn('flex min-w-0 items-center gap-3', !desktopSidebarExpanded && 'lg:flex-col lg:gap-2')}>
                    {!desktopSidebarExpanded ? (
                      <div className="hidden lg:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-teal-700 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-white/30 transition-transform hover:scale-[1.03]">
                        CS
                      </div>
                    ) : (
                      <>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-teal-700 shadow-md shadow-primary/20 ring-2 ring-white/25">
                          <span className="text-sm font-bold text-primary-foreground">CS</span>
                        </div>
                        <div className="min-w-0">
                          <h1 className="font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
                            Car Service
                          </h1>
                          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-primary/90 hidden sm:block">
                            Workshop suite
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="hidden h-9 w-9 shrink-0 rounded-xl border border-border/40 bg-background/50 hover:bg-muted lg:inline-flex"
                    onClick={() => setDesktopSidebarExpanded((v) => !v)}
                    aria-label={desktopSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                  >
                    {desktopSidebarExpanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                  </Button>
                </div>
                {user && desktopSidebarExpanded && (
                  <div className="mt-4 rounded-xl border border-border/40 bg-muted/30 p-3 shadow-inner">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/25 to-primary/10 text-sm font-bold text-primary ring-2 ring-primary/15">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{user.username}</p>
                        <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Separator className="relative z-[1] bg-gradient-to-r from-transparent via-border to-transparent opacity-80" />
            <nav
              className={cn(
                'relative z-10 flex-1 space-y-1.5 overflow-y-auto',
                desktopSidebarExpanded || sidebarOpen ? 'p-2.5 sm:p-3.5' : 'p-2 lg:px-2'
              )}
            >
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(sidebarNavRowClass(showLabel, isActive), 'group')}
                    aria-label={item.label}
                    title={!showLabel ? item.label : undefined}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-primary via-teal-500 to-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.45)]" />
                    )}
                    <Icon 
                      size={showLabel ? 20 : 22} 
                      className={cn(
                        "flex-shrink-0 transition-transform group-hover:scale-110",
                        isActive && "text-primary"
                      )} 
                    />
                    {showLabel && (
                      <span className="truncate text-sm sm:text-base">{item.label}</span>
                    )}
                  </Link>
                )
              })}
              {isAdmin && (
                <div className="pt-1">
                  {!showLabel ? (
                    <Link
                      to="/inventory"
                      onClick={() => setSidebarOpen(false)}
                      className={cn(sidebarNavRowClass(false, inventoryMenuActive), 'group')}
                      aria-label="Inventory"
                      title="Inventory"
                    >
                      {inventoryMenuActive && (
                        <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-primary via-teal-500 to-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.45)]" />
                      )}
                      <Boxes
                        size={22}
                        className={cn(
                          'flex-shrink-0 transition-transform group-hover:scale-110',
                          inventoryMenuActive && 'text-primary'
                        )}
                      />
                    </Link>
                  ) : (
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => setInventoryOpen((v) => !v)}
                        className={sidebarSectionClass(inventoryMenuActive, inventoryOpen)}
                        aria-expanded={inventoryOpen}
                        aria-controls="sidebar-inventory-list"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/45 bg-background/75 text-muted-foreground shadow-sm">
                          {inventoryOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </span>
                        <Boxes size={20} className={cn('flex-shrink-0', inventoryMenuActive && 'text-primary')} />
                        <span
                          className={cn(
                            'truncate text-sm sm:text-base font-medium',
                            inventoryMenuActive && 'text-primary'
                          )}
                        >
                          Inventory
                        </span>
                      </button>
                      {inventoryOpen && (
                        <div
                          id="sidebar-inventory-list"
                          className={sidebarSubNavClass()}
                        >
                          {INVENTORY_MENU.map((item, idx) => {
                            const childActive =
                              location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
                            return (
                              <div key={item.path}>
                                {idx > 0 && INVENTORY_MENU[idx - 1].group !== item.group && (
                                  <div className="my-1.5 border-t border-border/80" aria-hidden />
                                )}
                                <Link
                                  to={item.path}
                                  onClick={() => setSidebarOpen(false)}
                                  className={sidebarChildLinkClass(childActive)}
                                >
                                  <span className="truncate">{item.label}</span>
                                </Link>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {isAdmin && (
                <div className="pt-1">
                  {!showLabel ? (
                    <Link
                      to="/file-hub"
                      onClick={() => setSidebarOpen(false)}
                      className={cn(sidebarNavRowClass(false, fileActive), 'group')}
                      aria-label="File"
                      title="File"
                    >
                      {fileActive && (
                        <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-primary via-teal-500 to-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.45)]" />
                      )}
                      <FileText
                        size={22}
                        className={cn(
                          'flex-shrink-0 transition-transform group-hover:scale-110',
                          fileActive && 'text-primary'
                        )}
                      />
                    </Link>
                  ) : (
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => setFileOpen((v) => !v)}
                        className={sidebarSectionClass(fileActive, fileOpen)}
                        aria-expanded={fileOpen}
                        aria-controls="sidebar-file-list"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/45 bg-background/75 text-muted-foreground shadow-sm">
                          {fileOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </span>
                        <FileText size={20} className={cn('flex-shrink-0', fileActive && 'text-primary')} />
                        <span className={cn('truncate text-sm sm:text-base font-medium', fileActive && 'text-primary')}>
                          File
                        </span>
                      </button>
                      {fileOpen && (
                        <div id="sidebar-file-list" className={sidebarSubNavClass()}>
                          {FILE_MENU.map((item) => {
                            const to = fileMenuPath(item)
                            const childActive =
                              location.pathname === to || (item.path && location.pathname.startsWith(`${item.path}/`))
                            return (
                              <Link
                                key={item.slug}
                                to={to}
                                onClick={() => setSidebarOpen(false)}
                                className={sidebarChildLinkClass(childActive)}
                              >
                                <span className="truncate">{item.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {isAdmin && (
                <div className="pt-1">
                  {!showLabel ? (
                    <Link
                      to="/maintenance-hub"
                      onClick={() => setSidebarOpen(false)}
                      className={cn(sidebarNavRowClass(false, maintenanceActive), 'group')}
                      aria-label="Maintenance"
                      title="Maintenance"
                    >
                      {maintenanceActive && (
                        <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-primary via-teal-500 to-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.45)]" />
                      )}
                      <Wrench
                        size={22}
                        className={cn(
                          'flex-shrink-0 transition-transform group-hover:scale-110',
                          maintenanceActive && 'text-primary'
                        )}
                      />
                    </Link>
                  ) : (
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => setMaintenanceOpen((v) => !v)}
                        className={sidebarSectionClass(maintenanceActive, maintenanceOpen)}
                        aria-expanded={maintenanceOpen}
                        aria-controls="sidebar-maintenance-list"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/45 bg-background/75 text-muted-foreground shadow-sm">
                          {maintenanceOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </span>
                        <Wrench size={20} className={cn('flex-shrink-0', maintenanceActive && 'text-primary')} />
                        <span
                          className={cn('truncate text-sm sm:text-base font-medium', maintenanceActive && 'text-primary')}
                        >
                          Maintenance
                        </span>
                      </button>
                      {maintenanceOpen && (
                        <div
                          id="sidebar-maintenance-list"
                          className={sidebarSubNavClass()}
                        >
                          {MAINTENANCE_MENU.map((item, idx) => {
                            const to = maintenancePath(item)
                            const childActive =
                              location.pathname === to || (item.path && location.pathname.startsWith(`${item.path}/`))
                            return (
                              <div key={item.slug}>
                                {idx > 0 && MAINTENANCE_MENU[idx - 1].group !== item.group && (
                                  <div className="my-1.5 border-t border-border/80" aria-hidden />
                                )}
                                <Link
                                  to={to}
                                  onClick={() => setSidebarOpen(false)}
                                  className={sidebarChildLinkClass(childActive)}
                                >
                                  <span className="truncate">{item.label}</span>
                                </Link>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {isAdmin && (
                <div className="pt-1">
                  {!showLabel ? (
                    <Link
                      to="/setup"
                      onClick={() => setSidebarOpen(false)}
                      className={cn(sidebarNavRowClass(false, setupActive), 'group')}
                      aria-label="Setup"
                      title="Setup"
                    >
                      {setupActive && (
                        <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-primary via-teal-500 to-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.45)]" />
                      )}
                      <Settings2
                        size={22}
                        className={cn(
                          'flex-shrink-0 transition-transform group-hover:scale-110',
                          setupActive && 'text-primary'
                        )}
                      />
                    </Link>
                  ) : (
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => setSetupOpen((v) => !v)}
                        className={sidebarSectionClass(setupActive, setupOpen)}
                        aria-expanded={setupOpen}
                        aria-controls="sidebar-setup-list"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/45 bg-background/75 text-muted-foreground shadow-sm">
                          {setupOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </span>
                        <Settings2 size={20} className={cn('flex-shrink-0', setupActive && 'text-primary')} />
                        <span className={cn('truncate text-sm sm:text-base font-medium', setupActive && 'text-primary')}>
                          Setup
                        </span>
                      </button>
                      {setupOpen && (
                        <div id="sidebar-setup-list" className={sidebarSubNavClass()}>
                          {SETUP_MENU.map((s) => {
                            const childActive = location.pathname === s.path
                            return (
                              <Link
                                key={s.path}
                                to={s.path}
                                onClick={() => setSidebarOpen(false)}
                                className={sidebarChildLinkClass(childActive)}
                              >
                                <span className="truncate">{s.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {isAdmin && (
                <div className="pt-1">
                  {!showLabel ? (
                    <Link
                      to="/tasks"
                      onClick={() => setSidebarOpen(false)}
                      className={cn(sidebarNavRowClass(false, taskActive), 'group')}
                      aria-label="Task"
                      title="Task"
                    >
                      {taskActive && (
                        <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-primary via-teal-500 to-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.45)]" />
                      )}
                      <CheckSquare
                        size={22}
                        className={cn(
                          'flex-shrink-0 transition-transform group-hover:scale-110',
                          taskActive && 'text-primary'
                        )}
                      />
                    </Link>
                  ) : (
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => setTaskOpen((v) => !v)}
                        className={sidebarSectionClass(taskActive, taskOpen)}
                        aria-expanded={taskOpen}
                        aria-controls="sidebar-task-list"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/45 bg-background/75 text-muted-foreground shadow-sm">
                          {taskOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </span>
                        <CheckSquare size={20} className={cn('flex-shrink-0', taskActive && 'text-primary')} />
                        <span className={cn('truncate text-sm sm:text-base font-medium', taskActive && 'text-primary')}>
                          Task
                        </span>
                      </button>
                      {taskOpen && (
                        <div
                          id="sidebar-task-list"
                          className={sidebarSubNavClass('max-h-[min(70vh,22rem)]')}
                        >
                          {TASK_MENU.map((t) => {
                            const to = taskPath(t.slug)
                            const childActive = location.pathname === to
                            return (
                              <Link
                                key={t.slug}
                                to={to}
                                onClick={() => setSidebarOpen(false)}
                                className={sidebarChildLinkClass(childActive)}
                              >
                                <span className="truncate">{t.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {isAdmin && (
                <div className="pt-1">
                  {!showLabel ? (
                    <Link
                      to="/enquiries-hub"
                      onClick={() => setSidebarOpen(false)}
                      className={cn(sidebarNavRowClass(false, enquiriesMenuActive), 'group')}
                      aria-label="Enquiry"
                      title="Enquiry"
                    >
                      {enquiriesMenuActive && (
                        <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-primary via-teal-500 to-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.45)]" />
                      )}
                      <Search
                        size={22}
                        className={cn(
                          'flex-shrink-0 transition-transform group-hover:scale-110',
                          enquiriesMenuActive && 'text-primary'
                        )}
                      />
                    </Link>
                  ) : (
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => setEnquiriesOpen((v) => !v)}
                        className={sidebarSectionClass(enquiriesMenuActive, enquiriesOpen)}
                        aria-expanded={enquiriesOpen}
                        aria-controls="sidebar-enquiries-list"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/45 bg-background/75 text-muted-foreground shadow-sm">
                          {enquiriesOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </span>
                        <Search size={20} className={cn('flex-shrink-0', enquiriesMenuActive && 'text-primary')} />
                        <span
                          className={cn(
                            'truncate text-sm sm:text-base font-medium',
                            enquiriesMenuActive && 'text-primary'
                          )}
                        >
                          Enquiry
                        </span>
                      </button>
                      {enquiriesOpen && (
                        <div
                          id="sidebar-enquiries-list"
                          className={sidebarSubNavClass()}
                        >
                          {ENQUIRY_MENU.map((item, idx) => {
                            const to = enquiryPath(item.slug)
                            return (
                              <div key={item.slug}>
                                {idx > 0 && ENQUIRY_MENU[idx - 1].group !== item.group && (
                                  <div className="my-1.5 border-t border-border/80" aria-hidden />
                                )}
                                <Link
                                  to={to}
                                  onClick={() => setSidebarOpen(false)}
                                  className={sidebarChildLinkClass(location.pathname === to)}
                                >
                                  <span className="truncate">{item.label}</span>
                                </Link>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {isAdmin && (
                <div className="pt-1">
                  {!showLabel ? (
                    <Link
                      to="/transactions-hub"
                      onClick={() => setSidebarOpen(false)}
                      className={cn(sidebarNavRowClass(false, transactionsMenuActive), 'group')}
                      aria-label="Transaction"
                      title="Transaction"
                    >
                      {transactionsMenuActive && (
                        <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-primary via-teal-500 to-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.45)]" />
                      )}
                      <Package
                        size={22}
                        className={cn(
                          'flex-shrink-0 transition-transform group-hover:scale-110',
                          transactionsMenuActive && 'text-primary'
                        )}
                      />
                    </Link>
                  ) : (
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => setTransactionsOpen((v) => !v)}
                        className={sidebarSectionClass(transactionsMenuActive, transactionsOpen)}
                        aria-expanded={transactionsOpen}
                        aria-controls="sidebar-transactions-list"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/45 bg-background/75 text-muted-foreground shadow-sm">
                          {transactionsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </span>
                        <Package size={20} className={cn('flex-shrink-0', transactionsMenuActive && 'text-primary')} />
                        <span
                          className={cn(
                            'truncate text-sm sm:text-base font-medium',
                            transactionsMenuActive && 'text-primary'
                          )}
                        >
                          Transaction
                        </span>
                      </button>
                      {transactionsOpen && (
                        <div
                          id="sidebar-transactions-list"
                          className={sidebarSubNavClass()}
                        >
                          {transactionsSidebarMenu.map((item, idx) => {
                            const to = transactionPath(item.slug)
                            return (
                              <div key={item.slug}>
                                {idx > 0 && transactionsSidebarMenu[idx - 1].group !== item.group && (
                                  <div className="my-1.5 border-t border-border/80" aria-hidden />
                                )}
                                <Link
                                  to={to}
                                  onClick={() => setSidebarOpen(false)}
                                  className={sidebarChildLinkClass(location.pathname === to)}
                                >
                                  <span className="truncate">{item.label}</span>
                                </Link>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {isAdmin && (
                <div className="pt-1">
                  {!showLabel ? (
                    <Link
                      to="/garage-invoices-hub"
                      onClick={() => setSidebarOpen(false)}
                      className={cn(sidebarNavRowClass(false, garageInvoicesMenuActive), 'group')}
                      aria-label="Garage Invoices"
                      title="Garage Invoices"
                    >
                      {garageInvoicesMenuActive && (
                        <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-primary via-teal-500 to-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.45)]" />
                      )}
                      <Receipt
                        size={22}
                        className={cn(
                          'flex-shrink-0 transition-transform group-hover:scale-110',
                          garageInvoicesMenuActive && 'text-primary'
                        )}
                      />
                    </Link>
                  ) : (
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => setGarageInvoicesOpen((v) => !v)}
                        className={sidebarSectionClass(garageInvoicesMenuActive, garageInvoicesOpen)}
                        aria-expanded={garageInvoicesOpen}
                        aria-controls="sidebar-garage-invoices-list"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/45 bg-background/75 text-muted-foreground shadow-sm">
                          {garageInvoicesOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </span>
                        <Receipt size={20} className={cn('flex-shrink-0', garageInvoicesMenuActive && 'text-primary')} />
                        <span
                          className={cn(
                            'truncate text-sm sm:text-base font-medium',
                            garageInvoicesMenuActive && 'text-primary'
                          )}
                        >
                          Garage Invoices
                        </span>
                      </button>
                      {garageInvoicesOpen && (
                        <div
                          id="sidebar-garage-invoices-list"
                          className={sidebarSubNavClass()}
                        >
                          {GARAGE_INVOICES_MENU.map((item, idx) => (
                            <div key={item.path}>
                              {idx > 0 && GARAGE_INVOICES_MENU[idx - 1].group !== item.group && (
                                <div className="my-1.5 border-t border-border/80" aria-hidden />
                              )}
                              <Link
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={sidebarChildLinkClass(location.pathname === item.path)}
                              >
                                <span className="truncate">{item.label}</span>
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {isAdmin && (
                <div className="pt-1">
                  {!showLabel ? (
                    <Link
                      to="/reports-hub"
                      onClick={() => setSidebarOpen(false)}
                      className={cn(sidebarNavRowClass(false, reportsMenuActive), 'group')}
                      aria-label="Reports menu"
                      title="Reports"
                    >
                      {reportsMenuActive && (
                        <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-primary via-teal-500 to-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.45)]" />
                      )}
                      <PieChart
                        size={22}
                        className={cn(
                          'flex-shrink-0 transition-transform group-hover:scale-110',
                          reportsMenuActive && 'text-primary'
                        )}
                      />
                    </Link>
                  ) : (
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => setReportsOpen((v) => !v)}
                        className={sidebarSectionClass(reportsMenuActive, reportsOpen)}
                        aria-expanded={reportsOpen}
                        aria-controls="sidebar-reports-list"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/45 bg-background/75 text-muted-foreground shadow-sm">
                          {reportsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </span>
                        <PieChart size={20} className={cn('flex-shrink-0', reportsMenuActive && 'text-primary')} />
                        <span
                          className={cn('truncate text-sm sm:text-base font-medium', reportsMenuActive && 'text-primary')}
                        >
                          Reports
                        </span>
                      </button>
                      {reportsOpen && (
                        <div id="sidebar-reports-list" className={sidebarSubNavClass()}>
                          {REPORT_MENU.map((r, idx) => (
                            <div key={r.slug}>
                              {r.group === 'custom' && REPORT_MENU[idx - 1]?.group === 'standard' && (
                                <div className="my-1.5 border-t border-border/80" aria-hidden />
                              )}
                              <Link
                                to={reportsPath(r.slug)}
                                onClick={() => setSidebarOpen(false)}
                                className={sidebarChildLinkClass(location.pathname === reportsPath(r.slug))}
                              >
                                <span className="truncate">{r.label}</span>
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {isAdmin && (
                <div className="pt-1">
                  {!showLabel ? (
                    <Link
                      to="/utilities"
                      onClick={() => setSidebarOpen(false)}
                      className={cn(sidebarNavRowClass(false, utilitiesActive), 'group')}
                      aria-label="Utilities"
                      title="Utilities"
                    >
                      {utilitiesActive && (
                        <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-primary via-teal-500 to-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.45)]" />
                      )}
                      <FolderKanban
                        size={22}
                        className={cn(
                          'flex-shrink-0 transition-transform group-hover:scale-110',
                          utilitiesActive && 'text-primary'
                        )}
                      />
                    </Link>
                  ) : (
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => setUtilitiesOpen((v) => !v)}
                        className={sidebarSectionClass(utilitiesActive, utilitiesOpen)}
                        aria-expanded={utilitiesOpen}
                        aria-controls="sidebar-utilities-list"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/45 bg-background/75 text-muted-foreground shadow-sm">
                          {utilitiesOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </span>
                        <FolderKanban size={20} className={cn('flex-shrink-0', utilitiesActive && 'text-primary')} />
                        <span className={cn('truncate text-sm sm:text-base font-medium', utilitiesActive && 'text-primary')}>
                          Utilities
                        </span>
                      </button>
                      {utilitiesOpen && (
                        <div id="sidebar-utilities-list" className={sidebarSubNavClass()}>
                          {UTILITIES_MENU.map((u) => {
                            const to = `/utilities/${u.slug}`
                            const childActive = location.pathname === to
                            return (
                              <Link
                                key={u.slug}
                                to={to}
                                onClick={() => setSidebarOpen(false)}
                                className={sidebarChildLinkClass(childActive)}
                              >
                                <span className="truncate">{u.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </nav>
            <Separator className="opacity-50" />
            <div className={cn('relative z-10 p-2.5 sm:p-3.5', !desktopSidebarExpanded && !sidebarOpen && 'lg:px-2')}>
              <button
                type="button"
                onClick={handleLogout}
                className={cn(
                  'group flex w-full items-center rounded-xl border border-destructive/20 bg-destructive/[0.03] text-destructive transition-all duration-200 hover:border-destructive/35 hover:bg-destructive/10 hover:shadow-md hover:shadow-destructive/10',
                  (desktopSidebarExpanded || sidebarOpen)
                    ? 'h-11 justify-start gap-3 px-3 sm:h-12 sm:px-4'
                    : 'h-11 justify-center sm:h-12'
                )}
                aria-label="Logout"
                title={!(desktopSidebarExpanded || sidebarOpen) ? 'Logout' : undefined}
              >
                <LogOut 
                  size={(desktopSidebarExpanded || sidebarOpen) ? 20 : 22} 
                  className="flex-shrink-0 transition-transform group-hover:scale-110" 
                />
                {(desktopSidebarExpanded || sidebarOpen) && (
                  <span className="text-sm sm:text-base font-medium">Logout</span>
                )}
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main
          className={`relative flex-1 min-w-0 lg:ml-0 lg:h-screen lg:overflow-y-auto transition-all duration-300 ${
            sidebarOpen ? 'overflow-x-hidden' : ''
          }`}
        >
          <div className="relative mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6 sm:py-8 lg:px-12 lg:py-10 lg:pb-14">
            <div
              data-app-content
              className="relative overflow-hidden rounded-[1.35rem] border border-border/45 bg-card/[0.78] shadow-[0_32px_96px_-36px_rgba(15,23,42,0.26),0_0_0_1px_hsl(var(--primary)/0.06)_inset] ring-1 ring-primary/[0.04] backdrop-blur-[18px] sm:rounded-[1.85rem]"
            >
              <div
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,hsl(var(--card)/0.96)_0%,hsl(var(--primary)/0.055)_38%,transparent_68%),radial-gradient(ellipse_100%_70%_at_100%_-10%,hsl(var(--primary)/0.11),transparent_55%),radial-gradient(ellipse_55%_45%_at_0%_100%,hsl(var(--primary)/0.06),transparent_50%)]"
                aria-hidden
              />
              <div
                key={location.pathname}
                className="relative z-[1] animate-fade-in p-5 sm:p-8 lg:p-10"
              >
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
      <SupportChatWidget />
    </div>
  )
}
