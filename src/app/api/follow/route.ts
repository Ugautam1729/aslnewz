import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  const senderId = (session.user as any).id
  const { toId } = await req.json()
  if (senderId === toId) return NextResponse.json({ error:'Cannot add yourself' }, { status:400 })
  const alreadyFriends = await prisma.friendship.findFirst({ where:{ OR:[{ userAId:senderId, userBId:toId },{ userAId:toId, userBId:senderId }] } })
  if (alreadyFriends) return NextResponse.json({ error:'Already friends' }, { status:409 })
  const existing = await prisma.friendRequest.findFirst({ where:{ OR:[{ senderId, receiverId:toId },{ senderId:toId, receiverId:senderId }] } })
  if (existing) return NextResponse.json({ error:'Request already exists' }, { status:409 })
  await prisma.friendRequest.create({ data:{ senderId, receiverId:toId } })
  const sender = await prisma.user.findUnique({ where:{ id:senderId }, select:{ name:true } })
  await prisma.notification.create({ data:{ userId:toId, type:'friend_request', title:'🤝 Friend Request', body:`${sender?.name ?? 'Someone'} wants to be your friend`, link:'/friends' } }).catch(() => {})
  return NextResponse.json({ sent:true })
}
