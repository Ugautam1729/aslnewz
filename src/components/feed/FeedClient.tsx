'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { ArticleFeed, Category, CATEGORIES } from '@/types'
import { ArticleCard } from './ArticleCard'
import { TopBar } from '../layout/TopBar'
import { BottomNav } from '../layout/BottomNav'

interface Props {
  initialArticles: ArticleFeed[]
  userId: string | null
  userName: string | null
  userImage: string | null
  initialCategory: string
}

export function FeedClient({ initialArticles, userId, userName, userImage, initialCategory }: Props) {
  const [articles, setArticles] = useState(initialArticles)
  const [category, setCategory] = useState<Category>(initialCategory as Category)
  const [loading,  setLoading]  = useState(false)
  const [cursor,   setCursor]   = useState(initialArticles.length)
  const [hasMore,  setHasMore]  = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const fetchFresh = useCallback(async (cat: Category) => {
    setLoading(true)
    try {
      const r = await fetch(`/api/feed?cursor=0&category=${cat}&limit=20`)
      const d = await r.json()
      setArticles(d.articles ?? [])
      setCursor(d.articles?.length ?? 0)
      setHasMore((d.articles?.length ?? 0) >= 20)
    } catch {}
    setLoading(false)
  }, [])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const r = await fetch(`/api/feed?cursor=${cursor}&category=${category}&limit=10`)
      const d = await r.json()
      if (!d.articles?.length) setHasMore(false)
      else { setArticles(p => [...p, ...d.articles]); setCursor(p => p + d.articles.length) }
    } catch {}
    setLoading(false)
  }, [loading, hasMore, cursor, category])

  const switchCategory = async (cat: Category) => {
    if (cat === category) return
    setCategory(cat)
    setArticles([])
    setCursor(0)
    setHasMore(true)
    await fetchFresh(cat)
  }

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(e => { if (e[0].isIntersecting) loadMore() }, { threshold: 0.1 })
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [loadMore])

  // Auto-refresh every 15 min
  useEffect(() => {
    const t = setInterval(() => fetchFresh(category), 15 * 60 * 1000)
    return () => clearInterval(t)
  }, [category, fetchFresh])

  return (
    <div className="relative max-w-lg mx-auto min-h-screen">
      <TopBar userId={userId} userName={userName} userImage={userImage} />

      {/* Category strip */}
      <div className="fixed top-14 inset-x-0 z-40 max-w-lg mx-auto">
        <div className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar"
          style={{ background: 'linear-gradient(to bottom, #050B18 70%, transparent)' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => switchCategory(cat)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-black transition-all duration-200 ${
                category === cat
                  ? 'bg-gradient-to-r from-[#E91E8C] to-[#7C3AED] text-white shadow-lg shadow-[#E91E8C]/30'
                  : 'bg-[#111E33] text-gray-500 hover:text-white border border-white/5'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Empty */}
      {articles.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
          <div className="text-6xl">📰</div>
          <h2 className="text-xl font-black text-white">No news yet</h2>
          <p className="text-gray-500 text-sm">Tap below to fetch latest news</p>
          <button onClick={() => fetch('/api/ingest?secret=aslnewz2026').then(() => fetchFresh(category))}
            className="btn-magenta px-6 py-3 text-sm font-bold">
            Fetch News Now
          </button>
        </div>
      )}

      {loading && articles.length === 0 && (
        <div className="flex justify-center items-center min-h-screen">
          <div className="w-10 h-10 rounded-full border-2 border-[#E91E8C] border-t-transparent animate-spin" />
        </div>
      )}

      {articles.length > 0 && (
        <div className="snap-feed">
          {articles.map((article, i) => (
            <div key={article.id} className="snap-card">
              <ArticleCard article={article} userId={userId} index={i} />
            </div>
          ))}
          <div ref={sentinelRef} className="h-2" />
          {loading && (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 rounded-full border-2 border-[#E91E8C] border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      )}

      <BottomNav userId={userId} active="feed" />
    </div>
  )
}
