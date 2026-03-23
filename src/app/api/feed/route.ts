import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cursor   = parseInt(searchParams.get('cursor') ?? '0')
  const limit    = parseInt(searchParams.get('limit')  ?? '20')
  const category = searchParams.get('category') ?? 'All'
  const session  = await getServerSession(authOptions)
  const userId   = (session?.user as any)?.id ?? null

  const where: any = { status: 'ready' }
  if (category !== 'All') where.category = category

  // Exclude seen articles
  if (userId) {
    const seen = await prisma.seenArticle.findMany({ where: { userId }, select: { articleId: true }, take: 500, orderBy: { seenAt: 'desc' } })
    if (seen.length > 0) where.id = { notIn: seen.map(s => s.articleId) }
  }

  // User interests for ML scoring
  const interests: Record<string,number> = {}
  if (userId) {
    const ui = await prisma.userInterest.findMany({ where: { userId } })
    ui.forEach(i => { interests[i.category] = i.weight })
  }

  const articles = await prisma.article.findMany({
    where,
    select: { id:true, title:true, summary:true, imageUrl:true, articleUrl:true, category:true, publishedAt:true, readTime:true, views:true, breaking:true, _count:{ select:{ comments:true, saves:true } } },
    orderBy: { publishedAt: 'desc' },
    take: limit * 3,
    skip: cursor,
  })

  // ML scoring
  const now = Date.now()
  const scored = articles.map(a => {
    const ageH   = (now - new Date(a.publishedAt).getTime()) / 3600000
    const rec    = Math.max(0, 1 - ageH / 72)
    const int    = interests[a.category] ?? 0.3
    const eng    = Math.min(1, (a._count.comments * 2 + a._count.saves) / 50)
    const brk    = a.breaking ? 0.3 : 0
    return { ...a, _score: rec * 0.4 + int * 0.35 + eng * 0.15 + brk + Math.random() * 0.1 }
  })
  scored.sort((a,b) => b._score - a._score)
  const result = scored.slice(0, limit)

  if (userId && result.length > 0) {
    await prisma.seenArticle.createMany({ data: result.map(a => ({ userId, articleId: a.id })), skipDuplicates: true }).catch(() => {})
  }

  let savedIds: string[] = []
  if (userId) {
    const saves = await prisma.save.findMany({ where: { userId, articleId: { in: result.map(a => a.id) } }, select: { articleId: true } })
    savedIds = saves.map(s => s.articleId)
  }

  return NextResponse.json({ articles: result.map(a => ({ ...a, publishedAt: new Date(a.publishedAt).toISOString(), isSaved: savedIds.includes(a.id) })) })
}
