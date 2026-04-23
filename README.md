# AdSwap — P2P платформа для обмена рекламой

Сервис для взаимовыгодного обмена рекламой между владельцами сайтов. Без посредников, без комиссий.

## Стек

- **Next.js 14** (App Router, Server Components)
- **Supabase** (Auth, PostgreSQL, Realtime)
- **Tailwind CSS**
- **TypeScript**

## Возможности

- Каталог сайтов с поиском по ключевым словам и фильтром по категориям
- Регистрация и вход через Supabase Auth
- Личный кабинет с вашими сайтами, сделками и уведомлениями
- Добавление / редактирование / удаление сайтов
- Предложение обмена кнопкой на странице чужого сайта
- Realtime чат внутри каждой сделки
- Статусы сделки: Обсуждается → Договорились → Завершено

---

## Быстрый старт

### 1. Клонировать репозиторий

```bash
git clone https://github.com/your-user/adswap.git
cd adswap
```

### 2. Установить зависимости

```bash
npm install
```

### 3. Настроить Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Скопируйте `.env.example` → `.env.local` и заполните ключи:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Ключи находятся в **Supabase Dashboard → Settings → API**.

### 4. Применить схему базы данных

В **Supabase Dashboard → SQL Editor** вставьте и выполните содержимое файла `schema.sql`.

### 5. Включить Realtime

В **Supabase Dashboard → Database → Replication** добавьте таблицы `messages` и `deals` в публикацию `supabase_realtime`.

Или выполните в SQL Editor:
```sql
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.deals;
```

### 6. Запустить проект

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

---

## Структура проекта

```
src/
├── app/
│   ├── page.tsx              # Главная: каталог сайтов
│   ├── auth/page.tsx         # Вход / регистрация
│   ├── dashboard/page.tsx    # Личный кабинет
│   ├── sites/
│   │   ├── add/page.tsx      # Добавление сайта
│   │   └── [id]/page.tsx     # Страница сайта
│   └── deals/
│       ├── page.tsx          # Список сделок
│       └── [id]/page.tsx     # Чат по сделке
├── components/
│   ├── layout/               # Header, Footer
│   └── sites/                # SiteCard
└── lib/
    ├── supabase/             # client.ts, server.ts, middleware.ts
    └── types.ts              # TypeScript типы
```

## База данных

| Таблица    | Описание                        |
|------------|---------------------------------|
| `profiles` | Профили пользователей           |
| `websites` | Сайты (каталог)                 |
| `deals`    | Сделки между двумя владельцами  |
| `messages` | Сообщения в чате по сделке      |

Все таблицы защищены **Row Level Security (RLS)**.

## Сборка для production

```bash
npm run build
npm run start
```
