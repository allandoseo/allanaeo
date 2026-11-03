-- EscortsBoys — esquema de produção (PostgreSQL / Supabase)
-- Espelha src/lib/types.ts. Autenticação via Supabase Auth (auth.users); dados de perfil em public.*.
-- Princípios: dados sensíveis (contato, e-mail, documentos) nunca legíveis publicamente;
-- o público lê apenas a view public_ads; escrita do anunciante limitada às próprias linhas;
-- moderação e verificação somente por administradores.

create extension if not exists "pgcrypto";
create extension if not exists "unaccent";

-- ───────────── Tipos ─────────────
create type user_role as enum ('user', 'advertiser', 'admin');
create type user_status as enum ('active', 'suspended');
create type verification_status as enum ('none', 'pending', 'verified', 'rejected');
create type ad_status as enum ('draft', 'pending', 'active', 'paused', 'rejected', 'removed');
create type availability_status as enum ('unknown', 'available_now', 'available_today', 'by_appointment', 'unavailable');
create type report_reason as enum ('minor', 'non_consensual_images', 'impersonation', 'third_party', 'personal_data', 'fraud', 'other');
create type report_status as enum ('open', 'resolved', 'dismissed');

-- ───────────── Contas ─────────────
create table public.accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  role user_role not null default 'user',
  status user_status not null default 'active',
  age_confirmed_at timestamptz not null,
  terms_accepted_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Função auxiliar usada pelas políticas (security definer evita recursão de RLS).
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.accounts a where a.id = auth.uid() and a.role = 'admin' and a.status = 'active');
$$;

create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.accounts a where a.id = auth.uid() and a.status = 'active');
$$;

-- ───────────── Catálogos ─────────────
create table public.cities (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  state char(2) not null,
  active boolean not null default true
);

create table public.regions (
  city_slug text not null references public.cities (slug) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  primary key (city_slug, slug)
);

create table public.categories (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  description text not null default '',
  active boolean not null default true
);

create table public.plans (
  id text primary key,
  name text not null,
  description text not null default '',
  price_cents integer check (price_cents is null or price_cents >= 0), -- null = valor a definir
  period_days integer not null default 30 check (period_days > 0),
  features text[] not null default '{}',
  highlight boolean not null default false,
  active boolean not null default true
);

create table public.settings (
  id boolean primary key default true check (id), -- linha única
  site_name text not null default 'EscortsBoys',
  contact_email text not null default '',
  moderation_required boolean not null default true,
  min_photos integer not null default 1,
  max_photos integer not null default 12,
  min_ads_for_index integer not null default 3,
  notice text not null default ''
);
insert into public.settings default values;

-- ───────────── Perfis e anúncios ─────────────
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.accounts (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  public_name text not null check (char_length(public_name) between 2 and 40),
  bio text not null default '' check (char_length(bio) <= 1500),
  city_slug text not null references public.cities (slug),
  avatar_path text,
  verification verification_status not null default 'none',
  verification_note text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ads (
  id uuid primary key default gen_random_uuid(),
  slug text unique check (slug ~ '^[a-z0-9-]+$'),
  owner_id uuid not null references public.accounts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default '',
  public_name text not null default '',
  age smallint check (age is null or age between 18 and 80),
  city_slug text references public.cities (slug),
  region_slug text,
  areas_served text[] not null default '{}',
  summary text not null default '',
  description text not null default '',
  characteristics jsonb not null default '[]',
  modes text[] not null default '{}',
  availability availability_status not null default 'unknown',
  availability_note text not null default '',
  availability_updated_at timestamptz,
  schedule jsonb not null default '[]',
  prices jsonb not null default '[]',
  show_prices boolean not null default false,
  rules text[] not null default '{}',
  conditions text not null default '',
  photos jsonb not null default '[]', -- [{id, path, width, height, alt}]
  image_consent_at timestamptz,
  status ad_status not null default 'draft',
  moderation_note text,
  is_demo boolean not null default false,
  views integer not null default 0,
  contact_clicks integer not null default 0,
  favorites_count integer not null default 0,
  draft_step smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  foreign key (city_slug, region_slug) references public.regions (city_slug, slug),
  -- Anúncio só pode estar ativo/pendente com os requisitos mínimos
  constraint ad_publishable check (
    status in ('draft', 'removed', 'rejected', 'paused')
    or (age >= 18 and image_consent_at is not null and jsonb_array_length(photos) >= 1 and city_slug is not null)
  )
);
create index ads_public_idx on public.ads (status, city_slug, region_slug);
create index ads_owner_idx on public.ads (owner_id);
create index ads_search_idx on public.ads using gin (to_tsvector('portuguese', unaccent(coalesce(public_name, '') || ' ' || coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(description, ''))));

-- Contato fica em tabela separada: nunca exposta ao público; lida apenas via função de revelação.
create table public.ad_contacts (
  ad_id uuid primary key references public.ads (id) on delete cascade,
  whatsapp text check (whatsapp is null or whatsapp ~ '^55\d{10,11}$'),
  phone text check (phone is null or phone ~ '^55\d{10,11}$'),
  telegram text check (telegram is null or telegram ~ '^[A-Za-z0-9_]{5,32}$'),
  show_whatsapp boolean not null default false,
  show_phone boolean not null default false,
  show_telegram boolean not null default false
);

create table public.favorites (
  user_id uuid not null references public.accounts (id) on delete cascade,
  ad_id uuid not null references public.ads (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, ad_id)
);

create table public.daily_stats (
  ad_id uuid not null references public.ads (id) on delete cascade,
  date date not null,
  views integer not null default 0,
  contacts integer not null default 0,
  favorites integer not null default 0,
  primary key (ad_id, date)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.ads (id) on delete cascade,
  reason report_reason not null,
  details text not null default '' check (char_length(details) <= 2000),
  reporter_email text,
  reporter_user_id uuid references public.accounts (id) on delete set null,
  status report_status not null default 'open',
  resolution text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index reports_open_idx on public.reports (status, created_at desc);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null check (char_length(message) <= 4000),
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.accounts (id) on delete set null,
  action text not null,
  target text not null,
  note text,
  created_at timestamptz not null default now()
);

-- ───────────── Gatilhos ─────────────
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger ads_touch before update on public.ads for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- Anunciante não pode alterar campos de moderação/estatística nem se autopublicar.
create or replace function public.guard_ad_owner_update() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  if new.owner_id <> old.owner_id or new.is_demo <> old.is_demo or new.views <> old.views
     or new.contact_clicks <> old.contact_clicks or new.favorites_count <> old.favorites_count
     or new.moderation_note is distinct from old.moderation_note or new.published_at is distinct from old.published_at then
    raise exception 'campo protegido';
  end if;
  -- transições permitidas ao dono
  if new.status <> old.status and not (
       (old.status in ('draft', 'rejected', 'active', 'paused') and new.status = 'pending')
    or (old.status = 'active' and new.status = 'paused')
    or (old.status = 'paused' and new.status = 'active' and old.published_at is not null)
    or (new.status = 'removed')
  ) then
    raise exception 'transição de status não permitida';
  end if;
  return new;
end $$;
create trigger ads_owner_guard before update on public.ads for each row execute function public.guard_ad_owner_update();

-- Verificação de perfil só muda por admin (o dono pode apenas pedir: none/rejected → pending).
create or replace function public.guard_profile_update() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  if new.verification <> old.verification and not (old.verification in ('none', 'rejected') and new.verification = 'pending') then
    raise exception 'verificação só pode ser alterada pela moderação';
  end if;
  if new.is_demo <> old.is_demo or new.user_id <> old.user_id then raise exception 'campo protegido'; end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles for each row execute function public.guard_profile_update();

-- ───────────── Leitura pública ─────────────
create or replace view public.public_ads with (security_invoker = false) as
  select a.id, a.slug, a.title, a.public_name, a.age, a.city_slug, a.region_slug, a.areas_served, a.summary, a.description,
         a.characteristics, a.modes, a.availability, a.availability_note, a.availability_updated_at, a.schedule,
         case when a.show_prices then a.prices else '[]'::jsonb end as prices, a.show_prices, a.rules, a.conditions,
         a.photos, a.is_demo, a.updated_at, a.published_at,
         (c.show_whatsapp and c.whatsapp is not null) as has_whatsapp,
         (c.show_phone and c.phone is not null) as has_phone,
         (c.show_telegram and c.telegram is not null) as has_telegram,
         p.slug as profile_slug, (p.verification = 'verified') as verified
    from public.ads a
    join public.profiles p on p.id = a.profile_id
    join public.accounts acc on acc.id = a.owner_id and acc.status = 'active'
    left join public.ad_contacts c on c.ad_id = a.id
   where a.status = 'active';
grant select on public.public_ads to anon, authenticated;

-- Revela um contato autorizado e registra o clique (chamada pela rota /api/contato com a service role).
create or replace function public.reveal_contact(p_ad uuid, p_channel text) returns text
language plpgsql security definer set search_path = public as $$
declare v text;
begin
  select case p_channel
           when 'whatsapp' then case when c.show_whatsapp then c.whatsapp end
           when 'phone' then case when c.show_phone then c.phone end
           when 'telegram' then case when c.show_telegram then c.telegram end
         end into v
    from public.ad_contacts c join public.ads a on a.id = c.ad_id
   where c.ad_id = p_ad and a.status = 'active';
  if v is not null then
    update public.ads set contact_clicks = contact_clicks + 1 where id = p_ad;
    insert into public.daily_stats (ad_id, date, contacts) values (p_ad, (now() at time zone 'America/Sao_Paulo')::date, 1)
      on conflict (ad_id, date) do update set contacts = daily_stats.contacts + 1;
  end if;
  return v;
end $$;
revoke all on function public.reveal_contact(uuid, text) from public, anon, authenticated;

create or replace function public.record_view(p_ad uuid) returns void
language sql security definer set search_path = public as $$
  update public.ads set views = views + 1 where id = p_ad and status = 'active';
  insert into public.daily_stats (ad_id, date, views) values (p_ad, (now() at time zone 'America/Sao_Paulo')::date, 1)
    on conflict (ad_id, date) do update set views = daily_stats.views + 1;
$$;
grant execute on function public.record_view(uuid) to anon, authenticated;

-- ───────────── RLS ─────────────
alter table public.accounts enable row level security;
alter table public.cities enable row level security;
alter table public.regions enable row level security;
alter table public.categories enable row level security;
alter table public.plans enable row level security;
alter table public.settings enable row level security;
alter table public.profiles enable row level security;
alter table public.ads enable row level security;
alter table public.ad_contacts enable row level security;
alter table public.favorites enable row level security;
alter table public.daily_stats enable row level security;
alter table public.reports enable row level security;
alter table public.contact_messages enable row level security;
alter table public.audit_log enable row level security;

-- Contas: cada um lê/edita o próprio nome; papel e status só pelo admin.
create policy accounts_self_read on public.accounts for select using (id = auth.uid() or public.is_admin());
create policy accounts_self_insert on public.accounts for insert with check (id = auth.uid() and role in ('user', 'advertiser') and status = 'active');
create policy accounts_admin_update on public.accounts for update using (public.is_admin());
create policy accounts_self_update on public.accounts for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.accounts where id = auth.uid()) and status = (select status from public.accounts where id = auth.uid()));

-- Catálogos: leitura pública, escrita admin.
create policy cities_read on public.cities for select using (active or public.is_admin());
create policy cities_admin on public.cities for all using (public.is_admin()) with check (public.is_admin());
create policy regions_read on public.regions for select using (true);
create policy regions_admin on public.regions for all using (public.is_admin()) with check (public.is_admin());
create policy categories_read on public.categories for select using (active or public.is_admin());
create policy categories_admin on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy plans_read on public.plans for select using (active or public.is_admin());
create policy plans_admin on public.plans for all using (public.is_admin()) with check (public.is_admin());
create policy settings_read on public.settings for select using (true);
create policy settings_admin on public.settings for update using (public.is_admin());

-- Perfis: público lê perfis com anúncio ativo; dono gerencia o próprio.
create policy profiles_public_read on public.profiles for select using (
  exists (select 1 from public.ads a where a.profile_id = profiles.id and a.status = 'active') or user_id = auth.uid() or public.is_admin());
create policy profiles_owner_insert on public.profiles for insert with check (user_id = auth.uid() and public.is_active_user() and verification = 'none' and not is_demo);
create policy profiles_owner_update on public.profiles for update using (user_id = auth.uid() or public.is_admin());
create policy profiles_owner_delete on public.profiles for delete using (user_id = auth.uid() or public.is_admin());

-- Anúncios: tabela base só para dono e admin (o público usa a view public_ads).
create policy ads_owner_read on public.ads for select using (owner_id = auth.uid() or public.is_admin());
create policy ads_owner_insert on public.ads for insert with check (owner_id = auth.uid() and public.is_active_user() and status = 'draft' and not is_demo
  and exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy ads_owner_update on public.ads for update using (owner_id = auth.uid() or public.is_admin());
create policy ads_admin_delete on public.ads for delete using (public.is_admin());

create policy contacts_owner on public.ad_contacts for all
  using (exists (select 1 from public.ads a where a.id = ad_id and (a.owner_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.ads a where a.id = ad_id and a.owner_id = auth.uid()));

create policy favorites_own on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy stats_owner_read on public.daily_stats for select using (
  exists (select 1 from public.ads a where a.id = ad_id and (a.owner_id = auth.uid() or public.is_admin())));

-- Denúncias: qualquer pessoa cria; apenas admin lê e resolve.
create policy reports_insert on public.reports for insert with check (status = 'open' and resolution is null);
create policy reports_admin on public.reports for select using (public.is_admin());
create policy reports_admin_update on public.reports for update using (public.is_admin());

create policy messages_insert on public.contact_messages for insert with check (handled = false);
create policy messages_admin on public.contact_messages for select using (public.is_admin());
create policy messages_admin_update on public.contact_messages for update using (public.is_admin());

create policy audit_admin on public.audit_log for select using (public.is_admin());
create policy audit_admin_insert on public.audit_log for insert with check (public.is_admin() and actor_id = auth.uid());

-- ───────────── Storage ─────────────
-- Bucket público somente-leitura para fotos aprovadas; uploads ficam em pasta do próprio usuário.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ad-photos', 'ad-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Bucket privado para documentos de verificação (acesso apenas do dono e da moderação).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verification-docs', 'verification-docs', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do nothing;

create policy photos_owner_write on storage.objects for insert to authenticated
  with check (bucket_id = 'ad-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy photos_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'ad-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy docs_owner_write on storage.objects for insert to authenticated
  with check (bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy docs_read on storage.objects for select to authenticated
  using (bucket_id = 'verification-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
