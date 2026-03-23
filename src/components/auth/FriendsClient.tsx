'use client'
import { useState } from 'react'
import { FiCheck, FiX, FiUsers, FiUserPlus, FiMessageCircle } from 'react-icons/fi'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Req { id: string; sender: { id:string; name:string|null; username:string|null; image:string|null } }
interface Friend { id:string; name:string|null; username:string|null; image:string|null }
interface Props { userId:string; requests: Req[]; friends: Friend[] }

export function FriendsClient({ userId, requests: initReqs, friends: initFriends }: Props) {
  const [requests, setRequests] = useState(initReqs)
  const [friends,  setFriends]  = useState(initFriends)
  const [tab,      setTab]      = useState<'friends' | 'requests'>('friends') // friends first

  const respond = async (requestId: string, senderId: string, accept: boolean) => {
    const r = await fetch('/api/follow/respond', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ requestId, accept }) })
    if (!r.ok) { toast.error('Something went wrong'); return }
    const req = requests.find(r => r.id === requestId)
    setRequests(p => p.filter(r => r.id !== requestId))
    if (accept && req) { setFriends(p => [...p, req.sender]); toast.success(`You and ${req.sender.name} are now friends! 🎉`) }
    else toast.success('Request declined')
  }

  const Avatar = ({ u }: { u: Friend }) => (
    <div className="w-12 h-12 rounded-full border-2 border-[#E91E8C]/30 overflow-hidden flex items-center justify-center bg-[#111E33] flex-shrink-0">
      {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover" /> : <span className="font-black gradient-text text-lg">{(u.name ?? 'U')[0].toUpperCase()}</span>}
    </div>
  )

  return (
    <div className="pt-16 px-4">
      <h1 className="text-xl font-black text-white mt-3 mb-1">Friends</h1>
      <p className="text-gray-600 text-sm mb-4">Connect and share news with people</p>

      {/* Tabs — FRIENDS FIRST */}
      <div className="flex bg-[#0D1626] rounded-2xl p-1 mb-5">
        {(['friends','requests'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-1.5 transition-all ${tab === t ? 'bg-gradient-to-r from-[#E91E8C] to-[#7C3AED] text-white' : 'text-gray-500'}`}>
            {t === 'friends' ? <FiUsers size={13} /> : <FiUserPlus size={13} />}
            {t === 'friends' ? `Friends (${friends.length})` : `Requests${requests.length > 0 ? ` (${requests.length})` : ''}`}
            {t === 'requests' && requests.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#E91E8C] text-white text-[9px] font-black flex items-center justify-center">{requests.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Friends tab */}
      {tab === 'friends' && (
        <div className="space-y-3">
          {friends.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-white font-bold mb-1">No friends yet</p>
              <p className="text-gray-600 text-sm">Search for people to connect with</p>
              <Link href="/search" className="inline-block mt-4 btn-magenta px-5 py-2.5 text-sm">Find People</Link>
            </div>
          )}
          {friends.map(f => (
            <div key={f.id} className="flex items-center gap-3 p-4 bg-[#0D1626] rounded-2xl border border-white/5">
              <Link href={`/chat/${f.id}`} className="flex items-center gap-3 flex-1">
                <Avatar u={f} />
                <div>
                  <p className="text-white font-bold text-sm">{f.name ?? 'User'}</p>
                  {f.username && <p className="text-gray-500 text-xs">@{f.username}</p>}
                </div>
              </Link>
              <Link href={`/chat/${f.id}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#111E33] border border-[#E91E8C]/20 text-[#E91E8C] text-xs font-bold">
                <FiMessageCircle size={14} /> Chat
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Requests tab */}
      {tab === 'requests' && (
        <div className="space-y-3">
          {requests.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🤝</div>
              <p className="text-white font-bold mb-1">No pending requests</p>
              <Link href="/search" className="inline-block mt-4 btn-magenta px-5 py-2.5 text-sm">Find People</Link>
            </div>
          )}
          {requests.map(req => (
            <div key={req.id} className="flex items-center gap-3 p-4 bg-[#0D1626] rounded-2xl border border-white/5">
              <Avatar u={req.sender} />
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{req.sender.name ?? 'User'}</p>
                {req.sender.username && <p className="text-gray-500 text-xs">@{req.sender.username}</p>}
                <p className="text-gray-600 text-xs mt-0.5">Wants to be friends</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => respond(req.id, req.sender.id, true)} className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E91E8C] to-[#7C3AED] flex items-center justify-center">
                  <FiCheck size={16} className="text-white" />
                </button>
                <button onClick={() => respond(req.id, req.sender.id, false)} className="w-9 h-9 rounded-full bg-[#111E33] border border-white/10 flex items-center justify-center">
                  <FiX size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
