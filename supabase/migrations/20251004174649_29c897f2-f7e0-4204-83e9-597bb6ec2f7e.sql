-- Add unique username field to profiles
ALTER TABLE public.profiles 
ADD COLUMN username text UNIQUE;

-- Create an index for faster username searches
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Create a function to generate a unique username from display name
CREATE OR REPLACE FUNCTION public.generate_username(base_name text, user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  username_candidate text;
  counter integer := 0;
BEGIN
  -- Clean base name: lowercase, replace spaces with underscores, remove special chars
  base_name := lower(regexp_replace(base_name, '[^a-zA-Z0-9]', '', 'g'));
  
  -- Start with base name
  username_candidate := base_name;
  
  -- Keep trying until we find a unique username
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = username_candidate AND profiles.user_id != generate_username.user_id) LOOP
    counter := counter + 1;
    username_candidate := base_name || counter::text;
  END LOOP;
  
  RETURN username_candidate;
END;
$$;

-- Update existing profiles with usernames based on display_name
UPDATE public.profiles
SET username = generate_username(COALESCE(display_name, 'user'), user_id)
WHERE username IS NULL;

-- Make username NOT NULL after populating existing records
ALTER TABLE public.profiles 
ALTER COLUMN username SET NOT NULL;

-- Update the handle_new_user function to generate username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  initial_display_name text;
BEGIN
  initial_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1));
  
  INSERT INTO public.profiles (user_id, display_name, username, credits)
  VALUES (
    NEW.id,
    initial_display_name,
    generate_username(initial_display_name, NEW.id),
    50
  );
  RETURN NEW;
END;
$$;