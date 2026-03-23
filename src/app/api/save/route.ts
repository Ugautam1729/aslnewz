import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  const userId = (session.user as any).id
  const { articleId } = await req.json()
  await prisma.save.upsert({ where:{ userId_articleId:{ userId, articleId } }, update:{}, create:{ userId, articleId } })
  return NextResponse.json({ saved:true })
}
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  const userId = (session.user as any).id
  const { articleId } = await req.json()
  await prisma.save.deleteMany({ where:{ userId, articleId } })
  return NextResponse.json({ saved:false })
}
