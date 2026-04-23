import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Globe, Plus, HandshakeIcon, Clock, ArrowRight } from 'lucide-react'
import type { Website, Deal } from '@/lib/types'

function DealStatusBadge({ status }: { status: string }) {
  const map = {
    negotiating: { label: 'Обсуждается', color: 'bg-yellow-100 text-yellow-700' },
    agreed:      { label: 'Договорились', color: 'bg-blue-100 text-blue-700' },
    done:        { label: 'Завершено', color: 'bg-green-100 text-green-700' },
  } as const
  const { label, color } = map[status as keyof typeof map] ?? { label: status, color: 'bg-gray-100 text-gray-700' }
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{label}</span>
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: profile }, { data: mySites }, { data: myDeals }, { data: incomingDeals }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('websites').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
    supabase
      .from('deals')
      .select('*, site_from:websites!deals_website_from_fkey(id,name,url), site_to:websites!deals_website_to_fkey(id,name,url)')
      .or(`initiator_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('deals')
      .select('*, site_from:websites!deals_website_from_fkey(id,name,url), site_to:websites!deals_website_to_fkey(id,name,url), initiator:profiles!deals_initiator_id_fkey(full_name)')
      .eq('receiver_id', user.id)
      .eq('status', 'negotiating')
      .order('created_at', { ascending: false }),
  ])

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Пользователь'
  const doneCount = (myDeals ?? []).filter(d => d.status === 'done').length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Привет, {displayName}!</h1>
          <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
        </div>
        <Link href="/sites/add" className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          <span className="hidden sm:inline">Добавить сайт</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="text-3xl font-bold text-navy-900">{mySites?.length ?? 0}</div>
          <div className="text-sm text-gray-500">Моих сайтов</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-bold text-navy-900">{myDeals?.length ?? 0}</div>
          <div className="text-sm text-gray-500">Всего сделок</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-bold text-yellow-600">{incomingDeals?.length ?? 0}</div>
          <div className="text-sm text-gray-500">Входящих предложений</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-bold text-green-600">{doneCount}</div>
          <div className="text-sm text-gray-500">Завершено</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My sites */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy-900 flex items-center gap-2">
              <Globe size={18} /> Мои сайты
            </h2>
            <Link href="/sites/add" className="text-sm text-blue-600 hover:text-blue-700">+ Добавить</Link>
          </div>
          {mySites && mySites.length > 0 ? (
            <div className="flex flex-col gap-2">
              {mySites.map((site: Website) => (
                <Link key={site.id} href={`/sites/${site.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-navy-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {site.logo_url
                      ? <Image src={site.logo_url} alt={site.name} width={36} height={36} className="object-contain" />
                      : <Globe size={16} className="text-navy-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-navy-900 text-sm truncate">{site.name}</p>
                    <p className="text-xs text-gray-400 truncate">{site.url}</p>
                  </div>
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Globe size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">У вас ещё нет сайтов</p>
              <Link href="/sites/add" className="btn-primary mt-3 text-sm inline-block">Добавить первый сайт</Link>
            </div>
          )}
        </div>

        {/* Incoming deals */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy-900 flex items-center gap-2">
              <Clock size={18} />
              Входящие предложения
              {(incomingDeals?.length ?? 0) > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5">{incomingDeals?.length}</span>
              )}
            </h2>
            <Link href="/deals" className="text-sm text-blue-600 hover:text-blue-700">Все сделки</Link>
          </div>
          {incomingDeals && incomingDeals.length > 0 ? (
            <div className="flex flex-col gap-3">
              {incomingDeals.map((deal: Deal & { initiator?: { full_name: string } }) => (
                <Link key={deal.id} href={`/deals/${deal.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-yellow-100 bg-yellow-50 hover:bg-yellow-100 transition-colors group">
                  <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-sm flex-shrink-0">
                    {(deal.initiator as { full_name: string } | undefined)?.full_name?.[0] ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-900">
                      {(deal.initiator as { full_name: string } | undefined)?.full_name ?? 'Пользователь'} предлагает обмен
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {(deal.site_from as { name: string } | null)?.name} ↔ {(deal.site_to as { name: string } | null)?.name}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <HandshakeIcon size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Новых предложений нет</p>
              <Link href="/" className="text-blue-600 text-sm hover:underline mt-1 inline-block">Найти партнёров</Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent deals table */}
      {myDeals && myDeals.length > 0 && (
        <div className="card p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy-900">Последние сделки</h2>
            <Link href="/deals" className="text-sm text-blue-600 hover:text-blue-700">Все сделки →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium pr-4">Сайт от</th>
                  <th className="pb-2 font-medium pr-4">Сайт кому</th>
                  <th className="pb-2 font-medium pr-4">Статус</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {myDeals.map((deal: Deal) => (
                  <tr key={deal.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-navy-900 truncate max-w-[150px]">
                      {(deal.site_from as { name: string } | null)?.name ?? '—'}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 truncate max-w-[150px]">
                      {(deal.site_to as { name: string } | null)?.name ?? '—'}
                    </td>
                    <td className="py-3 pr-4"><DealStatusBadge status={deal.status} /></td>
                    <td className="py-3 text-right">
                      <Link href={`/deals/${deal.id}`} className="text-blue-600 hover:text-blue-700 text-xs">Открыть →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
