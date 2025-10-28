-- Fix function search path security issue
CREATE OR REPLACE FUNCTION cleanup_expired_guest_sessions()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM guest_sessions WHERE expires_at < NOW();
END;
$$;