-- Blush database: customer profiles, orders, products and shop admins.
-- Safe to run more than once.

-- Shop admins, by account ID (not email), so nobody can become admin by signing up with the owner's email.
-- Add the owner after they create their account:  insert into public.admins (user_id) values ('<their auth user id>');
create table if not exists public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- One profile per customer account: name and saved delivery address
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text, phone text, state text, city text, address text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all
  using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "admins read profiles" on public.profiles;
create policy "admins read profiles" on public.profiles for select using (public.is_admin());

-- Create a profile automatically when someone signs up
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name) values (new.id, new.raw_user_meta_data ->> 'name')
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Orders: anyone can place one (guests too); customers see their own; admins see and update all
create table if not exists public.orders (
  id bigint generated always as identity primary key,
  no text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  name text not null, email text, phone text not null,
  state text not null, city text, address text,
  ship text, days text, pay text not null, note text,
  items jsonb not null,
  sub integer not null, fee integer not null, total integer not null,
  status text not null default 'Processing'
    check (status in ('Processing','Packed','Out for delivery','Delivered','Cancelled')),
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
drop policy if exists "place order" on public.orders;
create policy "place order" on public.orders for insert
  with check ((user_id is null or user_id = auth.uid()) and status = 'Processing');
drop policy if exists "own orders" on public.orders;
create policy "own orders" on public.orders for select using (user_id = auth.uid());
drop policy if exists "admins read orders" on public.orders;
create policy "admins read orders" on public.orders for select using (public.is_admin());
drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders" on public.orders for update using (public.is_admin()) with check (public.is_admin());

-- Products: everyone can read; admins edit. "data" holds name, photos, shades and description.
create table if not exists public.products (
  id text primary key,
  data jsonb not null,
  price integer not null check (price >= 0),
  sold_out boolean not null default false,
  sort integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
drop policy if exists "anyone reads products" on public.products;
create policy "anyone reads products" on public.products for select using (true);
drop policy if exists "admins edit products" on public.products;
create policy "admins edit products" on public.products for all using (public.is_admin()) with check (public.is_admin());

grant select on public.products to anon, authenticated;
grant insert on public.orders to anon, authenticated;
grant select, update on public.orders to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant insert, update, delete on public.products to authenticated;

-- Product photos uploaded from admin.html: public to view, only admins can add or remove
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-photos', 'product-photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "admins upload product photos" on storage.objects;
create policy "admins upload product photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-photos' and public.is_admin());
drop policy if exists "admins change product photos" on storage.objects;
create policy "admins change product photos" on storage.objects for update to authenticated
  using (bucket_id = 'product-photos' and public.is_admin());
drop policy if exists "admins list product photos" on storage.objects;
create policy "admins list product photos" on storage.objects for select to authenticated
  using (bucket_id = 'product-photos' and public.is_admin());
drop policy if exists "admins delete product photos" on storage.objects;
create policy "admins delete product photos" on storage.objects for delete to authenticated
  using (bucket_id = 'product-photos' and public.is_admin());
