import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  const userId = (session.user as any).id
  const { commentId } = await req.json()
  const existing = await prisma.commentLike.findUnique({ where:{ userId_commentId:{ userId, commentId } } })
  if (existing) { await prisma.commentLike.delete({ where:{ userId_commentId:{ userId, commentId } } }); return NextResponse.json({ liked:false }) }
  await prisma.commentLike.create({ data:{ userId, commentId } })
  const comment = await prisma.comment.findUnique({ where:{ id:commentId }, select:{ userId:true } })
  if (comment && comment.userId !== userId) {
    const liker = await prisma.user.findUnique({ where:{ id:userId }, select:{ name:true } })
    await prisma.notification.create({ data:{ userId:comment.userId, type:'comment_like', title:'❤️ Someone liked your comment', body:`${liker?.name ?? 'Someone'} liked your comment`, link:'/feed' } }).catch(() => {})
  }
  return NextResponse.json({ liked:true })
}
