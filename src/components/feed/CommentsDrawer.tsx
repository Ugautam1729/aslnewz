'use client'
import { useState, useEffect, useRef } from 'react'
import { FiX, FiSend, FiHeart, FiSmile } from 'react-icons/fi'
import { HiHeart } from 'react-icons/hi2'
import { CommentFull } from '@/types'
import { timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Props { articleId: string; userId: string | null; isOpen: boolean; onClose: () => void; onCommentAdded: () => void }

export function CommentsDrawer({ articleId, userId, isOpen, onClose, onCommentAdded }: Props) {
  const [comments,    setComments]    = useState<CommentFull[]>([])
  const [text,        setText]        = useState('')
  const [loading,     setLoading]     = useState(false)
  const [posting,     setPosting]     = useState(false)
  const [showGifs,    setShowGifs]    = useState(false)
  const [gifQuery,    setGifQuery]    = useState('')
  const [gifs,        setGifs]        = useState<any[]>([])
  const [selectedGif, setSelectedGif] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (isOpen) { fetchComments(); setShowGifs(false) } }, [isOpen])

  const fetchComments = async () => {
    setLoading(true)
    try { const r = await fetch(`/api/comments?articleId=${articleId}`); const d = await r.json(); setComments(d.comments ?? []) } catch {}
    setLoading(false)
  }

  const searchGifs = async (q: string) => {
    if (!q.trim()) return
    try { const r = await fetch(`/api/gifs?q=${encodeURIComponent(q)}`); const d = await r.json(); setGifs(d.gifs ?? []) } catch {}
  }

  const post = async () => {
    if (!userId) { toast.error('Sign in to comment'); return }
    if (!text.trim() && !selectedGif) return
    setPosting(true)
    try {
      const r = await fetch('/api/comments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, content: text.trim(), gifUrl: selectedGif }),
      })
      if (r.ok) {
        const d = await r.json()
        setComments(p => [d.comment, ...p])
        setText(''); setSelectedGif(null); setShowGifs(false)
        onCommentAdded(); toast.success('Comment posted!')
      }
    } catch {}
    setPosting(false)
  }

  const likeComment = async (commentId: string, liked: boolean) => {
    if (!userId) { toast.error('Sign in to like'); return }
    setComments(p => p.map(c => c.id === commentId ? { ...c, likedByMe: !liked, _count: { likes: (c._count?.likes ?? 0) + (liked ? -1 : 1) } } : c))
    fetch('/api/comments/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ commentId }) }).catch(() => {})
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="absolute bottom-0 inset-x-0 max-w-lg mx-auto bg-[#0D1626] rounded-t-3xl max-h-[88vh] flex flex-col animate-slide-up"
        style={{ border: '1px solid rgba(233,30,140,0.2)', borderBottom: 'none' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0"><div className="w-10 h-1 rounded-full bg-gradient-to-r from-[#E91E8C] to-[#00E5FF]" /></div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/8 flex-shrink-0">
          <h3 className="font-black text-white">Comments {comments.length > 0 && <span className="text-[#E91E8C] text-sm">({comments.length})</span>}</h3>
          <button onClick={onClose} className="w-8 h-8 glass rounded-full flex items-center justify-center"><FiX size={16} className="text-gray-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 no-scrollbar">
          {loading && <div className="flex justify-center py-10"><div className="w-6 h-6 rounded-full border-2 border-[#E91E8C] border-t-transparent animate-spin" /></div>}
          {!loading && comments.length === 0 && (
            <div className="text-center py-10"><div className="text-4xl mb-3">💬</div><p className="text-white font-bold">Be the first to comment!</p></div>
          )}
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#E91E8C]/30 flex items-center justify-center bg-[#111E33] flex-shrink-0">
                {c.user.image ? <img src={c.user.image} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-black gradient-text">{(c.user.name ?? 'U')[0].toUpperCase()}</span>}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-white text-sm font-bold">{c.user.name ?? 'User'}</span>
                  <span className="text-gray-600 text-xs ml-auto">{timeAgo(c.createdAt)}</span>
                </div>
                <div className="bg-[#111E33] rounded-2xl rounded-tl-sm px-3.5 py-2.5 inline-block max-w-full">
                  {c.content && <p className="text-gray-100 text-sm leading-relaxed">{c.content}</p>}
                  {c.gifUrl && <img src={c.gifUrl} alt="GIF" className="rounded-xl max-h-36 mt-1" />}
                </div>
                <div className="flex items-center gap-3 mt-1.5 ml-1">
                  <button onClick={() => likeComment(c.id, c.likedByMe ?? false)} className={`flex items-center gap-1 text-xs ${c.likedByMe ? 'text-[#E91E8C]' : 'text-gray-500'}`}>
                    {c.likedByMe ? <HiHeart size={14} /> : <FiHeart size={13} />}
                    {(c._count?.likes ?? 0) > 0 && c._count?.likes}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showGifs && (
          <div className="px-4 py-2 border-t border-white/8 flex-shrink-0">
            <input value={gifQuery} onChange={e => { setGifQuery(e.target.value); searchGifs(e.target.value) }} placeholder="Search GIFs..."
              className="w-full bg-[#111E33] text-white text-sm rounded-full px-3 py-1.5 outline-none border border-[#E91E8C]/20 mb-2" />
            <div className="grid grid-cols-3 gap-1 max-h-36 overflow-y-auto no-scrollbar">
              {gifs.map((g: any, i) => (
                <img key={i} src={g.preview ?? g.url} alt="" className={`w-full h-20 object-cover rounded-xl cursor-pointer ${selectedGif === g.url ? 'ring-2 ring-[#E91E8C]' : ''}`}
                  onClick={() => { setSelectedGif(g.url === selectedGif ? null : g.url); setShowGifs(false) }} />
              ))}
            </div>
          </div>
        )}

        {selectedGif && (
          <div className="px-4 py-2 flex items-center gap-2 border-t border-white/8 flex-shrink-0">
            <img src={selectedGif} alt="" className="h-14 rounded-xl" />
            <button onClick={() => setSelectedGif(null)} className="text-gray-400 text-xs">Remove</button>
          </div>
        )}

        <div className="px-4 py-3 border-t border-white/8 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => { setShowGifs(!showGifs); if (!showGifs) searchGifs('reaction') }}
            className={`w-9 h-9 rounded-full flex items-center justify-center glass border ${showGifs ? 'border-[#E91E8C]/50' : 'border-white/10'}`}>
            <FiSmile size={18} className={showGifs ? 'text-[#E91E8C]' : 'text-gray-400'} />
          </button>
          <input ref={inputRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') post() }}
            placeholder={userId ? 'Add your take...' : 'Sign in to comment...'}
            disabled={!userId}
            className="flex-1 bg-[#111E33] text-white text-sm rounded-full px-4 py-2.5 outline-none border border-[#E91E8C]/20 placeholder-gray-600 disabled:opacity-50" />
          <button onClick={post} disabled={posting || (!text.trim() && !selectedGif) || !userId}
            className="w-9 h-9 rounded-full btn-magenta flex items-center justify-center disabled:opacity-40">
            {posting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSend size={15} />}
          </button>
        </div>
      </div>
    </div>
  )
}
