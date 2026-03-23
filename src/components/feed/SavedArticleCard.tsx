'use client'
import { useState } from 'react'
import Image from 'next/image'
import { ArticleFeed, CAT_CLASS } from '@/types'
import { HiBookmark } from 'react-icons/hi2'
import { FiExternalLink, FiClock } from 'react-icons/fi'
import { timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

export function SavedArticleCard({ article }: { article: ArticleFeed }) {
  const [removed, setRemoved] = useState(false)
  const unsave = async () => {
    await fetch('/api/save', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ articleId: article.id }) })
    setRemoved(true); toast.success('Removed')
  }
  if (removed) return null
  return (
    <div className="flex gap-3 p-3 rounded-2xl border border-white/5 bg-[#0D1626]">
      {article.imageUrl && (
        <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden">
          <Image src={article.imageUrl} alt={article.title} fill className="object-cover" unoptimized />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`cat-pill ${CAT_CLASS[article.category] ?? 'cat-general'}`}>{article.category}</span>
          <span className="text-gray-600 text-xs ml-auto">{timeAgo(article.publishedAt)}</span>
        </div>
        <h3 className="text-white text-sm font-bold line-clamp-2 mb-1.5">{article.title}</h3>
        <div className="flex items-center gap-3 mt-2">
          <a href={article.articleUrl} target="_blank" rel="noopener noreferrer" className="text-[#00E5FF] text-xs flex items-center gap-1 font-semibold">
            Read <FiExternalLink size={10} />
          </a>
          <span className="text-gray-600 text-xs flex items-center gap-1"><FiClock size={10} /> {article.readTime}m</span>
          <button onClick={unsave} className="ml-auto"><HiBookmark size={18} className="text-[#E91E8C]" /></button>
        </div>
      </div>
    </div>
  )
}
