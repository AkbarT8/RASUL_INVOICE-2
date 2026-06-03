import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'

export function LoginPage() {
  const login = useAppStore((s) => s.login)
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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
    <div className="flex min-h-screen items-center justify-center bg-[#050506] px-4">
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onSubmit={onSubmit}
        className="w-full max-w-[360px] space-y-5"
      >
        <div className="space-y-1">
          <label className="text-[12px] text-[#71717a]">Username</label>
          <input
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-[#27272f] bg-[#0f0f12] px-3 py-2.5 text-[14px] text-white outline-none transition focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[12px] text-[#71717a]">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-[#27272f] bg-[#0f0f12] px-3 py-2.5 text-[14px] text-white outline-none transition focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30"
          />
        </div>
        {error && (
          <p className="text-[12px] text-red-400">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-violet-600 py-2.5 text-[13px] font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Login'}
        </button>
      </motion.form>
    </div>
  )
}
