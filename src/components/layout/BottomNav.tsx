'use client'
import Link from 'next/link'
import { FiHome, FiBookmark, FiUser, FiSearch, FiUsers } from 'react-icons/fi'

interface Props { userId: string | null; active: string }
const NAV = [
  { key: 'feed',    href: '/feed',    Icon: FiHome,     label: 'Home' },
  { key: 'search',  href: '/search',  Icon: FiSearch,   label: 'Search' },
  { key: 'friends', href: '/friends', Icon: FiUsers,    label: 'Friends' },
  { key: 'saved',   href: '/saved',   Icon: FiBookmark, label: 'Saved' },
  { key: 'profile', href: '/profile', Icon: FiUser,     label: 'Profile' },
]

export function BottomNav({ userId, active }: Props) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 max-w-lg mx-auto">
      <div className="glass border-t border-[#E91E8C]/15 px-1 py-2">
        <div className="flex justify-around items-center">
          {NAV.map(({ key, href, Icon, label }) => {
            const link = (key !== 'feed' && key !== 'search') && !userId ? '/auth' : href
            const isActive = active === key
            return (
              <Link key={key} href={link} className="flex flex-col items-center gap-0.5 px-3 py-1 relative">
                {isActive && <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-gradient-to-r from-[#E91E8C] to-[#00E5FF]" />}
                <Icon size={21} className={isActive ? 'text-[#E91E8C]' : 'text-gray-500'} />
                <span className={`text-[9px] font-semibold ${isActive ? 'text-[#E91E8C]' : 'text-gray-600'}`}>{label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
