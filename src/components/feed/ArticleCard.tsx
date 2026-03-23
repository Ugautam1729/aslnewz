'use client'
import { useState } from 'react'
import Image from 'next/image'
import { ArticleFeed, CAT_CLASS } from '@/types'
import { FiBookmark, FiShare2, FiMessageCircle } from 'react-icons/fi'
import { HiBookmark } from 'react-icons/hi2'
import { BsStars } from 'react-icons/bs'
import { MdVerified } from 'react-icons/md'
import toast from 'react-hot-toast'
import { CommentsDrawer } from './CommentsDrawer'
import { AIChatDrawer } from './AIChatDrawer'
import { ShareDrawer } from './ShareDrawer'
import { timeAgo } from '@/lib/utils'

interface Props { article: ArticleFeed; userId: string | null; index: number }
const FALLBACK = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&q=80'

export function ArticleCard({ article, userId, index }: Props) {
  const [saved,        setSaved]        = useState(article.isSaved ?? false)
  const [commentCount, setCommentCount] = useState(article._count.comments)
  const [showComments, setShowComments] = useState(false)
  const [showChat,     setShowChat]     = useState(false)
  const [showShare,    setShowShare]    = useState(false)
  const [imgErr,       setImgErr]       = useState(false)

  const handleSave = async () => {
    if (!userId) { toast.error('Sign in to save'); return }
    const prev = saved; setSaved(!prev)
    const res = await fetch('/api/save', {
      method: prev ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId: article.id }),
    })
    if (!res.ok) setSaved(prev)
    else toast.success(prev ? 'Removed' : '🔖 Saved!')
  }

  const catClass = CAT_CLASS[article.category] ?? 'cat-general'

  return (
    <>
      <div className="relative h-full w-full overflow-hidden bg-[#050B18]">
        {/* Full bleed image */}
        <div className="absolute inset-0">
          <Image
            src={(!imgErr && article.imageUrl) ? article.imageUrl : FALLBACK}
            alt={article.title} fill className="object-cover"
            priority={index < 3} onError={() => setImgErr(true)}
            sizes="(max-width: 512px) 100vw, 512px" unoptimized
          />
          <div className="absolute inset-0 card-gradient" />
          <div className="absolute top-0 inset-x-0 h-36 top-gradient" />
        </div>

        {/* Top badges */}
        <div className="absolute top-14 inset-x-4 flex items-center justify-between">
          {article.breaking ? (
            <div className="flex items-center gap-1.5 bg-[#E91E8C] px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-white text-[10px] font-black tracking-wider">BREAKING</span>
            </div>
          ) : (
            <span className={`cat-pill ${catClass}`}>{article.category}</span>
          )}
          <div className="flex items-center gap-1 glass px-2 py-1 rounded-full">
            <MdVerified size={10} className="text-[#00E5FF]" />
            <span className="text-[#00E5FF] text-[9px] font-bold">VERIFIED</span>
          </div>
        </div>

        {/* Bottom content */}
        <div className="absolute inset-x-0 bottom-0 px-4 pb-24">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white/40 text-xs">{timeAgo(article.publishedAt)}</span>
            <span className="text-white/20">·</span>
            <span className="text-white/40 text-xs">{article.readTime} min</span>
          </div>

          {/* Title only — no summary */}
          <h2 className="text-white font-black text-[1.35rem] leading-tight mb-5 drop-shadow-lg">
            {article.title}
          </h2>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            {/* AI Chat — primary */}
            <button
              onClick={() => setShowChat(true)}
              className="flex items-center gap-2 btn-magenta px-5 py-3 text-sm flex-1 justify-center"
            >
              <BsStars size={16} /> Ask AI
            </button>

            <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-0.5 px-3 py-2.5 glass rounded-2xl border border-white/10">
              <FiMessageCircle size={21} className="text-white/80" />
              <span className="text-[9px] text-white/50">{commentCount}</span>
            </button>

            <button onClick={handleSave} className={`flex flex-col items-center gap-0.5 px-3 py-2.5 glass rounded-2xl border ${saved ? 'border-[#E91E8C]/50' : 'border-white/10'}`}>
              {saved ? <HiBookmark size={21} className="text-[#E91E8C]" /> : <FiBookmark size={21} className="text-white/80" />}
              <span className={`text-[9px] ${saved ? 'text-[#E91E8C]' : 'text-white/50'}`}>Save</span>
            </button>

            {/* Share → opens friends list */}
            <button onClick={() => setShowShare(true)} className="flex flex-col items-center gap-0.5 px-3 py-2.5 glass rounded-2xl border border-white/10">
              <FiShare2 size={21} className="text-white/80" />
              <span className="text-[9px] text-white/50">Share</span>
            </button>
          </div>
        </div>
      </div>

      <CommentsDrawer articleId={article.id} userId={userId} isOpen={showComments} onClose={() => setShowComments(false)} onCommentAdded={() => setCommentCount(c => c+1)} />
      <AIChatDrawer article={article} isOpen={showChat} onClose={() => setShowChat(false)} />
      <ShareDrawer article={{ id: article.id, title: article.title, imageUrl: article.imageUrl }} isOpen={showShare} onClose={() => setShowShare(false)} userId={userId} />
    </>
  )
}
