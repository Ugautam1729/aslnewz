import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'
import { FiBell, FiHeart, FiUserPlus, FiMessageCircle, FiAlertCircle } from 'react-icons/fi'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function ago(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'just now'; if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`
}
const ICONS: any = { friend_request: FiUserPlus, comment_like: FiHeart, comment_reply: FiMessageCircle, breaking_news: FiAlertCircle }
const COLORS: any = { friend_request:'#00E5FF', comment_like:'#E91E8C', comment_reply:'#7C3AED', breaking_news:'#EF4444' }

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth')
  const userId = (session.user as any).id

  const notifs = await prisma.notification.findMany({ where:{ userId }, orderBy:{ createdAt:'desc' }, take:50 })
  await prisma.notification.updateMany({ where:{ userId, read:false }, data:{ read:true } })

  return (
    <div className="min-h-screen max-w-lg mx-auto pb-24">
      <TopBar userId={userId} userName={session.user.name ?? null} userImage={session.user.image ?? null} />
      <div className="pt-16 px-4">
        <h1 className="text-xl font-black text-white mt-3 mb-5">Notifications</h1>
        {notifs.length === 0 && <div className="text-center py-20"><FiBell size={48} className="text-gray-700 mx-auto mb-4" /><p className="text-white font-bold">All caught up!</p></div>}
        <div className="space-y-2">
          {notifs.map(n => {
            const Icon = ICONS[n.type] ?? FiBell; const color = COLORS[n.type] ?? '#E91E8C'
            const inner = (
              <div className={`flex items-start gap-3 p-4 rounded-2xl border ${!n.read ? 'bg-[#0D1626] border-[#E91E8C]/20' : 'bg-[#0A0E1A] border-white/5'}`}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:`${color}20` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{n.title}</p>
                  <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-gray-600 text-[10px] mt-1">{ago(n.createdAt)}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-[#E91E8C] flex-shrink-0 mt-1" />}
              </div>
            )
            return n.link ? <Link key={n.id} href={n.link}>{inner}</Link> : <div key={n.id}>{inner}</div>
          })}
        </div>
      </div>
      <BottomNav userId={userId} active="notifications" />
    </div>
  )
}
