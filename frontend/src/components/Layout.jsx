import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, Users, Car, Calendar, Wrench, Package, 
  Gift, BarChart3, Menu, X, LogOut, UserCheck, ListChecks, DollarSign, FileText
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button, buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAdmin, isCustomer, isAccountant } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [desktopSidebarExpanded, setDesktopSidebarExpanded] = useState(true) // Start with sidebar expanded

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const adminMenuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/pending-approvals', icon: UserCheck, label: 'Pending Approvals' },
    { path: '/vehicles', icon: Car, label: 'Vehicles' },
    { path: '/appointments', icon: Calendar, label: 'Appointments' },
    { path: '/services', icon: Wrench, label: 'Services' },
    { path: '/proformas', icon: FileText, label: 'Proformas' },
    { path: '/service-checklists', icon: ListChecks, label: 'Service Checklists' },
    { path: '/parts', icon: Package, label: 'Parts' },
    { path: '/loyalty', icon: Gift, label: 'Loyalty' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
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
                const showLabel = desktopSidebarExpanded || sidebarOpen
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
