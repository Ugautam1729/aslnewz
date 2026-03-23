import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export async function GET(req: NextRequest, { params }: { params: { friendId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ messages: [] })
  const userId = (session.user as any).id
  const friendId = params.friendId
  const messages = await prisma.message.findMany({
    where: { OR:[{ senderId:userId, receiverId:friendId },{ senderId:friendId, receiverId:userId }] },
    orderBy: { createdAt:'asc' }, take: 100,
  })
  await prisma.message.updateMany({ where:{ senderId:friendId, receiverId:userId, read:false }, data:{ read:true } })
  return NextResponse.json({ messages: messages.map(m => ({ ...m, createdAt:m.createdAt.toISOString() })) })
}
