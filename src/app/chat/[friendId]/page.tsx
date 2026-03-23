import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ChatWindow } from '@/components/chat/ChatWindow'

export const dynamic = 'force-dynamic'

export default async function ChatPage({ params }: { params: { friendId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth')
  const userId   = (session.user as any).id
  const friendId = params.friendId

  // Verify friendship
  const friendship = await prisma.friendship.findFirst({
    where: { OR: [{ userAId: userId, userBId: friendId }, { userAId: friendId, userBId: userId }] },
  })
  if (!friendship) redirect('/friends')

  const friend = await prisma.user.findUnique({
    where: { id: friendId },
    select: { id:true, name:true, username:true, image:true },
  })
  if (!friend) redirect('/friends')

  return <ChatWindow friend={JSON.parse(JSON.stringify(friend))} currentUserId={userId} />
}
