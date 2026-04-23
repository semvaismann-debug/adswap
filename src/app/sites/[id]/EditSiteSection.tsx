'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, type Website } from '@/lib/types'
import { Pencil, Trash2, ChevronDown } from 'lucide-react'

export default function EditSiteSection({ site }: { site: Website }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: site.name,
    url: site.url,
    description: site.description ?? '',
    category: site.category,
    traffic: site.traffic ? String(site.traffic) : '',
    geo: site.geo ?? '',
    logo_url: site.logo_url ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let url = form.url.trim()
      if (!url.startsWith('http')) url = 'https://' + url
      const { error } = await supabase.from('websites').update({
        name: form.name.trim(),
        url,
        description: form.description.trim() || null,
        category: form.category,
        traffic: form.traffic ? parseInt(form.traffic) : null,
        geo: form.geo.trim() || null,
        logo_url: form.logo_url.trim() || null,
      }).eq('id', site.id)
      if (error) throw error
      router.refresh()
      setOpen(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Удалить сайт? Это действие нельзя отменить.')) return
    setDeleting(true)
    await supabase.from('websites').delete().eq('id', site.id)
    router.push('/dashboard')
  }

  return (
    <div className="card p-6">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-base font-semibold text-navy-900">
        <span className="flex items-center gap-2"><Pencil size={16} /> Редактировать сайт</span>
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <form onSubmit={handleUpdate} className="mt-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
              <input required type="text" value={form.name} onChange={e => set('name', e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input required type="text" value={form.url} onChange={e => set('url', e.target.value)} className="input-base" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} className="input-base resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="input-base bg-white">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Трафик/мес</label>
              <input type="number" value={form.traffic} onChange={e => set('traffic', e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Гео</label>
              <input type="text" value={form.geo} onChange={e => set('geo', e.target.value)} className="input-base" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL логотипа</label>
            <input type="url" value={form.logo_url} onChange={e => set('logo_url', e.target.value)} className="input-base" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-1.5 text-red-600 hover:text-red-700 text-sm font-medium border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
              <Trash2 size={14} /> {deleting ? 'Удаление...' : 'Удалить'}
            </button>
            <div className="flex-1" />
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary px-4 py-2 text-sm">Отмена</button>
            <button type="submit" disabled={loading} className="btn-primary px-4 py-2 text-sm">
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
