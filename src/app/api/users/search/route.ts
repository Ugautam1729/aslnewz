import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q') ?? ''
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id ?? null
  if (!q.trim()) return NextResponse.json({ users: [] })
  const users = await prisma.user.findMany({
    where: { OR:[{ name:{ contains:q, mode:'insensitive' } },{ username:{ contains:q, mode:'insensitive' } }], NOT:{ id: userId ?? '' } },
    select: { id:true, name:true, username:true, image:true }, take: 20,
  })
  let enriched: any[] = users
  if (userId) {
    const [reqs, friends] = await Promise.all([
      prisma.friendRequest.findMany({ where:{ OR:[{ senderId:userId },{ receiverId:userId }] }, select:{ senderId:true, receiverId:true, status:true } }),
      prisma.friendship.findMany({ where:{ OR:[{ userAId:userId },{ userBId:userId }] }, select:{ userAId:true, userBId:true } }),
    ])
    enriched = users.map(u => {
      if (friends.some(f => f.userAId === u.id || f.userBId === u.id)) return { ...u, friendStatus:'friends' }
      const req = reqs.find(r => (r.senderId === userId && r.receiverId === u.id) || (r.senderId === u.id && r.receiverId === userId))
      if (req?.senderId === userId) return { ...u, friendStatus:'pending_sent' }
      if (req?.receiverId === userId) return { ...u, friendStatus:'pending_received' }
      return { ...u, friendStatus:'none' }
    })
  }
  return NextResponse.json({ users: enriched })
}
