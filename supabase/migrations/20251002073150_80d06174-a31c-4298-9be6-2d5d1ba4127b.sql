-- Add media_urls column to community_posts if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_posts' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE community_posts ADD COLUMN media_urls TEXT[];
  END IF;
END $$;

-- Create post_drafts table
CREATE TABLE IF NOT EXISTS post_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  post_type TEXT,
  tags TEXT[],
  media_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on post_drafts
ALTER TABLE post_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_drafts (drop if exists first)
DROP POLICY IF EXISTS "Users can view their own drafts" ON post_drafts;
DROP POLICY IF EXISTS "Users can create their own drafts" ON post_drafts;
DROP POLICY IF EXISTS "Users can update their own drafts" ON post_drafts;
DROP POLICY IF EXISTS "Users can delete their own drafts" ON post_drafts;

CREATE POLICY "Users can view their own drafts"
  ON post_drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drafts"
  ON post_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts"
  ON post_drafts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts"
  ON post_drafts FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_post_drafts_user_id ON post_drafts(user_id);

-- Create trigger for post_drafts updated_at
CREATE OR REPLACE FUNCTION update_post_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_post_drafts_updated_at ON post_drafts;
CREATE TRIGGER update_post_drafts_updated_at
  BEFORE UPDATE ON post_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_post_drafts_updated_at();