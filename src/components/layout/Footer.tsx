import { Zap } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Zap size={18} className="text-blue-400" />
            AdSwap
          </div>
          <p className="text-sm text-center">P2P платформа для обмена рекламой между владельцами сайтов</p>
          <div className="flex gap-4 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Каталог</Link>
            <Link href="/auth" className="hover:text-white transition-colors">Войти</Link>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-navy-800 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} AdSwap. Все права защищены.
        </div>
      </div>
    </footer>
  )
}
