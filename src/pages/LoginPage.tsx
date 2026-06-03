import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { ui } from '../lib/theme'

export function LoginPage() {
  const login = useAppStore((s) => s.login)
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/', { replace: true })
    } catch {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-violet-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={`w-full max-w-[380px] p-8 ${ui.card}`}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="mb-2 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
              Workspace
            </p>
            <h1 className="mt-1 text-[20px] font-semibold tracking-tight text-slate-900">
              Sign in
            </h1>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-600">Username</label>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={ui.input + ' w-full py-2.5'}
              autoComplete="username"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-slate-600">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={ui.input + ' w-full py-2.5 pr-10'}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-[12px] text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={ui.btnPrimary + ' w-full py-2.5'}
          >
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
