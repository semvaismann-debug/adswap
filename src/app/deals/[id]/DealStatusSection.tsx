'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Clock, PartyPopper, ChevronDown } from 'lucide-react'
import type { DealStatus } from '@/lib/types'

const STATUS_INFO = {
  negotiating: { label: 'Обсуждается',  color: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: Clock },
  agreed:      { label: 'Договорились', color: 'text-blue-700 bg-blue-50 border-blue-200',       icon: CheckCircle },
  done:        { label: 'Завершено',    color: 'text-green-700 bg-green-50 border-green-200',    icon: PartyPopper },
}

export default function DealStatusSection({ dealId, status }: { dealId: string; status: DealStatus }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const info = STATUS_INFO[status]
  const Icon = info.icon

  const update = async (newStatus: DealStatus) => {
    setLoading(true)
    await supabase.from('deals').update({ status: newStatus }).eq('id', dealId)
    router.refresh()
    setLoading(false)
    setOpen(false)
  }

  return (
    <div className={`rounded-xl border p-4 mb-5 ${info.color}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={18} />
          <span className="font-medium text-sm">Статус: {info.label}</span>
        </div>
        {status !== 'done' && (
          <button onClick={() => setOpen(!open)}
            className="text-xs font-medium underline underline-offset-2 flex items-center gap-1 opacity-70 hover:opacity-100">
            Изменить <ChevronDown size={12} className={open ? 'rotate-180' : ''} />
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-current/20 flex flex-col sm:flex-row gap-2">
          {status === 'negotiating' && (
            <button onClick={() => update('agreed')} disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
              <CheckCircle size={14} /> Подтвердить договорённость
            </button>
          )}
          {status === 'agreed' && (
            <button onClick={() => update('done')} disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
              <PartyPopper size={14} /> Отметить как выполненное
            </button>
          )}
          <button onClick={() => setOpen(false)}
            className="sm:w-auto text-sm px-3 py-2 rounded-lg border border-current/30 hover:bg-current/10 transition-colors">
            Отмена
          </button>
        </div>
      )}
    </div>
  )
}
