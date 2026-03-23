import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  const senderId = (session.user as any).id
  const { receiverId, content, articleId, articleTitle, articleImage } = await req.json()
  if (!receiverId) return NextResponse.json({ error:'receiverId required' }, { status:400 })
  const msg = await prisma.message.create({ data:{ senderId, receiverId, content: content ?? null, articleId: articleId ?? null, articleTitle: articleTitle ?? null, articleImage: articleImage ?? null } })
  if (articleId) {
    const sender = await prisma.user.findUnique({ where:{ id:senderId }, select:{ name:true } })
    await prisma.notification.create({ data:{ userId:receiverId, type:'comment_reply', title:'📰 Article Shared', body:`${sender?.name ?? 'Someone'} shared an article with you`, link:`/chat/${senderId}` } }).catch(() => {})
  }
  return NextResponse.json({ message:{ ...msg, createdAt:msg.createdAt.toISOString() } })
}
