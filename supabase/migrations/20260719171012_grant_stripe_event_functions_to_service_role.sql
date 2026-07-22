grant execute on function public.begin_stripe_webhook_event(text, text, jsonb) to service_role;
grant execute on function public.complete_stripe_webhook_event(text) to service_role;
grant execute on function public.fail_stripe_webhook_event(text, text) to service_role;
