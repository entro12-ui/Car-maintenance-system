import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, Car, Calendar, Wrench, Package, 
  Gift, Menu, X, LogOut, ListChecks, DollarSign, FileText, Boxes,
  ChevronDown, ChevronRight, FolderKanban, Settings2, CheckSquare, PieChart, Receipt, Search
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
    { path: '/inventory-count', icon: Boxes, label: 'Inventory Count' },
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
  const enquiriesMenuActive =
    isAdmin &&
    (location.pathname.startsWith('/enquiries-hub') ||
      location.pathname.startsWith('/enquiries/'))
  const garageInvoicesMenuActive =
    isAdmin &&
    (location.pathname.startsWith('/garage-invoices-hub') ||
      location.pathname.startsWith('/garage-invoices/'))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-background/95 backdrop-blur-sm border-b shadow-sm sticky top-0 z-40">
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

      <div className="flex min-h-screen lg:h-screen overflow-x-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 ${
            sidebarOpen ? 'relative' : 'absolute lg:relative'
          } lg:sticky lg:top-0 lg:h-screen h-screen inset-y-0 left-0 z-50 w-72 sm:w-80 ${
            desktopSidebarExpanded ? 'lg:w-64 xl:w-72' : 'lg:w-20'
          } bg-background/95 backdrop-blur-sm border-r shadow-lg transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0`}
        >
          <div className="h-full flex flex-col">
            <div className={cn('p-4 sm:p-5', !desktopSidebarExpanded && 'lg:p-3')}>
              <div className={cn('flex items-center justify-between gap-2', !desktopSidebarExpanded && 'lg:flex-col lg:gap-3')}>
                <div className={cn('flex items-center gap-3', !desktopSidebarExpanded && 'lg:flex-col lg:gap-2')}>
                  {!desktopSidebarExpanded ? (
                    <div className="hidden lg:flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-base font-bold shadow-lg shadow-primary/20 transition-transform hover:scale-105">
                      CS
                    </div>
                  ) : (
                    <>
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                        <span className="text-white text-sm font-bold">CS</span>
                      </div>
                      <div>
                        <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                          Car Service
                        </h1>
                        <p className="text-xs text-muted-foreground hidden sm:block">
                          Management System
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="hidden lg:inline-flex h-8 w-8 hover:bg-accent/50"
                  onClick={() => setDesktopSidebarExpanded((v) => !v)}
                  aria-label={desktopSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                  <Menu size={18} />
                </Button>
              </div>
              {user && desktopSidebarExpanded && (
                <div className="mt-4 sm:mt-5 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{user.username}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Separator className="opacity-50" />
            <nav
              className={cn(
                'flex-1 space-y-1 overflow-y-auto',
                desktopSidebarExpanded || sidebarOpen ? 'p-2 sm:p-3' : 'p-2 lg:px-2'
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
                    className={cn(
                      'flex items-center transition-all duration-200 rounded-lg group relative',
                      showLabel
                        ? 'w-full justify-start gap-3 h-11 sm:h-12 px-3 sm:px-4 hover:bg-accent/50 hover:shadow-sm'
                        : 'w-full justify-center h-11 sm:h-12 lg:w-full lg:justify-center hover:bg-accent/30',
                      isActive && 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-semibold shadow-sm'
                    )}
                    aria-label={item.label}
                    title={!showLabel ? item.label : undefined}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
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
                      to="/file-hub"
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center transition-all duration-200 rounded-lg group relative w-full justify-center h-11 sm:h-12 lg:w-full lg:justify-center hover:bg-accent/30',
                        fileActive && 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-semibold shadow-sm'
                      )}
                      aria-label="File"
                      title="File"
                    >
                      {fileActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
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
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 sm:px-4 h-11 sm:h-12 text-left transition-all duration-200 hover:bg-accent/50',
                          fileActive && !fileOpen && 'text-primary font-semibold'
                        )}
                        aria-expanded={fileOpen}
                        aria-controls="sidebar-file-list"
                      >
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-muted-foreground">
                          {fileOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </span>
                        <FileText size={20} className={cn('flex-shrink-0', fileActive && 'text-primary')} />
                        <span className={cn('truncate text-sm sm:text-base font-medium', fileActive && 'text-primary')}>
                          File
                        </span>
                      </button>
                      {fileOpen && (
                        <div id="sidebar-file-list" className="border-l-2 border-primary/15 ml-5 pl-2 space-y-0.5">
                          {FILE_MENU.map((item) => {
                            const to = fileMenuPath(item)
                            const childActive =
                              location.pathname === to || (item.path && location.pathname.startsWith(`${item.path}/`))
                            return (
                              <Link
                                key={item.slug}
                                to={to}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                  'flex w-full items-center rounded-md py-2 pl-2 pr-1 text-sm text-foreground/90 hover:bg-accent/40 hover:text-foreground',
                                  childActive && 'bg-primary/10 text-primary font-semibold'
                                )}
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
                      className={cn(
                        'flex items-center transition-all duration-200 rounded-lg group relative w-full justify-center h-11 sm:h-12 lg:w-full lg:justify-center hover:bg-accent/30',
                        maintenanceActive && 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-semibold shadow-sm'
                      )}
                      aria-label="Maintenance"
                      title="Maintenance"
                    >
                      {maintenanceActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
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
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 sm:px-4 h-11 sm:h-12 text-left transition-all duration-200 hover:bg-accent/50',
                          maintenanceActive && !maintenanceOpen && 'text-primary font-semibold'
                        )}
                        aria-expanded={maintenanceOpen}
                        aria-controls="sidebar-maintenance-list"
                      >
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-muted-foreground">
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
                          className="border-l-2 border-primary/15 ml-5 pl-2 space-y-0.5 max-h-[min(70vh,24rem)] overflow-y-auto pr-1"
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
                                  className={cn(
                                    'flex w-full items-center rounded-md py-1.5 pl-2 pr-1 text-xs sm:text-sm text-foreground/90 hover:bg-accent/40 hover:text-foreground',
                                    childActive && 'bg-primary/10 text-primary font-semibold'
                                  )}
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
                      className={cn(
                        'flex items-center transition-all duration-200 rounded-lg group relative w-full justify-center h-11 sm:h-12 lg:w-full lg:justify-center hover:bg-accent/30',
                        setupActive && 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-semibold shadow-sm'
                      )}
                      aria-label="Setup"
                      title="Setup"
                    >
                      {setupActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
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
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 sm:px-4 h-11 sm:h-12 text-left transition-all duration-200 hover:bg-accent/50',
                          setupActive && !setupOpen && 'text-primary font-semibold'
                        )}
                        aria-expanded={setupOpen}
                        aria-controls="sidebar-setup-list"
                      >
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-muted-foreground">
                          {setupOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </span>
                        <Settings2 size={20} className={cn('flex-shrink-0', setupActive && 'text-primary')} />
                        <span className={cn('truncate text-sm sm:text-base font-medium', setupActive && 'text-primary')}>
                          Setup
                        </span>
                      </button>
                      {setupOpen && (
                        <div id="sidebar-setup-list" className="border-l-2 border-primary/15 ml-5 pl-2 space-y-0.5">
                          {SETUP_MENU.map((s) => {
                            const childActive = location.pathname === s.path
                            return (
                              <Link
                                key={s.path}
                                to={s.path}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                  'flex w-full items-center rounded-md py-2 pl-2 pr-1 text-sm text-foreground/90 hover:bg-accent/40 hover:text-foreground',
                                  childActive && 'bg-primary/10 text-primary font-semibold'
                                )}
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
                      className={cn(
                        'flex items-center transition-all duration-200 rounded-lg group relative w-full justify-center h-11 sm:h-12 lg:w-full lg:justify-center hover:bg-accent/30',
                        taskActive && 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-semibold shadow-sm'
                      )}
                      aria-label="Task"
                      title="Task"
                    >
                      {taskActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
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
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 sm:px-4 h-11 sm:h-12 text-left transition-all duration-200 hover:bg-accent/50',
                          taskActive && !taskOpen && 'text-primary font-semibold'
                        )}
                        aria-expanded={taskOpen}
                        aria-controls="sidebar-task-list"
                      >
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-muted-foreground">
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
                          className="border-l-2 border-primary/15 ml-5 pl-2 space-y-0.5 max-h-[min(70vh,22rem)] overflow-y-auto pr-1"
                        >
                          {TASK_MENU.map((t) => {
                            const to = taskPath(t.slug)
                            const childActive = location.pathname === to
                            return (
                              <Link
                                key={t.slug}
                                to={to}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                  'flex w-full items-center rounded-md py-1.5 pl-2 pr-1 text-xs sm:text-sm text-foreground/90 hover:bg-accent/40 hover:text-foreground',
                                  childActive && 'bg-primary/10 text-primary font-semibold'
                                )}
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
                      className={cn(
                        'flex items-center transition-all duration-200 rounded-lg group relative w-full justify-center h-11 sm:h-12 lg:w-full lg:justify-center hover:bg-accent/30',
                        enquiriesMenuActive && 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-semibold shadow-sm'
                      )}
                      aria-label="Enquiry"
                      title="Enquiry"
                    >
                      {enquiriesMenuActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
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
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 sm:px-4 h-11 sm:h-12 text-left transition-all duration-200 hover:bg-accent/50',
                          enquiriesMenuActive && !enquiriesOpen && 'text-primary font-semibold'
                        )}
                        aria-expanded={enquiriesOpen}
                        aria-controls="sidebar-enquiries-list"
                      >
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-muted-foreground">
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
                          className="border-l-2 border-primary/15 ml-5 pl-2 space-y-0.5 max-h-[min(70vh,24rem)] overflow-y-auto pr-1"
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
                                  className={cn(
                                    'flex w-full items-center rounded-md py-1.5 pl-2 pr-1 text-xs sm:text-sm text-foreground/90 hover:bg-accent/40 hover:text-foreground',
                                    location.pathname === to && 'bg-primary/10 text-primary font-semibold'
                                  )}
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
                      className={cn(
                        'flex items-center transition-all duration-200 rounded-lg group relative w-full justify-center h-11 sm:h-12 lg:w-full lg:justify-center hover:bg-accent/30',
                        transactionsMenuActive && 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-semibold shadow-sm'
                      )}
                      aria-label="Transaction"
                      title="Transaction"
                    >
                      {transactionsMenuActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
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
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 sm:px-4 h-11 sm:h-12 text-left transition-all duration-200 hover:bg-accent/50',
                          transactionsMenuActive && !transactionsOpen && 'text-primary font-semibold'
                        )}
                        aria-expanded={transactionsOpen}
                        aria-controls="sidebar-transactions-list"
                      >
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-muted-foreground">
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
                          className="border-l-2 border-primary/15 ml-5 pl-2 space-y-0.5 max-h-[min(70vh,24rem)] overflow-y-auto pr-1"
                        >
                          {TRANSACTION_MENU.map((item, idx) => {
                            const to = transactionPath(item.slug)
                            return (
                              <div key={item.slug}>
                                {idx > 0 && TRANSACTION_MENU[idx - 1].group !== item.group && (
                                  <div className="my-1.5 border-t border-border/80" aria-hidden />
                                )}
                                <Link
                                  to={to}
                                  onClick={() => setSidebarOpen(false)}
                                  className={cn(
                                    'flex w-full items-center rounded-md py-1.5 pl-2 pr-1 text-xs sm:text-sm text-foreground/90 hover:bg-accent/40 hover:text-foreground',
                                    location.pathname === to && 'bg-primary/10 text-primary font-semibold'
                                  )}
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
                      className={cn(
                        'flex items-center transition-all duration-200 rounded-lg group relative w-full justify-center h-11 sm:h-12 lg:w-full lg:justify-center hover:bg-accent/30',
                        garageInvoicesMenuActive && 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-semibold shadow-sm'
                      )}
                      aria-label="Garage Invoices"
                      title="Garage Invoices"
                    >
                      {garageInvoicesMenuActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
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
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 sm:px-4 h-11 sm:h-12 text-left transition-all duration-200 hover:bg-accent/50',
                          garageInvoicesMenuActive && !garageInvoicesOpen && 'text-primary font-semibold'
                        )}
                        aria-expanded={garageInvoicesOpen}
                        aria-controls="sidebar-garage-invoices-list"
                      >
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-muted-foreground">
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
                          className="border-l-2 border-primary/15 ml-5 pl-2 space-y-0.5 max-h-[min(70vh,24rem)] overflow-y-auto pr-1"
                        >
                          {GARAGE_INVOICES_MENU.map((item, idx) => (
                            <div key={item.path}>
                              {idx > 0 && GARAGE_INVOICES_MENU[idx - 1].group !== item.group && (
                                <div className="my-1.5 border-t border-border/80" aria-hidden />
                              )}
                              <Link
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                  'flex w-full items-center rounded-md py-1.5 pl-2 pr-1 text-xs sm:text-sm text-foreground/90 hover:bg-accent/40 hover:text-foreground',
                                  location.pathname === item.path && 'bg-primary/10 text-primary font-semibold'
                                )}
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
                      className={cn(
                        'flex items-center transition-all duration-200 rounded-lg group relative w-full justify-center h-11 sm:h-12 lg:w-full lg:justify-center hover:bg-accent/30',
                        reportsMenuActive && 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-semibold shadow-sm'
                      )}
                      aria-label="Reports menu"
                      title="Reports"
                    >
                      {reportsMenuActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
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
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 sm:px-4 h-11 sm:h-12 text-left transition-all duration-200 hover:bg-accent/50',
                          reportsMenuActive && !reportsOpen && 'text-primary font-semibold'
                        )}
                        aria-expanded={reportsOpen}
                        aria-controls="sidebar-reports-list"
                      >
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-muted-foreground">
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
                        <div id="sidebar-reports-list" className="border-l-2 border-primary/15 ml-5 pl-2 space-y-0.5">
                          {REPORT_MENU.map((r, idx) => (
                            <div key={r.slug}>
                              {r.group === 'custom' && REPORT_MENU[idx - 1]?.group === 'standard' && (
                                <div className="my-1.5 border-t border-border/80" aria-hidden />
                              )}
                              <Link
                                to={reportsPath(r.slug)}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                  'flex w-full items-center rounded-md py-2 pl-2 pr-1 text-sm text-foreground/90 hover:bg-accent/40 hover:text-foreground',
                                  location.pathname === reportsPath(r.slug) && 'bg-primary/10 text-primary font-semibold'
                                )}
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
                      className={cn(
                        'flex items-center transition-all duration-200 rounded-lg group relative w-full justify-center h-11 sm:h-12 lg:w-full lg:justify-center hover:bg-accent/30',
                        utilitiesActive && 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-semibold shadow-sm'
                      )}
                      aria-label="Utilities"
                      title="Utilities"
                    >
                      {utilitiesActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
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
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 sm:px-4 h-11 sm:h-12 text-left transition-all duration-200 hover:bg-accent/50',
                          utilitiesActive && !utilitiesOpen && 'text-primary font-semibold'
                        )}
                        aria-expanded={utilitiesOpen}
                        aria-controls="sidebar-utilities-list"
                      >
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-muted-foreground">
                          {utilitiesOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </span>
                        <FolderKanban size={20} className={cn('flex-shrink-0', utilitiesActive && 'text-primary')} />
                        <span className={cn('truncate text-sm sm:text-base font-medium', utilitiesActive && 'text-primary')}>
                          Utilities
                        </span>
                      </button>
                      {utilitiesOpen && (
                        <div id="sidebar-utilities-list" className="border-l-2 border-primary/15 ml-5 pl-2 space-y-0.5">
                          {UTILITIES_MENU.map((u) => {
                            const to = `/utilities/${u.slug}`
                            const childActive = location.pathname === to
                            return (
                              <Link
                                key={u.slug}
                                to={to}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                  'flex w-full items-center rounded-md py-2 pl-2 pr-1 text-sm text-foreground/90 hover:bg-accent/40 hover:text-foreground',
                                  childActive && 'bg-primary/10 text-primary font-semibold'
                                )}
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
            <div className={cn('p-2 sm:p-3', !desktopSidebarExpanded && !sidebarOpen && 'lg:px-2')}>
              <button
                type="button"
                onClick={handleLogout}
                className={cn(
                  'flex items-center transition-all duration-200 rounded-lg text-destructive hover:bg-destructive/10 hover:shadow-sm group w-full',
                  (desktopSidebarExpanded || sidebarOpen)
                    ? 'justify-start gap-3 h-11 sm:h-12 px-3 sm:px-4'
                    : 'justify-center h-11 sm:h-12'
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
        <main className={`flex-1 min-w-0 lg:ml-0 lg:h-screen lg:overflow-y-auto transition-all duration-300 ${
          sidebarOpen ? 'overflow-x-hidden' : ''
        }`}>
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
