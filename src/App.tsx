import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ClientsPage } from './pages/ClientsPage'
import { ClientDetailPage } from './pages/ClientDetailPage'
import { ProformaWorkspacePage } from './pages/ProformaWorkspacePage'
import { SearchPage } from './pages/SearchPage'
import { SettingsPage } from './pages/SettingsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const username = useAppStore((s) => s.username)
  if (!username) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const bootstrap = useAppStore((s) => s.bootstrap)
  const loaded = useAppStore((s) => s.loaded)
  const username = useAppStore((s) => s.username)

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050506] text-[text-slate-500]">
        Loading…
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={username ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:clientId" element={<ClientDetailPage />} />
          <Route
            path="/clients/:clientId/proformas/:proformaId"
            element={<ProformaWorkspacePage />}
          />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
