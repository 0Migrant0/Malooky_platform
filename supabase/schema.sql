-- ============================================================
-- MALOOKY — Supabase schema + RLS + defaults
-- شغّل هذا الملف كاملاً في SQL Editor داخل لوحة Supabase
-- ============================================================

create extension if not exists "pgcrypto";

-- ============ الجداول ============

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  whatsapp text,
  role text not null default 'student' check (role in ('admin','student')),
  created_at timestamptz not null default now()
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_ar text not null,
  title_en text,
  subtitle_ar text,
  subtitle_en text,
  kind text not null default 'main' check (kind in ('main','vip','consult')),
  sort int not null default 0,
  cover_url text,
  is_new boolean not null default true,
  is_published boolean not null default false,
  relation text not null default 'sequential' check (relation in ('sequential','unrelated')),
  price_cents int,
  stripe_price_id text,
  is_free boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists levels (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title_ar text not null,
  title_en text,
  description_ar text,
  description_en text,
  sort int not null default 0,
  relation text not null default 'sequential' check (relation in ('sequential','unrelated')),
  price_cents int,
  is_free boolean not null default false
);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references levels(id) on delete cascade,
  subsection text not null default 'exercises'
    check (subsection in ('exercises','writing','mistakes','feedback','faq')),
  title_ar text not null,
  title_en text,
  kind text not null default 'video' check (kind in ('video','drive','text')),
  sort int not null default 0,
  duration_seconds int,
  bunny_video_id text,
  drive_url text,
  body_ar text,
  body_en text,
  is_free_preview boolean not null default false,
  langs jsonb -- ["ar","en"] — كل لغة فيديو منفصل مرفوع خاص بها
);

-- نسخ الدبلجة: ملف فيديو مستقل لكل لغة داخل نفس الدرس
create table if not exists lesson_videos (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  lang text not null check (lang in ('ar','en')),
  bunny_video_id text not null,
  duration_seconds int,
  unique (lesson_id, lang)
);

create table if not exists progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  level_id uuid references levels(id) on delete cascade,
  source text not null default 'manual' check (source in ('purchase','manual','grant','free','vip')),
  granted_at timestamptz not null default now(),
  unique (user_id, course_id, level_id)
);

create table if not exists packages (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text,
  description_ar text,
  description_en text,
  price_cents int not null,
  course_ids jsonb, -- null = كل الكورسات
  all_courses boolean not null default false,
  stripe_price_id text,
  is_active boolean not null default true,
  sort int not null default 0
);

create table if not exists coupons (
  code text primary key,
  percent_off int not null check (percent_off between 1 and 100),
  active boolean not null default true,
  expires_at timestamptz
);

create table if not exists manual_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  full_name text,
  package_id uuid references packages(id) on delete set null,
  course_id uuid references courses(id) on delete set null,
  level_id uuid references levels(id) on delete set null,
  amount int,
  proof_url text not null,
  whatsapp text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists payment_methods (
  id uuid primary key default gen_random_uuid(),
  key text not null unique, -- 'stripe' | 'whatsapp_transfer' | ...
  enabled boolean not null default true,
  instructions_ar text,
  instructions_en text
);

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  avatar_url text,
  rating int not null default 5 check (rating between 1 and 5),
  body_ar text not null,
  body_en text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists top_students (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  avatar_url text,
  reason_ar text,
  reason_en text,
  sort int not null default 0
);

create table if not exists student_works (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  image_url text not null,
  caption_ar text,
  caption_en text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  question_ar text not null,
  question_en text,
  answer_ar text not null,
  answer_en text,
  video_lesson_id uuid references lessons(id) on delete set null,
  sort int not null default 0
);

create table if not exists consult_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  status text not null default 'new' check (status in ('new','contacted','closed')),
  created_at timestamptz not null default now()
);

create table if not exists donations (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  amount_cents int not null,
  source text not null default 'stripe' check (source in ('stripe','manual')),
  created_at timestamptz not null default now()
);

create table if not exists vip_config (
  id int primary key default 1 check (id = 1),
  enabled boolean not null default false,
  title_ar text,
  title_en text,
  starts_at timestamptz,
  join_url text,
  description_ar text,
  description_en text
);

create table if not exists site_settings (
  key text primary key,
  value jsonb not null
);

create table if not exists playback_tickets (
  token uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  lang text not null default 'ar',
  expires_at timestamptz not null,
  used bool not null default false
);

-- Append-only record of successful admin changes. Sensitive fields are excluded by the API.
create table if not exists admin_audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_logs_created_at_idx on admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_entity_idx on admin_audit_logs (entity_type, entity_id);

-- ============ دوال ومشغّلات ============

-- إنشاء profile تلقائياً عند إنشاء مستخدم (دور افتراضي student)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- منع تعديل الدور من قبل المستخدم العادي — يتم عبر service role فقط

-- ============ تفعيل RLS ============

alter table profiles enable row level security;
alter table courses enable row level security;
alter table levels enable row level security;
alter table lessons enable row level security;
alter table lesson_videos enable row level security;
alter table progress enable row level security;
alter table access enable row level security;
alter table packages enable row level security;
alter table coupons enable row level security;
alter table manual_orders enable row level security;
alter table payment_methods enable row level security;
alter table testimonials enable row level security;
alter table top_students enable row level security;
alter table student_works enable row level security;
alter table faqs enable row level security;
alter table consult_requests enable row level security;
alter table donations enable row level security;
alter table vip_config enable row level security;
alter table site_settings enable row level security;
alter table playback_tickets enable row level security;
alter table admin_audit_logs enable row level security;

-- Helper: هل المستخدم أدمن؟
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Audit logs are readable only by administrators. Writes happen server-side using service role.
drop policy if exists "admin reads audit logs" on admin_audit_logs;
create policy "admin reads audit logs" on admin_audit_logs for select using (public.is_admin());

-- profiles: المستخدم يقرأ نفسه؛ الأدمن يقرأ الجميع؛ التعديل عبر service role
drop policy if exists "read own profile" on profiles;
create policy "read own profile" on profiles for select
  using (auth.uid() = id or public.is_admin());

-- المحتوى العام يُقرأ فقط إذا كان منشوراً (والأدمن يرى الكل)
drop policy if exists "public read published courses" on courses;
create policy "public read published courses" on courses for select
  using (is_published = true or public.is_admin());
drop policy if exists "public read levels of published" on levels;
create policy "public read levels of published" on levels for select
  using (exists (select 1 from courses c where c.id = course_id and (c.is_published or public.is_admin())));
drop policy if exists "public read lessons of published" on lessons;
create policy "public read lessons of published" on lessons for select
  using (exists (
    select 1 from levels l join courses c on c.id = l.course_id
    where l.id = level_id and (c.is_published or public.is_admin())
  ));
drop policy if exists "read lesson videos" on lesson_videos;
create policy "read lesson videos" on lesson_videos for select
  using (exists (
    select 1 from lessons l join levels lv on lv.id = l.level_id join courses c on c.id = lv.course_id
    where l.id = lesson_id and (c.is_published or public.is_admin())
  ));

-- packages/faqs/testimonials/approved/top_students/payment_methods/vip: قراءة عامة (المحتوى المنشور)
drop policy if exists "public read packages" on packages;
create policy "public read packages" on packages for select using (is_active or public.is_admin());
drop policy if exists "public read faqs" on faqs;
create policy "public read faqs" on faqs for select using (true);
drop policy if exists "public read testimonials" on testimonials;
create policy "public read testimonials" on testimonials for select using (approved or public.is_admin());
drop policy if exists "public read top students" on top_students;
create policy "public read top students" on top_students for select using (true);
drop policy if exists "public read works" on student_works;
create policy "public read works" on student_works for select using (approved or public.is_admin());
drop policy if exists "public read payment methods" on payment_methods;
create policy "public read payment methods" on payment_methods for select using (true);
drop policy if exists "public read vip" on vip_config;
create policy "public read vip" on vip_config for select using (true);
drop policy if exists "public read settings" on site_settings;
create policy "public read settings" on site_settings for select using (true);
drop policy if exists "public read coupons" on coupons;
create policy "public read coupons" on coupons for select using (false); -- تُستخدم على السيرفر فقط

-- progress: المستخدم يقرأ/يكتب تقدمه فقط
drop policy if exists "own progress" on progress;
create policy "own progress" on progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- access: المستخدم يقرأ وصوله فقط؛ الكتابة عبر service role
drop policy if exists "own access" on access;
create policy "own access" on access for select using (auth.uid() = user_id or public.is_admin());

-- manual_orders: المستخدم يرى طلباته فقط؛ الإنشاء عبر API (service role)
drop policy if exists "own manual orders" on manual_orders;
create policy "own manual orders" on manual_orders for select
  using (auth.uid() = user_id or public.is_admin());

-- consult_requests: الإنشاء عبر API فقط؛ القراءة للأدمن
drop policy if exists "admin reads consults" on consult_requests;
create policy "admin reads consults" on consult_requests for select using (public.is_admin());

-- donations: قراءة للأدمن فقط (المجاميع العامة تعرض عبر API)
drop policy if exists "admin reads donations" on donations;
create policy "admin reads donations" on donations for select using (public.is_admin());

-- playback_tickets: صارمة — لا قراءة مباشرة؛ تُستهلك عبر API بتحقق server-side
drop policy if exists "no direct tickets" on playback_tickets;
create policy "no direct tickets" on playback_tickets for select using (false);

-- الكتابة على جداول المحتوى: عبر service role فقط (لا سياسات insert/update عامة)

-- ============ إعدادات افتراضية ============

insert into vip_config (id, enabled) values (1, false) on conflict (id) do nothing;

insert into site_settings (key, value) values
  ('payments_enabled', 'true'),
  ('whatsapp', '""'),
  ('donations_note', 'شكراً لدعمك!')
on conflict (key) do nothing;

insert into payment_methods (key, enabled, instructions_ar, instructions_en) values
  ('stripe', true,
   'الدفع الآمن بالبطاقة عبر Stripe.',
   'Secure card payment via Stripe.'),
  ('whatsapp_transfer', true,
   'حوّل المبلغ ثم ارفع صورة إثبات التحويل وسنتواصل معك على واتساب لتفعيل الوصول.',
   'Transfer the amount, upload the receipt screenshot, and we will activate your access via WhatsApp.')
on conflict (key) do nothing;

-- يتم إنشاء الكورسات والمحتوى الحقيقي من لوحة الإدارة؛ لا تُضاف بيانات تجريبية عند إعداد قاعدة بيانات جديدة.
