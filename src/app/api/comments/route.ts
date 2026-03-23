import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const articleId = new URL(req.url).searchParams.get('articleId')
  if (!articleId) return NextResponse.json({ comments: [] })
  const session = await getServerSession(authOptions)
  const userId  = (session?.user as any)?.id ?? null
  const comments = await prisma.comment.findMany({
    where: { articleId },
    include: { user:{ select:{ id:true, name:true, username:true, image:true } }, _count:{ select:{ likes:true } } },
    orderBy: { createdAt:'desc' }, take: 100,
  })
  let likedIds: string[] = []
  if (userId) {
    const likes = await prisma.commentLike.findMany({ where:{ userId, commentId:{ in: comments.map(c => c.id) } }, select:{ commentId:true } })
    likedIds = likes.map(l => l.commentId)
  }
  return NextResponse.json({ comments: comments.map(c => ({ ...c, createdAt:c.createdAt.toISOString(), updatedAt:c.updatedAt.toISOString(), likedByMe:likedIds.includes(c.id) })) })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  const userId = (session.user as any).id
  const { articleId, content, gifUrl } = await req.json()
  if (!articleId) return NextResponse.json({ error:'articleId required' }, { status:400 })
  if (!content?.trim() && !gifUrl) return NextResponse.json({ error:'content or gif required' }, { status:400 })
  const comment = await prisma.comment.create({
    data: { content: content?.trim() ?? '', gifUrl: gifUrl ?? null, articleId, userId },
    include: { user:{ select:{ id:true, name:true, username:true, image:true } }, _count:{ select:{ likes:true } } },
  })
  // Update interest
  const article = await prisma.article.findUnique({ where:{ id:articleId }, select:{ category:true } })
  if (article) {
    await prisma.userInterest.upsert({ where:{ userId_category:{ userId, category:article.category } }, update:{ weight:{ increment:0.05 } }, create:{ userId, category:article.category, weight:0.6 } }).catch(() => {})
  }
  return NextResponse.json({ comment:{ ...comment, createdAt:comment.createdAt.toISOString(), updatedAt:comment.updatedAt.toISOString(), likedByMe:false } }, { status:201 })
}
