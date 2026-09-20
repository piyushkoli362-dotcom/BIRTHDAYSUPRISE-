-- Little Wishes · run in the Supabase SQL editor in a NEW project.
-- Uses the publishable/anon key and per-user JWTs. No service-role key required.
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table public.themes (
 id text primary key,
 name text not null,
 description text not null,
 preview_image text,
 is_active boolean not null default true
);
insert into public.themes (id,name,description,preview_image) values
 ('radha-krishna','Radha–Krishna','Moonlit Vrindavan','/themes/vrindavan-1.jpg'),
 ('dreamy-night','Dreamy Night','A world of stars',null),
 ('romantic','Romantic','Flowers and warmth',null),
 ('luxury-gold','Luxury Gold','Timeless gold',null),
 ('cute-birthday','Cute Birthday','Little joys',null);
create table public.birthday_pages (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug)<=60 and slug <> 'mahima'),
 status text not null default 'draft' check (status in ('draft','published')),
 config jsonb not null,
 recipient_name text generated always as (config->>'recipientName') stored,
 nickname text generated always as (config->>'nickname') stored,
 birthday_date text generated always as (config->>'birthdayDate') stored,
 sender_name text generated always as (config->>'senderName') stored,
 personal_message text generated always as (config->>'personalMessage') stored,
 theme_id text generated always as (config->>'themeId') stored references public.themes(id),
 music_url text generated always as (config->>'musicUrl') stored,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 published_at text generated always as (config->>'publishedAt') stored,
 check (config->>'id'=id::text and config->>'userId'=user_id::text and config->>'slug'=slug and config->>'status'=status),
 check (jsonb_typeof(config->'photos')='array' and jsonb_array_length(config->'photos')<=20),
 check (jsonb_typeof(config->'reasons')='array' and jsonb_array_length(config->'reasons')<=20),
 check (length(config->>'personalMessage')<=12000),
 check (status='draft' or (length(config->>'recipientName')>0 and config->>'birthdayDate' ~ '^\d{4}-\d{2}-\d{2}$'))
);
create index birthday_pages_owner on public.birthday_pages(user_id,updated_at desc);
alter table public.profiles enable row level security;
alter table public.themes enable row level security;
alter table public.birthday_pages enable row level security;
create policy profiles_own on public.profiles for all to authenticated using (id=auth.uid()) with check (id=auth.uid());
create policy active_themes on public.themes for select using (is_active);
create policy read_pages on public.birthday_pages for select using (status='published' or user_id=auth.uid());
create policy insert_own_page on public.birthday_pages for insert to authenticated with check (user_id=auth.uid());
create policy update_own_page on public.birthday_pages for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy delete_own_page on public.birthday_pages for delete to authenticated using (user_id=auth.uid());
-- Ordered read models: content is saved atomically in config, without partial photo/reason writes.
create view public.birthday_photos with (security_invoker=true) as
 select p.id as birthday_page_id, x->>'id' as id, x->>'imageUrl' as image_url,
 x->>'caption' as caption, n-1 as sort_order
 from public.birthday_pages p cross join lateral jsonb_array_elements(p.config->'photos') with ordinality as photos(x,n);
create view public.birthday_reasons with (security_invoker=true) as
 select p.id as birthday_page_id,n-1 as sort_order,x #>> '{}' as text
 from public.birthday_pages p cross join lateral jsonb_array_elements(p.config->'reasons') with ordinality as reasons(x,n);
create function public.birthday_slug_available(requested text,page_id uuid) returns boolean
 language sql stable security definer set search_path=public
 as $$ select requested <> 'mahima' and not exists(select 1 from birthday_pages where slug=requested and id<>page_id); $$;
revoke all on function public.birthday_slug_available(text,uuid) from public;
grant execute on function public.birthday_slug_available(text,uuid) to authenticated;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
 values ('birthday-assets','birthday-assets',false,20971520,array['image/webp','audio/mpeg','audio/wav','audio/mp4']);
create policy assets_insert on storage.objects for insert to authenticated with check (
 bucket_id='birthday-assets' and (storage.foldername(name))[1]=auth.uid()::text and
 exists(select 1 from public.birthday_pages p where p.id::text=(storage.foldername(name))[2] and p.user_id=auth.uid())
);
create policy assets_read on storage.objects for select using (
 bucket_id='birthday-assets' and exists (
 select 1 from public.birthday_pages p where p.id::text=(storage.foldername(name))[2] and
 p.user_id::text=(storage.foldername(name))[1] and (p.user_id=auth.uid() or p.status='published'))
);
create policy assets_delete on storage.objects for delete to authenticated using (
 bucket_id='birthday-assets' and (storage.foldername(name))[1]=auth.uid()::text
);
create function public.create_birthday_profile() returns trigger language plpgsql security definer set search_path=public as $$
 begin insert into public.profiles(id) values(new.id); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.create_birthday_profile();

