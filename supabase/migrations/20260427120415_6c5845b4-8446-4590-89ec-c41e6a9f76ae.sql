-- Lock down trigger-only SECURITY DEFINER functions: revoke EXECUTE from PUBLIC/anon/authenticated.
-- These are invoked exclusively by triggers (which run as table owner) so revoking client EXECUTE
-- has no functional impact, only removes the ability to call them as RPCs.
REVOKE EXECUTE ON FUNCTION public.enforce_allowed_email() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_transaction_to_ledger() FROM PUBLIC, anon, authenticated;

-- is_allowed_user() must stay callable by authenticated users (used in RLS policies).
-- Revoke from anon only (RLS evaluation runs with definer rights so authenticated grant remains).
REVOKE EXECUTE ON FUNCTION public.is_allowed_user() FROM anon;