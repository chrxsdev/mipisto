import { useEffect, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  PanelLeft,
  User,
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { NAV_ITEMS } from '@/lib/constants'
import { getInitials } from '@/lib/format'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/gastos': 'Gastos',
  '/ingresos': 'Ingresos',
  '/tarjetas': 'Tarjetas',
  '/categorias': 'Categorías',
  '/configuracion': 'Configuración',
}

function SidebarLinks({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  return (
    <nav className="space-y-1.5">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon

        return (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            aria-label={item.label}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex items-center rounded-2xl border border-transparent text-sm font-medium transition-all duration-200',
                collapsed
                  ? 'justify-center px-0 py-3.5'
                  : 'gap-3 px-4 py-3.5',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground',
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            {!collapsed ? <span>{item.label}</span> : null}
          </NavLink>
        )
      })}
    </nav>
  )
}

export function AppShell() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const title = pageTitles[location.pathname] ?? 'Finanzas'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const savedValue = window.localStorage.getItem('mi-pisto-sidebar-collapsed')
    if (savedValue === 'true') {
      setSidebarCollapsed(true)
    }
  }, [])

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current
      window.localStorage.setItem('mi-pisto-sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <div
      className={cn(
        'relative min-h-screen lg:grid',
        sidebarCollapsed
          ? 'lg:grid-cols-[96px_1fr]'
          : 'lg:grid-cols-[248px_1fr]',
      )}
    >
      <aside className="hidden border-r border-border bg-sidebar px-3 py-4 lg:block">
        <div className="flex h-full flex-col">
          <div
            className={cn(
              'flex items-center pb-4',
              sidebarCollapsed ? 'justify-center' : 'justify-between gap-3',
            )}
          >
            <div
              className={cn(
                'flex items-center rounded-2xl',
                sidebarCollapsed ? 'justify-center' : 'gap-3',
              )}
            >
              <img src="/logo.png" alt="Mi Pisto" className="size-11 object-contain" />
              {!sidebarCollapsed ? (
                <div>
                  <p className="text-[0.68rem] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                    Mi Pisto
                  </p>
                  <h1 className="text-base font-semibold tracking-tight">Finanzas</h1>
                </div>
              ) : null}
            </div>

            {!sidebarCollapsed ? (
              <Button variant="ghost" size="icon-sm" onClick={toggleSidebar}>
                <ChevronLeft />
              </Button>
            ) : null}
          </div>

          {sidebarCollapsed ? (
            <div className="pb-4">
              <Button variant="ghost" size="icon-sm" className="w-full" onClick={toggleSidebar}>
                <ChevronRight />
              </Button>
            </div>
          ) : null}

          <SidebarLinks collapsed={sidebarCollapsed} />
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 mx-3 mt-3 flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-4 lg:mx-4">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger
                render={<Button variant="outline" className="lg:hidden" size="icon-sm" />}
              >
                <PanelLeft />
              </SheetTrigger>
              <SheetContent side="left" className="max-w-72">
                <SheetHeader>
                  <SheetTitle>Finanzas</SheetTitle>
                  <SheetDescription>Navega por tus módulos</SheetDescription>
                </SheetHeader>
                <div className="px-4 pb-4">
                  <SidebarLinks onNavigate={undefined} />
                </div>
              </SheetContent>
            </Sheet>
            <div>
              <p className="text-[0.68rem] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                Banking Dashboard
              </p>
              <h2 className="text-[1.65rem] font-semibold tracking-tight">{title}</h2>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="icon-sm" className="rounded-full" />}
            >
              <Avatar className="size-8">
                <AvatarFallback>{getInitials(user?.name ?? 'MP')}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/configuracion')}>
                <User className="size-4" />
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                variant="destructive"
              >
                <LogOut className="size-4" />
                Salir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 px-3 pb-6 pt-5 lg:px-4 lg:pb-8 lg:pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
