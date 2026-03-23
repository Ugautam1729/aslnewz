import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'
import { ProfileClient } from '@/components/auth/ProfileClient'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth')
  const userId = (session.user as any).id

  const [user, saves, commentCount, interests, friendCount, pendingCount, recentComments] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id:true, name:true, username:true, email:true, image:true, bio:true, createdAt:true } }),
    prisma.save.count({ where: { userId } }),
    prisma.comment.count({ where: { userId } }),
    prisma.userInterest.findMany({ where: { userId }, orderBy: { weight: 'desc' }, take: 5 }),
    prisma.friendship.count({ where: { OR: [{ userAId: userId }, { userBId: userId }] } }),
    prisma.friendRequest.count({ where: { receiverId: userId, status: 'pending' } }),
    prisma.comment.findMany({
      where: { userId },
      include: { article: { select: { id:true, title:true, imageUrl:true, category:true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  return (
    <div className="min-h-screen max-w-lg mx-auto pb-24">
      <TopBar userId={userId} userName={session.user.name ?? null} userImage={session.user.image ?? null} />
      <ProfileClient
        user={JSON.parse(JSON.stringify(user))}
        stats={{ saves, comments: commentCount, friends: friendCount }}
        interests={interests}
        pendingRequests={pendingCount}
        recentComments={JSON.parse(JSON.stringify(recentComments))}
      />
      <BottomNav userId={userId} active="profile" />
    </div>
  )
}
