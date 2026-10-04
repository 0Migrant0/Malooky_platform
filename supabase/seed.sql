-- Safe defaults mirrored from schema.sql. Re-runnable: existing operator values are preserved.
insert into public.vip_config (id, enabled)
values (1, false)
on conflict (id) do nothing;

insert into public.site_settings (key, value) values
  ('payments_enabled', 'true'::jsonb),
  ('whatsapp', '""'::jsonb),
  ('donations_note', '"شكراً لدعمك!"'::jsonb)
on conflict (key) do nothing;

insert into public.payment_methods (key, enabled, instructions_ar, instructions_en) values
  ('stripe', true,
   'الدفع الآمن بالبطاقة عبر Stripe.',
   'Secure card payment via Stripe.'),
  ('whatsapp_transfer', true,
   'حوّل المبلغ ثم ارفع صورة إثبات التحويل وسنتواصل معك على واتساب لتفعيل الوصول.',
   'Transfer the amount, upload the receipt screenshot, and we will activate your access via WhatsApp.')
on conflict (key) do nothing;
