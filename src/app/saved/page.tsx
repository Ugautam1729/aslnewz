import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'
import { SavedArticleCard } from '@/components/feed/SavedArticleCard'

export const dynamic = 'force-dynamic'

export default async function SavedPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth')
  const userId = (session.user as any).id

  const saves = await prisma.save.findMany({
    where: { userId },
    include: { article: { select: { id:true, title:true, summary:true, imageUrl:true, articleUrl:true, category:true, publishedAt:true, readTime:true, views:true, _count:{ select:{ comments:true, saves:true } } } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen max-w-lg mx-auto pb-24">
      <TopBar userId={userId} userName={session.user.name ?? null} userImage={session.user.image ?? null} />
      <div className="pt-16 px-4">
        <h1 className="text-xl font-black text-white mt-3 mb-5">Saved</h1>
        {saves.length === 0 ? (
          <div className="text-center py-20"><div className="text-5xl mb-4">🔖</div><p className="text-white font-bold">Nothing saved yet</p><p className="text-gray-600 text-sm mt-1">Tap bookmark on any article</p></div>
        ) : (
          <div className="space-y-3">
            {saves.map(s => <SavedArticleCard key={s.id} article={{ ...s.article, publishedAt: s.article.publishedAt.toISOString(), isSaved: true }} />)}
          </div>
        )}
      </div>
      <BottomNav userId={userId} active="saved" />
    </div>
  )
}
