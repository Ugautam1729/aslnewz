'use client'
import { useState } from 'react'
import { FiSearch, FiX, FiUserPlus } from 'react-icons/fi'
import { useSession } from 'next-auth/react'
import { SavedArticleCard } from '@/components/feed/SavedArticleCard'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'
import toast from 'react-hot-toast'

export default function SearchPage() {
  const [query,   setQuery]   = useState('')
  const [tab,     setTab]     = useState<'news'|'people'>('news')
  const [results, setResults] = useState<any[]>([])
  const [users,   setUsers]   = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { data: session } = useSession()
  const userId = (session?.user as any)?.id ?? null

  const search = async (q: string) => {
    if (!q.trim()) { setResults([]); setUsers([]); return }
    setLoading(true)
    try {
      const [nr, ur] = await Promise.all([
        fetch(`/api/feed/search?q=${encodeURIComponent(q)}`),
        fetch(`/api/users/search?q=${encodeURIComponent(q)}`),
      ])
      const nd = await nr.json(); const ud = await ur.json()
      setResults(nd.articles ?? []); setUsers(ud.users ?? [])
    } catch {}
    setLoading(false)
  }

  const sendRequest = async (toId: string) => {
    if (!userId) { toast.error('Sign in first'); return }
    const r = await fetch('/api/follow', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ toId }) })
    if (r.ok) { toast.success('Friend request sent! 🤝'); setUsers(p => p.map(u => u.id === toId ? { ...u, friendStatus:'pending_sent' } : u)) }
    else { const d = await r.json(); toast.error(d.error ?? 'Failed') }
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto pb-24">
      <TopBar userId={userId} userName={session?.user?.name ?? null} userImage={session?.user?.image ?? null} />
      <div className="pt-16 px-4">
        <div className="flex items-center gap-3 bg-[#0D1626] border border-[#E91E8C]/20 rounded-2xl px-4 py-3 mt-3 mb-4">
          <FiSearch size={18} className="text-[#E91E8C] flex-shrink-0" />
          <input autoFocus value={query} onChange={e => { setQuery(e.target.value); search(e.target.value) }}
            placeholder="Search news, people..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600" />
          {query && <button onClick={() => { setQuery(''); setResults([]); setUsers([]) }}><FiX size={16} className="text-gray-500" /></button>}
        </div>

        {query && (
          <div className="flex bg-[#0D1626] rounded-2xl p-1 mb-4">
            {(['news','people'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-black transition-all capitalize ${tab === t ? 'bg-gradient-to-r from-[#E91E8C] to-[#7C3AED] text-white' : 'text-gray-500'}`}>
                {t} ({t === 'news' ? results.length : users.length})
              </button>
            ))}
          </div>
        )}

        {loading && <div className="flex justify-center py-10"><div className="w-6 h-6 rounded-full border-2 border-[#E91E8C] border-t-transparent animate-spin" /></div>}

        {!query && !loading && (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-[#0D1626] border border-[#E91E8C]/20 flex items-center justify-center mx-auto mb-4">
              <FiSearch size={24} className="text-[#E91E8C]" />
            </div>
            <p className="text-white font-bold mb-1">Search AsliNewz</p>
            <p className="text-gray-600 text-sm">Find news or people</p>
          </div>
        )}

        {tab === 'news' && !loading && (
          <div className="space-y-3">
            {results.map(a => <SavedArticleCard key={a.id} article={a} />)}
            {query && results.length === 0 && !loading && <p className="text-center py-10 text-gray-600 text-sm">No news found</p>}
          </div>
        )}

        {tab === 'people' && !loading && (
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-3 bg-[#0D1626] rounded-2xl border border-white/5">
                <div className="w-11 h-11 rounded-full border-2 border-[#E91E8C]/30 overflow-hidden flex items-center justify-center bg-[#111E33] flex-shrink-0">
                  {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover" /> : <span className="font-black gradient-text">{(u.name ?? 'U')[0].toUpperCase()}</span>}
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{u.name ?? 'User'}</p>
                  {u.username && <p className="text-gray-500 text-xs">@{u.username}</p>}
                </div>
                {u.id !== userId && (
                  <button onClick={() => sendRequest(u.id)}
                    disabled={u.friendStatus === 'pending_sent' || u.friendStatus === 'friends'}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                      u.friendStatus === 'friends'      ? 'bg-[#111E33] text-[#00E5FF] border border-[#00E5FF]/30' :
                      u.friendStatus === 'pending_sent' ? 'bg-[#111E33] text-gray-500 border border-white/10' : 'btn-magenta'
                    }`}>
                    <FiUserPlus size={11} />
                    {u.friendStatus === 'friends' ? 'Friends' : u.friendStatus === 'pending_sent' ? 'Sent' : 'Add'}
                  </button>
                )}
              </div>
            ))}
            {query && users.length === 0 && !loading && <p className="text-center py-10 text-gray-600 text-sm">No people found</p>}
          </div>
        )}
      </div>
      <BottomNav userId={userId} active="search" />
    </div>
  )
}
