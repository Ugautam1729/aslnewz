import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FeedClient } from '@/components/feed/FeedClient'

export const dynamic = 'force-dynamic'

export default async function FeedPage({ searchParams }: { searchParams: { category?: string } }) {
  const session  = await getServerSession(authOptions)
  const userId   = (session?.user as any)?.id ?? null
  const category = searchParams.category ?? 'All'
  const where: any = { status: 'ready' }
  if (category !== 'All') where.category = category

  const articles = await prisma.article.findMany({
    where,
    select: { id:true, title:true, summary:true, imageUrl:true, articleUrl:true, category:true, publishedAt:true, readTime:true, views:true, breaking:true, _count:{ select:{ comments:true, saves:true } } },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  })

  let savedIds: string[] = []
  if (userId) {
    const saves = await prisma.save.findMany({ where: { userId, articleId: { in: articles.map(a => a.id) } }, select: { articleId:true } })
    savedIds = saves.map(s => s.articleId)
  }

  return (
    <FeedClient
      initialArticles={articles.map(a => ({ ...a, publishedAt: a.publishedAt.toISOString(), isSaved: savedIds.includes(a.id) }))}
      userId={userId}
      userName={session?.user?.name ?? null}
      userImage={session?.user?.image ?? null}
      initialCategory={category}
    />
  )
}
