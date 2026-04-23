'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { HandshakeIcon, ChevronDown } from 'lucide-react'
import Link from 'next/link'

type Props = {
  siteId: string
  siteName: string
  mySites: { id: string; name: string }[]
  userId: string
  receiverId: string
}

export default function ProposeDealButton({ siteId, siteName, mySites, userId, receiverId }: Props) {
  const [selectedSite, setSelectedSite] = useState(mySites[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  if (mySites.length === 0) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-3">У вас нет сайтов. Добавьте сайт, чтобы предложить обмен.</p>
        <Link href="/sites/add" className="btn-primary w-full inline-block text-center py-2.5 text-sm">
          + Добавить сайт
        </Link>
      </div>
    )
  }

  const handlePropose = async () => {
    if (!selectedSite) return
    setError('')
    setLoading(true)
    try {
      const { data: existing } = await supabase
        .from('deals')
        .select('id')
        .eq('initiator_id', userId)
        .eq('website_from', selectedSite)
        .eq('website_to', siteId)
        .single()

      if (existing) { router.push(`/deals/${existing.id}`); return }

      const { data: deal, error: dealError } = await supabase
        .from('deals')
        .insert({
          initiator_id: userId,
          receiver_id: receiverId,
          website_from: selectedSite,
          website_to: siteId,
          status: 'negotiating',
        })
        .select('id')
        .single()

      if (dealError) throw dealError
      setSuccess(true)
      setTimeout(() => router.push(`/deals/${deal.id}`), 800)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка создания сделки')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return <div className="text-center py-3 text-green-600 text-sm font-medium">Предложение отправлено! Переходим к чату...</div>
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-gray-700">Предложить обмен рекламой</p>
      <div className="relative">
        <select value={selectedSite} onChange={e => setSelectedSite(e.target.value)}
          className="input-base bg-white appearance-none pr-8">
          {mySites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
      <p className="text-xs text-gray-400">Ваш сайт ↔ {siteName}</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button onClick={handlePropose} disabled={loading || !selectedSite}
        className="btn-primary flex items-center justify-center gap-2 py-2.5">
        <HandshakeIcon size={16} />
        {loading ? 'Отправка...' : 'Предложить обмен'}
      </button>
    </div>
  )
}
