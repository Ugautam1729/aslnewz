import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ friends: [] })
  const userId = (session.user as any).id
  const friendships = await prisma.friendship.findMany({
    where:{ OR:[{ userAId:userId },{ userBId:userId }] },
    include: { userA:{ select:{ id:true, name:true, username:true, image:true } }, userB:{ select:{ id:true, name:true, username:true, image:true } } },
  })
  const friends = friendships.map(f => f.userAId === userId ? f.userB : f.userA)
  return NextResponse.json({ friends })
}
