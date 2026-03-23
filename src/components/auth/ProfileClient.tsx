'use client'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { FiBookmark, FiMessageCircle, FiLogOut, FiUsers, FiBell } from 'react-icons/fi'
import { BsStars } from 'react-icons/bs'
import { CAT_CLASS } from '@/types'
import { timeAgo } from '@/lib/utils'
import Link from 'next/link'

interface Props {
  user: { id:string; name:string|null; username:string|null; email:string; image:string|null; bio:string|null; createdAt:string }
  stats: { saves:number; comments:number; friends:number }
  interests: { category:string; weight:number }[]
  pendingRequests: number
  recentComments: any[]
}

export function ProfileClient({ user, stats, interests, pendingRequests, recentComments }: Props) {
  const [tab, setTab] = useState<'interests' | 'comments'>('interests')
  const joined = new Date(user.createdAt).toLocaleDateString('en-IN', { month:'long', year:'numeric' })

  return (
    <div className="pt-16 px-4">
      {/* Avatar */}
      <div className="flex flex-col items-center py-6">
        <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-[#111E33] mb-3"
          style={{ border: '3px solid transparent', background: 'linear-gradient(#111E33,#111E33) padding-box, linear-gradient(135deg,#E91E8C,#00E5FF) border-box' }}>
          {user.image ? <img src={user.image} alt="" className="w-full h-full object-cover" /> : <span className="text-4xl font-black gradient-text">{(user.name ?? 'U')[0].toUpperCase()}</span>}
        </div>
        <h2 className="text-white font-black text-xl">{user.name ?? 'Reader'}</h2>
        {user.username && <p className="text-[#E91E8C] text-sm font-semibold">@{user.username}</p>}
        <p className="text-gray-600 text-xs mt-1">Joined {joined}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label:'Saved',   value:stats.saves,    color:'#E91E8C', Icon:FiBookmark,     href:'/saved' },
          { label:'Friends', value:stats.friends,  color:'#00E5FF', Icon:FiUsers,        href:'/friends' },
          { label:'Comments',value:stats.comments, color:'#7C3AED', Icon:FiMessageCircle, href:null },
        ].map(({ label, value, color, Icon, href }) => {
          const inner = (
            <div className="bg-[#0D1626] rounded-2xl p-3.5 text-center border border-white/5">
              <Icon size={18} className="mx-auto mb-1.5" style={{ color }} />
              <div className="text-2xl font-black text-white">{value}</div>
              <div className="text-gray-600 text-[10px] font-semibold mt-0.5">{label}</div>
            </div>
          )
          return href ? <Link key={label} href={href}>{inner}</Link> : <div key={label}>{inner}</div>
        })}
      </div>

      {/* Pending requests */}
      {pendingRequests > 0 && (
        <Link href="/friends" className="flex items-center gap-3 p-4 rounded-2xl mb-4 border border-[#E91E8C]/30 bg-[#E91E8C]/8">
          <FiBell size={16} className="text-[#E91E8C]" />
          <p className="text-white font-bold text-sm flex-1">{pendingRequests} Friend Request{pendingRequests > 1 ? 's' : ''}</p>
          <div className="w-5 h-5 rounded-full bg-[#E91E8C] flex items-center justify-center"><span className="text-white text-[10px] font-black">{pendingRequests}</span></div>
        </Link>
      )}

      {/* Tabs */}
      <div className="flex bg-[#0D1626] rounded-2xl p-1 mb-4">
        {(['interests','comments'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all capitalize ${tab === t ? 'bg-gradient-to-r from-[#E91E8C] to-[#7C3AED] text-white' : 'text-gray-500'}`}>
            {t === 'interests' ? '⭐ Interests' : '💬 My Comments'}
          </button>
        ))}
      </div>

      {/* Interests */}
      {tab === 'interests' && (
        <div className="bg-[#0D1626] rounded-2xl p-4 mb-4 border border-white/5">
          {interests.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Read articles to build your interests</p>}
          <div className="space-y-2.5">
            {interests.map(i => (
              <div key={i.category} className="flex items-center gap-3">
                <span className="text-gray-300 text-xs w-24 font-semibold">{i.category}</span>
                <div className="flex-1 h-1.5 bg-[#111E33] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width:`${i.weight*100}%`, background:'linear-gradient(to right,#E91E8C,#7C3AED)' }} />
                </div>
                <span className="text-gray-600 text-[10px] w-8 text-right">{Math.round(i.weight*100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comment history */}
      {tab === 'comments' && (
        <div className="space-y-3 mb-4">
          {recentComments.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No comments yet</p>}
          {recentComments.map((c: any) => (
            <div key={c.id} className="bg-[#0D1626] rounded-2xl p-3 border border-white/5">
              <div className="flex gap-2 mb-2">
                {c.article.imageUrl && <img src={c.article.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <span className={`cat-pill ${CAT_CLASS[c.article.category] ?? 'cat-general'} mb-1 inline-block`}>{c.article.category}</span>
                  <p className="text-white text-xs font-semibold line-clamp-1">{c.article.title}</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm bg-[#111E33] rounded-xl px-3 py-2">{c.content}</p>
              <p className="text-gray-600 text-[10px] mt-1.5">{timeAgo(c.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => signOut({ callbackUrl:'/feed' })}
        className="w-full flex items-center justify-center gap-2 text-red-400 bg-red-500/8 border border-red-500/20 py-3.5 rounded-2xl text-sm font-bold mb-4">
        <FiLogOut size={16} /> Sign Out
      </button>
    </div>
  )
}
