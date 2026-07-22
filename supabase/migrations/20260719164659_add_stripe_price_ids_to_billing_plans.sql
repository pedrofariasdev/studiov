alter table public.billing_plans
  add column if not exists stripe_monthly_price_id text,
  add column if not exists stripe_yearly_price_id text;

comment on column public.billing_plans.stripe_monthly_price_id is 'Stripe recurring monthly Price ID for this billing plan.';
comment on column public.billing_plans.stripe_yearly_price_id is 'Stripe recurring yearly Price ID for this billing plan.';
