import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ notifications: [] })
  const userId = (session.user as any).id
  const notifs = await prisma.notification.findMany({ where:{ userId }, orderBy:{ createdAt:'desc' }, take:50 })
  await prisma.notification.updateMany({ where:{ userId, read:false }, data:{ read:true } })
  return NextResponse.json({ notifications: notifs.map(n => ({ ...n, createdAt:n.createdAt.toISOString() })) })
}
