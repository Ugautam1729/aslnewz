'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import { RiNewspaperLine } from 'react-icons/ri'
import { BsStars } from 'react-icons/bs'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const [mode,     setMode]     = useState<'login' | 'register'>('login')
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [gLoading, setGLoading] = useState(false)
  const router = useRouter()

  const submit = async () => {
    if (!email || !password) { toast.error('Fill all fields'); return }
    if (password.length < 6) { toast.error('Password must be 6+ characters'); return }
    setLoading(true)
    if (mode === 'register') {
      const r = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password }) })
      const d = await r.json()
      if (!r.ok) { toast.error(d.error ?? 'Registration failed'); setLoading(false); return }
      toast.success('Account created! 🎉')
    }
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) { toast.error('Wrong email or password'); setLoading(false); return }
    toast.success('Welcome to AsliNewz! 🔥')
    router.push('/feed'); router.refresh()
    setLoading(false)
  }

  const googleSignIn = async () => {
    setGLoading(true)
    await signIn('google', { callbackUrl: '/feed' })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #E91E8C, transparent)' }} />
      <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #00E5FF, transparent)' }} />

      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E91E8C] to-[#7C3AED] flex items-center justify-center mb-3 shadow-xl shadow-[#E91E8C]/30">
          <RiNewspaperLine size={30} className="text-white" />
        </div>
        <h1 className="font-black text-3xl tracking-tight text-white">Asli<span className="text-[#E91E8C]">Newz</span></h1>
        <p className="text-gray-500 text-sm mt-1 flex items-center gap-1"><BsStars size={11} className="text-[#E91E8C]" /> Real News, Real Fast</p>
      </div>

      <div className="w-full max-w-sm gradient-border rounded-3xl p-6" style={{ background: '#0D1626' }}>
        <div className="flex bg-[#050B18] rounded-2xl p-1 mb-5">
          {(['login','register'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${mode === m ? 'bg-gradient-to-r from-[#E91E8C] to-[#7C3AED] text-white' : 'text-gray-500'}`}>
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {mode === 'register' && (
            <div className="flex items-center gap-3 bg-[#111E33] rounded-2xl px-4 py-3 border border-white/5">
              <FiUser size={16} className="text-[#E91E8C] flex-shrink-0" />
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600" />
            </div>
          )}
          <div className="flex items-center gap-3 bg-[#111E33] rounded-2xl px-4 py-3 border border-white/5">
            <FiMail size={16} className="text-[#E91E8C] flex-shrink-0" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600" />
          </div>
          <div className="flex items-center gap-3 bg-[#111E33] rounded-2xl px-4 py-3 border border-white/5">
            <FiLock size={16} className="text-[#E91E8C] flex-shrink-0" />
            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit() }} placeholder="Password (min 6 chars)"
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600" />
            <button onClick={() => setShowPass(!showPass)}>{showPass ? <FiEyeOff size={16} className="text-gray-500" /> : <FiEye size={16} className="text-gray-500" />}</button>
          </div>
          <button onClick={submit} disabled={loading}
            className="w-full btn-magenta py-3.5 text-sm flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : mode === 'login' ? '🔥 Sign In' : '🚀 Create Account'}
          </button>
          <div className="flex items-center gap-3"><div className="flex-1 h-px bg-white/8" /><span className="text-gray-600 text-xs font-bold">OR</span><div className="flex-1 h-px bg-white/8" /></div>
          <button onClick={googleSignIn} disabled={gLoading}
            className="w-full bg-white text-gray-900 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 disabled:opacity-70">
            {gLoading ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <><FcGoogle size={20} /> Continue with Google</>}
          </button>
        </div>
      </div>
      <p className="text-gray-700 text-xs mt-5">By continuing you agree to AsliNewz Terms</p>
    </div>
  )
}
