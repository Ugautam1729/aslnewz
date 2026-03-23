import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { slugify } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json()
  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: 'Password must be 6+ characters' }, { status: 400 })
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  const hashed = await bcrypt.hash(password, 12)
  const username = slugify(name || email.split('@')[0])
  const user = await prisma.user.create({ data: { name: name || email.split('@')[0], email, password: hashed, username } })
  return NextResponse.json({ id: user.id }, { status: 201 })
}
