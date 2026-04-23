-- AdSwap Database Schema
-- Run this in your Supabase SQL Editor

-- ==========================================
-- EXTENSIONS
-- ==========================================
create extension if not exists "uuid-ossp";

-- ==========================================
-- TABLES
-- ==========================================

-- profiles: linked to auth.users via trigger
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now() not null
);

-- websites
create table if not exists public.websites (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  url         text not null,
  name        text not null,
  description text,
  category    text not null default 'other',
  traffic     integer,
  geo         text,
  logo_url    text,
  created_at  timestamptz default now() not null
);

-- deals
create table if not exists public.deals (
  id           uuid primary key default uuid_generate_v4(),
  initiator_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id  uuid not null references public.profiles(id) on delete cascade,
  website_from uuid not null references public.websites(id) on delete cascade,
  website_to   uuid not null references public.websites(id) on delete cascade,
  status       text not null default 'negotiating'
                check (status in ('negotiating', 'agreed', 'done')),
  created_at   timestamptz default now() not null
);

-- messages
create table if not exists public.messages (
  id         uuid primary key default uuid_generate_v4(),
  deal_id    uuid not null references public.deals(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  text       text not null check (char_length(text) > 0 and char_length(text) <= 2000),
  created_at timestamptz default now() not null
);

-- ==========================================
-- INDEXES
-- ==========================================
create index if not exists websites_owner_id_idx    on public.websites(owner_id);
create index if not exists websites_category_idx    on public.websites(category);
create index if not exists deals_initiator_id_idx   on public.deals(initiator_id);
create index if not exists deals_receiver_id_idx    on public.deals(receiver_id);
create index if not exists deals_status_idx         on public.deals(status);
create index if not exists messages_deal_id_idx     on public.messages(deal_id);
create index if not exists messages_created_at_idx  on public.messages(created_at);

-- ==========================================
-- TRIGGER: auto-create profile on sign-up
-- ==========================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

alter table public.profiles  enable row level security;
alter table public.websites  enable row level security;
alter table public.deals     enable row level security;
alter table public.messages  enable row level security;

-- ---------- profiles ----------
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- ---------- websites ----------
create policy "Websites are viewable by everyone"
  on public.websites for select using (true);

create policy "Authenticated users can insert websites"
  on public.websites for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their websites"
  on public.websites for update
  using (auth.uid() = owner_id);

create policy "Owners can delete their websites"
  on public.websites for delete
  using (auth.uid() = owner_id);

-- ---------- deals ----------
create policy "Deal participants can view deals"
  on public.deals for select
  using (auth.uid() = initiator_id or auth.uid() = receiver_id);

create policy "Authenticated users can create deals"
  on public.deals for insert
  with check (auth.uid() = initiator_id);

create policy "Deal participants can update deals"
  on public.deals for update
  using (auth.uid() = initiator_id or auth.uid() = receiver_id);

-- ---------- messages ----------
create policy "Deal participants can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.deals d
      where d.id = deal_id
        and (d.initiator_id = auth.uid() or d.receiver_id = auth.uid())
    )
  );

create policy "Deal participants can insert messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.deals d
      where d.id = deal_id
        and (d.initiator_id = auth.uid() or d.receiver_id = auth.uid())
    )
  );

-- ==========================================
-- REALTIME
-- ==========================================
-- Enable realtime for messages and deals tables
-- Run in Supabase Dashboard → Database → Replication
-- or uncomment the lines below:

-- alter publication supabase_realtime add table public.messages;
-- alter publication supabase_realtime add table public.deals;
