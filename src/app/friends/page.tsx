import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'
import { FriendsClient } from '@/components/auth/FriendsClient'

export const dynamic = 'force-dynamic'

export default async function FriendsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth')
  const userId = (session.user as any).id

  const [requests, friendships] = await Promise.all([
    prisma.friendRequest.findMany({
      where: { receiverId: userId, status: 'pending' },
      include: { sender: { select: { id:true, name:true, username:true, image:true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: { select: { id:true, name:true, username:true, image:true } },
        userB: { select: { id:true, name:true, username:true, image:true } },
      },
    }),
  ])

  const friends = friendships.map(f => f.userAId === userId ? f.userB : f.userA)

  return (
    <div className="min-h-screen max-w-lg mx-auto pb-24">
      <TopBar userId={userId} userName={session.user.name ?? null} userImage={session.user.image ?? null} />
      <FriendsClient userId={userId} requests={JSON.parse(JSON.stringify(requests))} friends={JSON.parse(JSON.stringify(friends))} />
      <BottomNav userId={userId} active="friends" />
    </div>
  )
}
