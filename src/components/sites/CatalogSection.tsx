'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import SiteCard from './SiteCard'
import { CATEGORIES, type Website } from '@/lib/types'
import { Search, ChevronDown, X, Check } from 'lucide-react'

const PAGE_SIZE = 12

export default function CatalogSection({ initialSites }: { initialSites: Website[] }) {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const countByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    initialSites.forEach(s => { map[s.category] = (map[s.category] ?? 0) + 1 })
    return map
  }, [initialSites])

  const filtered = useMemo(() => {
    let list = [...initialSites]
    if (q) {
      const lq = q.toLowerCase()
      list = list.filter(s =>
        s.name.toLowerCase().includes(lq) ||
        s.url.toLowerCase().includes(lq) ||
        (s.description ?? '').toLowerCase().includes(lq)
      )
    }
    if (category) list = list.filter(s => s.category === category)
    return list
  }, [initialSites, q, category])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleCategory = (cat: string) => { setCategory(cat); setPage(1); setSortOpen(false) }

  const activeCategoryLabel = CATEGORIES.find(c => c.value === category)?.label

  return (
    <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Search */}
      <div className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1) }}
            placeholder="Поиск по названию, URL или описанию..."
            className="input-base pl-9 h-11"
          />
        </div>
        {q && (
          <button
            onClick={() => { setQ(''); setPage(1) }}
            className="btn-secondary h-11 px-4 text-sm"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Results header + dropdown */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 flex-wrap min-w-0">
          {category ? (
            <>
              <span className="text-gray-500 font-normal text-base hidden sm:inline">Категория:</span>
              <span>{activeCategoryLabel}</span>
              <button
                onClick={() => handleCategory('')}
                className="flex items-center gap-1 text-sm font-normal text-gray-400 hover:text-red-500 transition-colors"
                title="Сбросить"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <span>{q ? 'Результаты поиска' : 'Все сайты'}</span>
          )}
          <span className="text-sm font-normal text-gray-400">({filtered.length})</span>
        </h2>

        {/* Category dropdown */}
        <div ref={sortRef} className="relative flex-shrink-0">
          <button
            onClick={() => setSortOpen(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all shadow-sm ${
              sortOpen
                ? 'bg-navy-900 text-white border-navy-900 shadow-md'
                : 'bg-white text-gray-700 border-gray-300 hover:border-navy-400 hover:text-navy-900 hover:shadow'
            }`}
          >
            <span>{activeCategoryLabel ?? 'Все категории'}</span>
            <ChevronDown size={15} className={`transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} />
          </button>

          {sortOpen && (
            <div className="absolute right-0 top-full mt-2 z-30 w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
              <button
                onClick={() => handleCategory('')}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  !category ? 'bg-navy-900 text-white font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>Все категории</span>
                <span className={`text-xs rounded-full px-2 py-0.5 font-normal ${!category ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {initialSites.length}
                </span>
              </button>

              <div className="h-px bg-gray-100 mx-3" />

              {CATEGORIES.map(cat => {
                const count = countByCategory[cat.value] ?? 0
                if (count === 0) return null
                const isActive = category === cat.value
                return (
                  <button
                    key={cat.value}
                    onClick={() => handleCategory(cat.value)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                      isActive ? 'bg-navy-900 text-white font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isActive && <Check size={13} />}
                      {cat.label}
                    </span>
                    <span className={`text-xs rounded-full px-2 py-0.5 font-normal ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      {paginated.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.map(site => <SiteCard key={site.id} site={site} />)}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <Search size={40} className="mx-auto mb-4 opacity-30" />
          {initialSites.length === 0 ? (
            <>
              <p className="text-lg font-medium text-gray-600">Каталог пока пуст</p>
              <p className="text-sm mt-1">Станьте первым — добавьте свой сайт</p>
              <a href="/sites/add" className="btn-primary mt-4 inline-block">Добавить сайт</a>
            </>
          ) : (
            <>
              <p className="text-lg font-medium">Ничего не найдено</p>
              <p className="text-sm mt-1">Попробуйте изменить запрос или убрать фильтр</p>
              <button onClick={() => { setQ(''); setCategory(''); setPage(1) }} className="btn-primary mt-4">
                Сбросить фильтры
              </button>
            </>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {page > 1 && (
            <button onClick={() => setPage(p => p - 1)} className="btn-secondary px-4 py-2 text-sm">← Назад</button>
          )}
          <span className="flex items-center px-4 py-2 text-sm text-gray-500">{page} / {totalPages}</span>
          {page < totalPages && (
            <button onClick={() => setPage(p => p + 1)} className="btn-secondary px-4 py-2 text-sm">Вперёд →</button>
          )}
        </div>
      )}
    </section>
  )
}
