'use client'
import { useState, useEffect } from 'react'
import { FiX, FiSend } from 'react-icons/fi'
import { FriendUser } from '@/types'
import toast from 'react-hot-toast'

interface Props {
  article: { id: string; title: string; imageUrl: string | null }
  isOpen: boolean
  onClose: () => void
  userId: string | null
}

export function ShareDrawer({ article, isOpen, onClose, userId }: Props) {
  const [friends, setFriends] = useState<FriendUser[]>([])
  const [sending, setSending] = useState<string | null>(null)
  const [sent,    setSent]    = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isOpen && userId) {
      fetch('/api/friends').then(r => r.json()).then(d => setFriends(d.friends ?? []))
    }
  }, [isOpen, userId])

  const shareToFriend = async (friendId: string) => {
    setSending(friendId)
    try {
      const r = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId:   friendId,
          articleId:    article.id,
          articleTitle: article.title,
          articleImage: article.imageUrl,
        }),
      })
      if (r.ok) {
        setSent(p => new Set([...p, friendId]))
        toast.success('Article shared!')
      }
    } catch {}
    setSending(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="absolute bottom-0 inset-x-0 max-w-lg mx-auto bg-[#0D1626] rounded-t-3xl animate-slide-up"
        style={{ border: '1px solid rgba(233,30,140,0.2)', borderBottom: 'none', maxHeight: '70vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gradient-to-r from-[#E91E8C] to-[#00E5FF]" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
          <h3 className="font-black text-white">Share with Friends</h3>
          <button onClick={onClose} className="w-8 h-8 glass rounded-full flex items-center justify-center">
            <FiX size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Article preview */}
        <div className="mx-4 my-3 flex gap-3 p-3 bg-[#111E33] rounded-2xl border border-white/5">
          {article.imageUrl && <img src={article.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />}
          <p className="text-white text-sm font-semibold line-clamp-2 flex-1">{article.title}</p>
        </div>

        <div className="overflow-y-auto no-scrollbar px-4 pb-6 space-y-2" style={{ maxHeight: '40vh' }}>
          {!userId && <p className="text-gray-500 text-sm text-center py-6">Sign in to share with friends</p>}
          {userId && friends.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-6">No friends yet. Add friends to share news!</p>
          )}
          {friends.map(f => (
            <div key={f.id} className="flex items-center gap-3 p-3 bg-[#111E33] rounded-2xl">
              <div className="w-10 h-10 rounded-full border border-[#E91E8C]/30 overflow-hidden flex items-center justify-center bg-[#0D1626] flex-shrink-0">
                {f.image ? <img src={f.image} alt="" className="w-full h-full object-cover" /> : <span className="font-black gradient-text">{(f.name ?? 'U')[0].toUpperCase()}</span>}
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{f.name}</p>
                {f.username && <p className="text-gray-500 text-xs">@{f.username}</p>}
              </div>
              <button
                onClick={() => shareToFriend(f.id)}
                disabled={sending === f.id || sent.has(f.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 ${sent.has(f.id) ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'btn-magenta'}`}
              >
                {sending === f.id ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : sent.has(f.id) ? '✓ Sent' : <><FiSend size={11} /> Send</>}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
