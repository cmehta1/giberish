-- ============================================================
-- GIBERISH — database (Supabase / Postgres)
-- Run once in Supabase → SQL Editor. It is safe to run again.
--
-- Who can do what (Row Level Security):
--   • anyone on the website : read active products & notes · add an order · add a Kundli reading
--   • admins (logged in)    : read and change everything
-- Admins are the emails listed in public.admins (add yours at the end of this file).
-- ============================================================


-- ---------- Admins ----------
create table if not exists public.admins (
  email text primary key check (email = lower(email))
);
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where a.email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

drop policy if exists "admins see admins" on public.admins;
create policy "admins see admins" on public.admins for select using (public.is_admin());

-- keeps updated_at fresh
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ---------- Products ----------
create table if not exists public.products (
  id          text primary key check (id ~ '^[a-z0-9-]{2,60}$'),
  name        text not null check (char_length(name) between 1 and 80),
  house       text,
  type        text not null check (type in ('attar', 'perfume', 'ritual')),
  size        text,
  price       integer check (price is null or price >= 0),          -- null = "By invitation"
  image       text,
  tagline     text,
  story       text,
  notes       jsonb not null default '{"top": [], "heart": [], "base": []}',
  ingredients text[] not null default '{}',                          -- note keys (public.notes.key)
  feel        text[] not null default '{}',
  featured    boolean not null default false,
  world       text,                                                  -- optional overrides used by the site
  sound       text,
  nozzle      jsonb,
  sort        integer not null default 100,
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);
alter table public.products enable row level security;
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();

drop policy if exists "read active products" on public.products;
create policy "read active products" on public.products for select using (active or public.is_admin());
drop policy if exists "admins change products" on public.products;
create policy "admins change products" on public.products for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Notes (the ingredients Giberish offers) ----------
create table if not exists public.notes (
  key        text primary key check (key ~ '^[a-z0-9]{2,30}$'),
  label      text not null check (char_length(label) between 1 and 60),
  family     jsonb not null default '{}',     -- e.g. {"floral": 1, "fresh": 0.3}
  color      text check (color is null or color ~ '^#[0-9a-fA-F]{6}$'),
  art        text[],                          -- drawn art kinds (assets/js/art.js), e.g. {peach}
  tier       text check (tier in ('top', 'heart', 'base')),
  sort       integer not null default 100,
  active     boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.notes enable row level security;
drop trigger if exists notes_touch on public.notes;
create trigger notes_touch before update on public.notes for each row execute function public.touch_updated_at();

drop policy if exists "read active notes" on public.notes;
create policy "read active notes" on public.notes for select using (active or public.is_admin());
drop policy if exists "admins change notes" on public.notes;
create policy "admins change notes" on public.notes for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Orders (saved when a visitor places an order) ----------
create table if not exists public.orders (
  id         uuid primary key default gen_random_uuid(),
  code       text not null check (char_length(code) between 4 and 24),
  created_at timestamptz not null default now(),
  channel    text not null check (channel in ('whatsapp', 'instagram', 'online')),
  name       text not null check (char_length(name) between 1 and 120),
  phone      text check (char_length(phone) <= 20),
  email      text check (char_length(email) <= 160),
  address    text check (char_length(address) <= 500),
  city       text check (char_length(city) <= 80),
  pincode    text check (char_length(pincode) <= 10),
  gift_note  text check (char_length(gift_note) <= 300),
  items      jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 50),
  subtotal   integer check (subtotal >= 0),
  discount   integer not null default 0 check (discount >= 0),
  shipping   integer check (shipping >= 0),
  total      integer check (total >= 0),
  offer      text check (char_length(offer) <= 60),
  lang       text check (char_length(lang) <= 5),
  status     text not null default 'new' check (status in ('new', 'converted', 'not_converted')),
  status_at  timestamptz,
  admin_note text check (char_length(admin_note) <= 1000)
);
create index if not exists orders_created_idx on public.orders (created_at desc);
alter table public.orders enable row level security;

drop policy if exists "anyone places an order" on public.orders;
create policy "anyone places an order" on public.orders for insert to anon, authenticated
  with check (status = 'new' and status_at is null and admin_note is null);
drop policy if exists "admins read orders" on public.orders;
create policy "admins read orders" on public.orders for select using (public.is_admin());
drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders" on public.orders for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete orders" on public.orders;
create policy "admins delete orders" on public.orders for delete using (public.is_admin());

-- ---------- Scent Kundli readings ----------
create table if not exists public.kundlis (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  name              text check (char_length(name) <= 60),
  email             text not null check (char_length(email) <= 160 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  consent_marketing boolean not null default false,
  answers           jsonb,          -- question → chosen option
  profile           jsonb,          -- family scores
  archetype         text check (char_length(archetype) <= 80),
  blend             jsonb,          -- bespoke attar: top / heart / base / voice / code / title
  matches           jsonb,          -- top product matches with scores
  share_url         text check (char_length(share_url) <= 2000),
  lang              text check (char_length(lang) <= 5)
);
create index if not exists kundlis_created_idx on public.kundlis (created_at desc);
alter table public.kundlis enable row level security;

drop policy if exists "anyone saves a reading" on public.kundlis;
create policy "anyone saves a reading" on public.kundlis for insert to anon, authenticated with check (true);
drop policy if exists "admins read readings" on public.kundlis;
create policy "admins read readings" on public.kundlis for select using (public.is_admin());
drop policy if exists "admins delete readings" on public.kundlis;
create policy "admins delete readings" on public.kundlis for delete using (public.is_admin());

-- ---------- Table permissions (Row Level Security above decides which rows) ----------
grant usage on schema public to anon, authenticated;
grant select on public.products, public.notes to anon, authenticated;
grant insert on public.orders, public.kundlis to anon, authenticated;
grant select, insert, update, delete on public.products, public.notes, public.orders, public.kundlis to authenticated;
grant select on public.admins to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- Product photos (Storage bucket, public to read, admins to upload) ----------
insert into storage.buckets (id, name, public) values ('products', 'products', true) on conflict (id) do nothing;
drop policy if exists "admins upload product photos" on storage.objects;
create policy "admins upload product photos" on storage.objects for insert to authenticated with check (bucket_id = 'products' and public.is_admin());
drop policy if exists "admins change product photos" on storage.objects;
create policy "admins change product photos" on storage.objects for update to authenticated using (bucket_id = 'products' and public.is_admin());
drop policy if exists "admins delete product photos" on storage.objects;
create policy "admins delete product photos" on storage.objects for delete to authenticated using (bucket_id = 'products' and public.is_admin());

-- ---------- Your admin login ----------
-- 1. Authentication → Users → "Add user" with your email and a strong password.
-- 2. Put the same email (lower case) here and run this line:
-- insert into public.admins (email) values ('you@example.com') on conflict do nothing;
