-- =====================================================================
-- Hifonix demo CMS — Supabase schema
-- Paste the whole file into Supabase → SQL Editor → Run (safe to re-run).
--
-- BEFORE RUNNING: replace  you@example.com  in the "admins" insert below
-- with the email of the user you create in Authentication → Users.
-- Only emails listed in public.admins can edit products or upload images.
-- =====================================================================

-- ---------------------------------------------------------------- admins
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;
-- nobody reads/writes this table through the API; it is managed here in SQL
drop policy if exists "admins: none" on public.admins;

insert into public.admins (email) values ('you@example.com')   -- ← your admin email
on conflict (email) do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

-- -------------------------------------------------------------- products
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  handle       text not null unique check (handle ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title        text not null,
  subtitle     text,
  brand        text not null default '',
  brand_handle text not null default '',
  department   text not null default 'head-fi',      -- hi-fi | head-fi | speakers | furniture | cable
  categories   text[] not null default '{}',          -- collection handles, e.g. closed-back-headphones
  product_type text not null default '',
  description  text not null default '',
  price        numeric(12,2) not null default 0,
  price_from   boolean not null default false,        -- card shows "FROM £x"
  currency     text not null default 'GBP',
  available    boolean not null default true,         -- demo availability (Buy button enabled)
  status       text not null default 'draft' check (status in ('draft','published')),
  images       jsonb not null default '[]',           -- [{url, alt, path}]  first = main image
  hover_image  jsonb,                                 -- {url, path}         card hover photo
  options      jsonb not null default '[]',           -- [{name, values:[{name, color, image, price}]}]
  specs        jsonb not null default '[]',           -- [{label, value}]
  story        jsonb,                                 -- optional editorial blocks (see src/commerce/types.ts → ProductStory)
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists products_status_idx on public.products (status, sort_order);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();

alter table public.products enable row level security;
drop policy if exists "products: public reads published" on public.products;
create policy "products: public reads published" on public.products
  for select using (status = 'published' or public.is_admin());
drop policy if exists "products: admins insert" on public.products;
create policy "products: admins insert" on public.products for insert with check (public.is_admin());
drop policy if exists "products: admins update" on public.products;
create policy "products: admins update" on public.products for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "products: admins delete" on public.products;
create policy "products: admins delete" on public.products for delete using (public.is_admin());

-- ------------------------------------------------------- image storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 10485760, array['image/webp','image/jpeg','image/png','image/avif'])
on conflict (id) do update set public = true;

drop policy if exists "product-images: admins upload" on storage.objects;
create policy "product-images: admins upload" on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "product-images: admins update" on storage.objects;
create policy "product-images: admins update" on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "product-images: admins delete" on storage.objects;
create policy "product-images: admins delete" on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "product-images: admins read" on storage.objects;
create policy "product-images: admins read" on storage.objects for select
  using (bucket_id = 'product-images' and public.is_admin());
-- (visitors read images through the public bucket URL)

-- ------------------------------------------------ enquiries (contact / newsletter / careers forms)
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('contact', 'newsletter', 'careers')),
  name text check (char_length(name) <= 200),
  email text not null check (char_length(email) between 3 and 320),
  phone text check (char_length(phone) <= 40),
  subject text check (char_length(subject) <= 300),
  message text check (char_length(message) <= 5000),
  created_at timestamptz not null default now()
);
alter table public.enquiries enable row level security;
drop policy if exists "enquiries: anyone submits" on public.enquiries;
create policy "enquiries: anyone submits" on public.enquiries for insert with check (true);
drop policy if exists "enquiries: admins read" on public.enquiries;
create policy "enquiries: admins read" on public.enquiries for select using (public.is_admin());
drop policy if exists "enquiries: admins delete" on public.enquiries;
create policy "enquiries: admins delete" on public.enquiries for delete using (public.is_admin());
grant insert on public.enquiries to anon, authenticated;


-- Demo catalogue (generated). Safe to re-run: existing handles are left untouched.
insert into public.products (handle, title, subtitle, brand, brand_handle, department, categories, product_type, description, price, price_from, available, status, images, hover_image, options, specs, story, sort_order)
values
('abyss-ab-1266', 'Abyss AB-1266', null, 'Abyss', 'abyss', 'head-fi', array['closed-back-headphones']::text[], 'Headphones', '', 8595, true, true, 'published', '[{"url":"/shop/products/ab-1266/1.webp","alt":"Abyss AB-1266"}]'::jsonb, '{"url":"/shop/products/ab-1266/hover.webp"}'::jsonb, '[]'::jsonb, '[]'::jsonb, 'null'::jsonb, 0),
('abyss-audio-diana', 'Abyss Audio DIANA®', null, 'Abyss', 'abyss', 'head-fi', array['closed-back-headphones']::text[], 'Headphones', '', 4700, false, true, 'published', '[{"url":"/shop/products/diana/1.webp","alt":"Abyss Audio DIANA®"}]'::jsonb, '{"url":"/shop/products/diana/hover.webp"}'::jsonb, '[{"name":"Colour","values":[{"name":"Grey","color":"#626264","image":null,"price":null},{"name":"Orange","color":"#d47536","image":null,"price":null}]}]'::jsonb, '[]'::jsonb, 'null'::jsonb, 10),
('abyss-diana-phi-tc', 'Abyss Diana Phi Tc', null, 'Abyss', 'abyss', 'head-fi', array['closed-back-headphones']::text[], 'Headphones', '', 3949, false, true, 'published', '[{"url":"/shop/products/diana-phi-tc/1.webp","alt":"Abyss Diana Phi Tc"}]'::jsonb, '{"url":"/shop/products/diana-phi-tc/hover.webp"}'::jsonb, '[{"name":"Colour","values":[{"name":"Grey","color":"#6a6971","image":null,"price":null},{"name":"Brown","color":"#6c573a","image":null,"price":4149}]}]'::jsonb, '[]'::jsonb, 'null'::jsonb, 20),
('abyss-diana-mr', 'Abyss DIANA MR', null, 'Abyss', 'abyss', 'head-fi', array['closed-back-headphones']::text[], 'Headphones', '', 2895, false, true, 'published', '[{"url":"/shop/products/diana-mr/1.webp","alt":"Abyss DIANA MR"}]'::jsonb, '{"url":"/shop/products/diana-mr/hover.webp"}'::jsonb, '[{"name":"Finish","values":[{"name":"Finish 1","color":null,"image":"/shop/swatch/diana-mr-1.webp","price":null},{"name":"Finish 2","color":null,"image":"/shop/swatch/diana-mr-2.webp","price":null},{"name":"Finish 3","color":null,"image":"/shop/swatch/diana-mr-3.webp","price":null},{"name":"Finish 4","color":null,"image":"/shop/swatch/diana-mr-4.webp","price":null}]}]'::jsonb, '[]'::jsonb, 'null'::jsonb, 30),
('abyss-diana-dz', 'Abyss DIANA DZ', 'Luxury High Performance Headphones', 'Abyss', 'abyss', 'head-fi', array['closed-back-headphones']::text[], 'Headphones', 'At 315 grams (without ear pads), Diana DZ is the lightest Diana yet, featuring a soft sling headband for added comfort and elegant options like New Zealand Abalone or Forged Carbon inlays. It delivers spacious, highly detailed sound with the highest resolution in the Diana line. The vegan version includes a cactus leather headband and Ultrasuede pads for a slightly softer top end, while lambskin pads enhance detail. Non-ported pads come standard for a linear sub-20 Hz response, with optional magnetic bass-ported pads available separately for sound tuning.', 3795, false, true, 'published', '[{"url":"/shop/products/diana-dz/1.webp","alt":"Abyss DIANA DZ"},{"url":"/shop/products/diana-dz/2.webp","alt":"Abyss DIANA DZ — view 2"},{"url":"/shop/products/diana-dz/3.webp","alt":"Abyss DIANA DZ — view 3"},{"url":"/shop/products/diana-dz/4.webp","alt":"Abyss DIANA DZ — view 4"},{"url":"/shop/products/diana-dz/5.webp","alt":"Abyss DIANA DZ — view 5"},{"url":"/shop/products/diana-dz/6.webp","alt":"Abyss DIANA DZ — view 6"}]'::jsonb, '{"url":"/shop/products/diana-dz/hover.webp"}'::jsonb, '[{"name":"Finish","values":[{"name":"Damascus Forged","color":"#7541da","image":"/shop/swatch/diana-dz-1.webp","price":null},{"name":"Forged Carbon","color":"#323232","image":"/shop/swatch/diana-dz-2.webp","price":null},{"name":"New Zealand Abalone","color":"#d9ad3f","image":"/shop/swatch/diana-dz-3.webp","price":3945}]},{"name":"Cable Length","values":[{"name":"1.5mm","color":null,"image":null,"price":null}]},{"name":"Headphone Connection","values":[{"name":"3.5 mm plug","color":null,"image":null,"price":null},{"name":"6.3 mm (1/4″) plug","color":null,"image":null,"price":null},{"name":"4 pin XLR","color":null,"image":null,"price":null},{"name":"4.4 mm balanced","color":null,"image":null,"price":null}]}]'::jsonb, '[{"label":"Weight","value":"315 Grams; 370-385 Grams Depending On Ear Pad Configuration."},{"label":"Impedance","value":"50 Ohms"},{"label":"Sensitivity","value":"92 DB/Mw"},{"label":"Frequency Response","value":"5 Hz-65 KHz"},{"label":"Impedance","value":"6Ω @1kHz"},{"label":"Includes","value":"A High Quality Headphone Cable By JPS Labs With Choice Of 3.5 Mm, 6.3 Mm (1/4″), 4 Pin XLR Or 4.4 Mm Balanced Plug (Upgrade Superconductor HP Cable May Be Purchased Separately Or As Part Of The Complete Package)."},{"label":"Patented Planar Speakers","value":"Large 63 Mm Patented Planar Speakers Designed Specifically For Diana DZ Deliver The ABYSS Signature Sound With Spacious Soundstage And Powerful Bass."}]'::jsonb, '{"lead":{"title":"Backed by a 10-year warranty from Abyss Audio, ensuring long-term peace of mind and trusted quality. Product registration is required to activate the warranty coverage.","body":"At 315 grams (without ear pads), Diana DZ is the lightest Diana yet, featuring a soft sling headband for added comfort and elegant options like New Zealand Abalone or Forged Carbon inlays. It delivers spacious, highly detailed sound with the highest resolution in the Diana line. The vegan version includes a cactus leather headband and Ultrasuede pads for a slightly softer top end, while lambskin pads enhance detail. Non-ported pads come standard for a linear sub-20 Hz response, with optional magnetic bass-ported pads available separately for sound tuning."},"specsImage":{"url":"/shop/products/diana-dz/specs.webp","alt":"Headphones on a gallery wall"},"specs":[{"label":"Weight","value":"315 Grams; 370-385 Grams Depending On Ear Pad Configuration."},{"label":"Impedance","value":"50 Ohms"},{"label":"Sensitivity","value":"92 DB/Mw"},{"label":"Frequency Response","value":"5 Hz-65 KHz"},{"label":"Impedance","value":"6Ω @1kHz"},{"label":"Includes","value":"A High Quality Headphone Cable By JPS Labs With Choice Of 3.5 Mm, 6.3 Mm (1/4″), 4 Pin XLR Or 4.4 Mm Balanced Plug (Upgrade Superconductor HP Cable May Be Purchased Separately Or As Part Of The Complete Package)."},{"label":"Patented Planar Speakers","value":"Large 63 Mm Patented Planar Speakers Designed Specifically For Diana DZ Deliver The ABYSS Signature Sound With Spacious Soundstage And Powerful Bass."}],"statement":["Backed by a 10-year warranty from Abyss Audio, ensuring long-term ","peace of mind and trusted quality. Product registration is required to activate the warranty coverage."],"storyImages":{"pair":[{"url":"/shop/products/diana-dz/story-1.webp","alt":"Listening to the Diana DZ"},{"url":"/shop/products/diana-dz/story-2.webp","alt":"Diana DZ with a desktop amplifier"}],"wide":{"url":"/shop/products/diana-dz/story-3.webp","alt":"Headphones displayed on a gallery wall"}},"colourShowcase":{"option":"Finish","images":{"Damascus Forged":{"url":"/shop/products/diana-dz/colour-1.webp","alt":"Diana DZ — Damascus Forged"}}},"features":{"heading":["Made in USA Boutique Craftsmanship with Ultra-Light ","Design and Precision Acoustic Engineering"],"images":[{"url":"/shop/products/diana-dz/colour-1.webp","alt":"Diana DZ"},{"url":"/shop/products/diana-dz/1.webp","alt":"Diana DZ — three-quarter view"},{"url":"/shop/products/diana-dz/feature-3.webp","alt":"Diana DZ — detail"}],"items":[{"title":"Premium Materials","body":"Made in the USA with an ultra-light aluminium frame and ceramic finish, offering exceptional strength and precision fit. Includes a premium leather headband, magnetic adjustment, and a protective hard case."},{"title":"Comfort Design","body":"The latest generation Diana headband twists and flexes naturally with the cushion ear pads, while head-shaped foam and a plush “pillow top” cushion ensure exceptional comfort during extended listening sessions."},{"title":"Precision Sound","body":"The open-back design creates a spacious soundstage, enhanced by the Fibonacci side hole pattern optimized specifically for DZ to deliver accurate tuning and refined acoustic performance."}]},"faq":{"intro":"We have gathered the most frequently asked questions from our customers to help you in the best possible way.","items":[{"q":"How sound is the Diana DZ?","a":null},{"q":"What materials and design options are available?","a":null},{"q":"How does the sound perform?","a":null},{"q":"Can I customize the ear pads?","a":null}]}}'::jsonb, 40),
('abyss-diana-v2', 'Abyss Diana V2', null, 'Abyss', 'abyss', 'head-fi', array['closed-back-headphones']::text[], 'Headphones', '', 3495, false, true, 'published', '[{"url":"/shop/products/diana-v2/1.webp","alt":"Abyss Diana V2"}]'::jsonb, '{"url":"/shop/products/diana-v2/hover.webp"}'::jsonb, '[{"name":"Colour","values":[{"name":"Black","color":"#000000","image":null,"price":null},{"name":"Brown","color":"#6c573a","image":null,"price":null}]}]'::jsonb, '[]'::jsonb, 'null'::jsonb, 50),
('abyss-joal', 'ABYSS JOAL', null, 'Abyss', 'abyss', 'head-fi', array['closed-back-headphones']::text[], 'Headphones', '', 1749, false, true, 'published', '[{"url":"/shop/products/joal/1.webp","alt":"ABYSS JOAL"}]'::jsonb, '{"url":"/shop/products/joal/hover.webp"}'::jsonb, '[{"name":"Option","values":[{"name":"Option 1","color":null,"image":null,"price":null},{"name":"Option 2","color":null,"image":null,"price":1879}]}]'::jsonb, '[]'::jsonb, 'null'::jsonb, 60),
('aroma-audio-air-dac', 'Aroma Audio AIR - DAC', null, 'Aroma Audio', 'aroma-audio', 'head-fi', array['closed-back-headphones','headphone-dacs']::text[], 'Headphone DAC', '', 449, false, true, 'published', '[{"url":"/shop/products/aroma-air/1.webp","alt":"Aroma Audio AIR - DAC"}]'::jsonb, '{"url":"/shop/products/aroma-air/hover.webp"}'::jsonb, '[{"name":"Colour","values":[{"name":"Black","color":"#101010","image":null,"price":null}]}]'::jsonb, '[]'::jsonb, 'null'::jsonb, 70)
on conflict (handle) do nothing;
