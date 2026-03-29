import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/auth-context'
import { AppShell } from '@/components/app-shell'
import { LoadingScreen } from '@/components/loading-screen'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { AuthPage } from '@/pages/auth-page'

const DashboardPage = lazy(() =>
  import('@/pages/dashboard-page').then((module) => ({
    default: module.DashboardPage,
  })),
)
const ExpensesPage = lazy(() =>
  import('@/pages/expenses-page').then((module) => ({
    default: module.ExpensesPage,
  })),
)
const IncomePage = lazy(() =>
  import('@/pages/income-page').then((module) => ({
    default: module.IncomePage,
  })),
)
const CardsPage = lazy(() =>
  import('@/pages/cards-page').then((module) => ({
    default: module.CardsPage,
  })),
)
const CategoriesPage = lazy(() =>
  import('@/pages/categories-page').then((module) => ({
    default: module.CategoriesPage,
  })),
)
const SettingsPage = lazy(() =>
  import('@/pages/settings-page').then((module) => ({
    default: module.SettingsPage,
  })),
)

function ProtectedRoute() {
  const { loading, isAuthenticated } = useAuth()

  if (loading) {
    return <LoadingScreen fullscreen />
  }

  return isAuthenticated ? <AppShell /> : <Navigate to="/login" replace />
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useAuth()

  if (loading) {
    return <LoadingScreen fullscreen />
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

function RootRedirect() {
  const { isAuthenticated } = useAuth()

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

export default function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      enableSystem={false}
    >
      <AuthProvider>
        <Suspense fallback={<LoadingScreen fullscreen />}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <AuthPage mode="login" />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <AuthPage mode="register" />
                </GuestRoute>
              }
            />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/gastos" element={<ExpensesPage />} />
              <Route path="/ingresos" element={<IncomePage />} />
              <Route path="/tarjetas" element={<CardsPage />} />
              <Route path="/categorias" element={<CategoriesPage />} />
              <Route path="/analitica" element={<Navigate to="/dashboard" replace />} />
              <Route path="/configuracion" element={<SettingsPage />} />
            </Route>
          </Routes>
        </Suspense>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </ThemeProvider>
  )
}
