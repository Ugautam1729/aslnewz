'use client'
import { useState, useEffect, useRef } from 'react'
import { FiSend, FiArrowLeft } from 'react-icons/fi'
import { ChatMessage, FriendUser } from '@/types'
import { timeAgo } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Props { friend: FriendUser; currentUserId: string }

export function ChatWindow({ friend, currentUserId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text,     setText]     = useState('')
  const [sending,  setSending]  = useState(false)
  const [loading,  setLoading]  = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    const t = setInterval(fetchMessages, 5000)
    return () => clearInterval(t)
  }, [friend.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const fetchMessages = async () => {
    try {
      const r = await fetch(`/api/chat/${friend.id}`)
      const d = await r.json()
      setMessages(d.messages ?? [])
    } catch {}
    setLoading(false)
  }

  const send = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const msg = text.trim()
    setText('')
    try {
      const r = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: friend.id, content: msg }),
      })
      if (r.ok) await fetchMessages()
      else toast.error('Failed to send')
    } catch {}
    setSending(false)
  }

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-[#050B18]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-white/8 glass flex-shrink-0">
        <Link href="/friends" className="w-8 h-8 rounded-full flex items-center justify-center">
          <FiArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div className="w-10 h-10 rounded-full border-2 border-[#E91E8C]/40 overflow-hidden flex items-center justify-center bg-[#0D1626]">
          {friend.image ? <img src={friend.image} alt="" className="w-full h-full object-cover" /> : <span className="font-black gradient-text text-lg">{(friend.name ?? 'U')[0].toUpperCase()}</span>}
        </div>
        <div>
          <p className="text-white font-bold text-sm">{friend.name}</p>
          {friend.username && <p className="text-gray-500 text-xs">@{friend.username}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar pb-24">
        {loading && <div className="flex justify-center py-10"><div className="w-6 h-6 rounded-full border-2 border-[#E91E8C] border-t-transparent animate-spin" /></div>}
        {!loading && messages.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">👋</div>
            <p className="text-white font-bold">Start a conversation!</p>
            <p className="text-gray-500 text-sm mt-1">Share news articles or just say hi</p>
          </div>
        )}
        {messages.map(m => {
          const isMe = m.senderId === currentUserId
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
              {!isMe && (
                <div className="w-7 h-7 rounded-full border border-[#E91E8C]/30 overflow-hidden flex-shrink-0 flex items-center justify-center bg-[#0D1626]">
                  {friend.image ? <img src={friend.image} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-black gradient-text">{(friend.name ?? 'U')[0].toUpperCase()}</span>}
                </div>
              )}
              <div className={`max-w-[75%] ${isMe ? 'bubble-user' : 'bubble-other'} px-4 py-2.5`}>
                {/* Article share card */}
                {m.articleId && (
                  <div className="bg-black/20 rounded-xl p-2.5 mb-2 flex gap-2.5">
                    {m.articleImage && <img src={m.articleImage} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-white/60 mb-0.5">📰 Shared Article</p>
                      <p className="text-white text-xs font-semibold line-clamp-2">{m.articleTitle}</p>
                    </div>
                  </div>
                )}
                {m.content && <p className="text-white text-sm leading-relaxed">{m.content}</p>}
                <p className={`text-[10px] mt-1 ${isMe ? 'text-white/50' : 'text-gray-600'}`}>{timeAgo(m.createdAt)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-0 inset-x-0 max-w-lg mx-auto px-4 py-3 glass border-t border-white/8">
        <div className="flex gap-3 items-center">
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
            placeholder="Type a message..."
            className="flex-1 bg-[#111E33] text-white text-sm rounded-full px-4 py-2.5 outline-none border border-[#E91E8C]/20 placeholder-gray-600" />
          <button onClick={send} disabled={sending || !text.trim()}
            className="w-10 h-10 rounded-full btn-magenta flex items-center justify-center flex-shrink-0 disabled:opacity-40">
            {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSend size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
