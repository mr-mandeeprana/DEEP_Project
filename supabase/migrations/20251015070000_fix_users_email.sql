-- Fix user management by adding email column to profiles table
-- This allows the admin Users page to display and search users by email

-- Add email field to profiles (this will be populated by a trigger)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email text;

-- Create function to populate email from auth.users
CREATE OR REPLACE FUNCTION public.populate_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Get the email from auth.users and update the profile
  UPDATE public.profiles
  SET email = (SELECT email FROM auth.users WHERE id = NEW.user_id)
  WHERE user_id = NEW.user_id AND (email IS NULL OR email = '');

  RETURN NEW;
END;
$$;

-- Create trigger to automatically populate email when profile is created/updated
DROP TRIGGER IF EXISTS populate_profile_email_trigger ON public.profiles;
CREATE TRIGGER populate_profile_email_trigger
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.populate_profile_email();

-- Populate existing profiles with emails
UPDATE public.profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.user_id = auth.users.id
AND (profiles.email IS NULL OR profiles.email = '');

-- Create index for faster email searches
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);