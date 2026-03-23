'use client'
import Link from 'next/link'
import { FiSearch, FiBell } from 'react-icons/fi'
import { RiNewspaperLine } from 'react-icons/ri'
import { useEffect, useState } from 'react'

interface Props { userId: string | null; userName: string | null; userImage: string | null }

export function TopBar({ userId, userName, userImage }: Props) {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!userId) return
    fetch('/api/notifications/unread').then(r => r.json()).then(d => setUnread(d.count ?? 0)).catch(() => {})
    const t = setInterval(() => {
      fetch('/api/notifications/unread').then(r => r.json()).then(d => setUnread(d.count ?? 0)).catch(() => {})
    }, 30000)
    return () => clearInterval(t)
  }, [userId])

  return (
    <div className="fixed top-0 inset-x-0 z-50 max-w-lg mx-auto">
      <div className="top-gradient px-4 pt-3 pb-2 flex items-center justify-between">
        <Link href="/feed" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#E91E8C] to-[#7C3AED] flex items-center justify-center">
            <RiNewspaperLine size={15} className="text-white" />
          </div>
          <span className="font-black text-lg tracking-tight text-white">
            Asli<span className="text-[#E91E8C]">Newz</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/search"><FiSearch size={20} className="text-gray-400" /></Link>
          {userId && (
            <Link href="/notifications" className="relative">
              <FiBell size={20} className="text-gray-400" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E91E8C] rounded-full text-[9px] font-black text-white flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          )}
          {userId ? (
            <Link href="/profile">
              <div className="w-7 h-7 rounded-full border-2 border-[#E91E8C]/60 overflow-hidden flex items-center justify-center bg-[#0D1626]">
                {userImage ? <img src={userImage} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-black gradient-text">{userName?.[0]?.toUpperCase() ?? 'U'}</span>}
              </div>
            </Link>
          ) : (
            <Link href="/auth" className="text-xs btn-magenta px-3 py-1.5">Sign In</Link>
          )}
        </div>
      </div>
    </div>
  )
}
