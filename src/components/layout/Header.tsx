'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { Zap, Menu, X } from 'lucide-react'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [pendingDeals, setPendingDeals] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) { setPendingDeals(0); return }
    supabase
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('status', 'negotiating')
      .then(({ count }) => setPendingDeals(count ?? 0))
  }, [user])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-navy-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Zap size={22} className="text-blue-400" />
            AdSwap
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">Каталог</Link>
            {user && (
              <>
                <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">Дашборд</Link>
                <Link href="/deals" className="relative text-gray-300 hover:text-white transition-colors">
                  Сделки
                  {pendingDeals > 0 && (
                    <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {pendingDeals}
                    </span>
                  )}
                </Link>
                <Link href="/sites/add" className="btn-primary text-sm py-1.5 px-3">+ Добавить сайт</Link>
                <button onClick={handleSignOut} className="text-gray-400 hover:text-white text-sm transition-colors">Выйти</button>
              </>
            )}
            {!user && (
              <Link href="/auth" className="btn-primary text-sm py-1.5 px-3">Войти</Link>
            )}
          </nav>

          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-navy-950 border-t border-navy-800 px-4 py-4 flex flex-col gap-4 text-sm">
          <Link href="/" onClick={() => setMenuOpen(false)} className="text-gray-300">Каталог</Link>
          {user && (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="text-gray-300">Дашборд</Link>
              <Link href="/deals" onClick={() => setMenuOpen(false)} className="text-gray-300 flex items-center gap-2">
                Сделки {pendingDeals > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-1.5">{pendingDeals}</span>}
              </Link>
              <Link href="/sites/add" onClick={() => setMenuOpen(false)} className="text-gray-300">+ Добавить сайт</Link>
              <button onClick={handleSignOut} className="text-gray-400 text-left">Выйти</button>
            </>
          )}
          {!user && <Link href="/auth" onClick={() => setMenuOpen(false)} className="text-blue-400">Войти / Зарегистрироваться</Link>}
        </div>
      )}
    </header>
  )
}
