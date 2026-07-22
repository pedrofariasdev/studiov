-- No schema change required. This migration records that the Facebook OAuth callback URL
-- is intentionally pinned by public.create_facebook_oauth_state.
select 1;
