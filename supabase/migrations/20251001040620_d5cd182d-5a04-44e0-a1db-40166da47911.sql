-- Create function to increment/decrement credits
CREATE OR REPLACE FUNCTION public.increment_credits(
  user_id UUID,
  amount INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET credits = GREATEST(credits + amount, 0)
  WHERE profiles.user_id = increment_credits.user_id;
END;
$$;