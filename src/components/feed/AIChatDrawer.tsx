'use client'
import { useState, useRef, useEffect } from 'react'
import { FiX, FiSend } from 'react-icons/fi'
import { BsStars } from 'react-icons/bs'
import { RiRobot2Line } from 'react-icons/ri'
import { ArticleFeed } from '@/types'

interface Msg { role: 'user' | 'assistant'; content: string }
const SUGGESTIONS = ['What exactly happened?', 'Why does this matter?', 'Who is involved?', 'What happens next?', 'Give me full context']

export function AIChatDrawer({ article, isOpen, onClose }: { article: ArticleFeed; isOpen: boolean; onClose: () => void }) {
  const [msgs,    setMsgs]    = useState<Msg[]>([])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && msgs.length === 0) {
      setMsgs([{ role: 'assistant', content: `Hey! 👋 I've read this article.\n\n"${article.title.substring(0, 80)}${article.title.length > 80 ? '...' : ''}"\n\nAsk me anything about it!` }])
    }
    if (!isOpen) setMsgs([])
  }, [isOpen])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Msg = { role: 'user', content: text }
    setMsgs(p => [...p, userMsg])
    setInput('')
    setLoading(true)
    try {
      const r = await fetch('/api/articles/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article.id, messages: [...msgs, userMsg] }),
      })
      if (!r.ok) throw new Error('API error')
      const d = await r.json()
      setMsgs(p => [...p, { role: 'assistant', content: d.reply ?? 'Something went wrong.' }])
    } catch {
      setMsgs(p => [...p, { role: 'assistant', content: 'AsliNewz AI is busy. Try again!' }])
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="absolute bottom-0 inset-x-0 max-w-lg mx-auto bg-[#0D1626] rounded-t-3xl h-[82vh] flex flex-col animate-slide-up"
        style={{ border: '1px solid rgba(233,30,140,0.2)', borderBottom: 'none' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gradient-to-r from-[#E91E8C] to-[#00E5FF]" />
        </div>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/8 flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E91E8C] to-[#7C3AED] flex items-center justify-center">
            <RiRobot2Line size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-white text-sm">AsliNewz AI</span>
              <BsStars size={12} className="text-[#E91E8C]" />
            </div>
            <span className="text-gray-500 text-xs">Ask anything about this article</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 glass rounded-full flex items-center justify-center">
            <FiX size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E91E8C] to-[#7C3AED] flex items-center justify-center flex-shrink-0 mt-1">
                  <RiRobot2Line size={14} className="text-white" />
                </div>
              )}
              <div className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bubble-user text-white' : 'bubble-other text-gray-100'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E91E8C] to-[#7C3AED] flex items-center justify-center flex-shrink-0">
                <RiRobot2Line size={14} className="text-white" />
              </div>
              <div className="bubble-other px-4 py-3 flex items-center gap-1">
                {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-[#E91E8C] animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {msgs.length <= 1 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)}
                className="flex-shrink-0 text-xs glass border border-[#E91E8C]/25 text-gray-300 px-3 py-1.5 rounded-full">
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="px-4 py-3 border-t border-white/8 flex gap-3 items-center flex-shrink-0">
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) send(input) }}
            placeholder="Ask about this article..."
            className="flex-1 bg-[#111E33] text-white text-sm rounded-full px-4 py-2.5 outline-none border border-[#E91E8C]/20 placeholder-gray-600"
          />
          <button onClick={() => send(input)} disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-full btn-magenta flex items-center justify-center flex-shrink-0 disabled:opacity-40">
            <FiSend size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
