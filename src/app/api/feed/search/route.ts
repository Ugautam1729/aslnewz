import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q') ?? ''
  if (!q.trim()) return NextResponse.json({ articles: [] })
  const articles = await prisma.article.findMany({
    where: { status:'ready', OR:[{ title:{ contains:q, mode:'insensitive' } }, { category:{ contains:q, mode:'insensitive' } }] },
    select: { id:true, title:true, summary:true, imageUrl:true, articleUrl:true, category:true, publishedAt:true, readTime:true, views:true, _count:{ select:{ comments:true, saves:true } } },
    orderBy: { publishedAt:'desc' }, take: 30,
  })
  return NextResponse.json({ articles: articles.map(a => ({ ...a, publishedAt: a.publishedAt.toISOString(), isSaved: false })) })
}
