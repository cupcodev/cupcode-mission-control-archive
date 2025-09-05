-- Fix is_user_manager to include superadmin so admins and superadmins can view all profiles via RLS
CREATE OR REPLACE FUNCTION public.is_user_manager()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager', 'superadmin')
  );
END;
$function$;