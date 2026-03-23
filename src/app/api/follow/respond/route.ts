import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  const userId = (session.user as any).id
  const { requestId, accept } = await req.json()
  const request = await prisma.friendRequest.findUnique({ where:{ id:requestId } })
  if (!request || request.receiverId !== userId) return NextResponse.json({ error:'Not found' }, { status:404 })
  await prisma.friendRequest.update({ where:{ id:requestId }, data:{ status: accept ? 'accepted' : 'rejected' } })
  if (accept) await prisma.friendship.create({ data:{ userAId:request.senderId, userBId:userId } })
  return NextResponse.json({ success:true })
}
