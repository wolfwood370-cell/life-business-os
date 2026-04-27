-- Remove default PUBLIC grant; keep only authenticated which already has EXECUTE.
REVOKE EXECUTE ON FUNCTION public.is_allowed_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_allowed_user() TO authenticated;