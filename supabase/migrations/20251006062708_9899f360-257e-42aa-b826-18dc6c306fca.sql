-- Create achievements table
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL CHECK (category IN ('learning', 'mentorship', 'community', 'streak', 'special')),
  points integer NOT NULL DEFAULT 0,
  rarity text NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  max_progress integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(name)
);

-- Create user achievements table (junction table for unlocked achievements)
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, achievement_id)
);

-- Create user stats table for tracking gamification metrics
CREATE TABLE public.user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_points integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  lessons_completed integer DEFAULT 0,
  sessions_completed integer DEFAULT 0,
  posts_created integer DEFAULT 0,
  comments_made integer DEFAULT 0,
  badges_earned integer DEFAULT 0,
  level integer DEFAULT 1,
  experience integer DEFAULT 0,
  experience_to_next integer DEFAULT 100,
  last_activity_date date,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (public read-only)
CREATE POLICY "Anyone can view achievements" ON public.achievements
  FOR SELECT USING (true);

-- RLS Policies for user achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for user stats
CREATE POLICY "Users can view their own stats" ON public.user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON public.user_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON public.user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, points, rarity, max_progress) VALUES
-- Learning Achievements
('First Steps', 'Complete your first lesson', '🎓', 'learning', 50, 'common', 1),
('Lesson Master', 'Complete 10 lessons', '📚', 'learning', 200, 'rare', 10),
('Scholar', 'Complete 50 lessons', '🎓', 'learning', 500, 'epic', 50),
('Wisdom Seeker', 'Complete 100 lessons', '🧠', 'learning', 1000, 'legendary', 100),

-- Mentorship Achievements
('Mentee', 'Complete your first mentorship session', '🤝', 'mentorship', 100, 'common', 1),
('Session Expert', 'Complete 25 mentorship sessions', '🎯', 'mentorship', 750, 'epic', 25),

-- Community Achievements
('Voice of Wisdom', 'Create your first post', '📝', 'community', 25, 'common', 1),
('Thoughtful Commenter', 'Leave 10 comments', '💬', 'community', 100, 'rare', 10),
('Community Builder', 'Create 50 posts', '🌟', 'community', 300, 'epic', 50),

-- Streak Achievements
('Week Warrior', 'Maintain a 7-day streak', '🔥', 'streak', 150, 'rare', 7),
('Monthly Master', 'Maintain a 30-day streak', '🚀', 'streak', 500, 'epic', 30),
('Century Champion', 'Maintain a 100-day streak', '👑', 'streak', 2000, 'legendary', 100),

-- Special Achievements
('Perfect Score', 'Get 100% on a quiz', '🎖️', 'special', 75, 'rare', 1),
('Five-Star Mentor', 'Receive a 5-star review as a mentor', '⭐', 'special', 200, 'epic', 1);

-- Function to create user stats when profile is created
CREATE OR REPLACE FUNCTION public.create_user_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.user_id);
  RETURN NEW;
END;
$$;

-- Trigger to create user stats on profile creation
CREATE TRIGGER on_profile_created_create_stats
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_user_stats();

-- Function to update user stats
CREATE OR REPLACE FUNCTION public.update_user_stats(
  p_user_id uuid,
  p_stat_type text,
  p_increment integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  current_streak integer;
  longest_streak integer;
  last_activity date;
  today date := CURRENT_DATE;
BEGIN
  -- Update the specific stat
  CASE p_stat_type
    WHEN 'lessons_completed' THEN
      UPDATE public.user_stats
      SET lessons_completed = lessons_completed + p_increment,
          total_points = total_points + (p_increment * 10), -- 10 points per lesson
          experience = experience + (p_increment * 10),
          last_activity_date = today,
          updated_at = now()
      WHERE user_id = p_user_id;
    WHEN 'sessions_completed' THEN
      UPDATE public.user_stats
      SET sessions_completed = sessions_completed + p_increment,
          total_points = total_points + (p_increment * 25), -- 25 points per session
          experience = experience + (p_increment * 25),
          last_activity_date = today,
          updated_at = now()
      WHERE user_id = p_user_id;
    WHEN 'posts_created' THEN
      UPDATE public.user_stats
      SET posts_created = posts_created + p_increment,
          total_points = total_points + (p_increment * 5), -- 5 points per post
          experience = experience + (p_increment * 5),
          last_activity_date = today,
          updated_at = now()
      WHERE user_id = p_user_id;
    WHEN 'comments_made' THEN
      UPDATE public.user_stats
      SET comments_made = comments_made + p_increment,
          total_points = total_points + (p_increment * 2), -- 2 points per comment
          experience = experience + (p_increment * 2),
          last_activity_date = today,
          updated_at = now()
      WHERE user_id = p_user_id;
    WHEN 'activity' THEN
      -- Special handling for daily activity (streak tracking)
      UPDATE public.user_stats
      SET last_activity_date = today,
          updated_at = now()
      WHERE user_id = p_user_id;
  END CASE;

  -- Handle streak logic
  SELECT current_streak, longest_streak, last_activity_date
  INTO current_streak, longest_streak, last_activity
  FROM public.user_stats
  WHERE user_id = p_user_id;

  IF last_activity IS NULL OR last_activity < today - INTERVAL '1 day' THEN
    -- Reset streak if more than a day has passed
    UPDATE public.user_stats
    SET current_streak = 1
    WHERE user_id = p_user_id;
  ELSIF last_activity = today - INTERVAL '1 day' THEN
    -- Continue streak
    UPDATE public.user_stats
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1)
    WHERE user_id = p_user_id;
  END IF;

  -- Check for level ups
  UPDATE public.user_stats
  SET level = level + 1,
      experience = experience - experience_to_next,
      experience_to_next = (level + 1) * 100
  WHERE user_id = p_user_id
    AND experience >= experience_to_next;
END;
$$;

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION public.check_achievements(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_stats_record record;
  achievement_record record;
BEGIN
  -- Get user stats
  SELECT * INTO user_stats_record
  FROM public.user_stats
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Check each achievement
  FOR achievement_record IN SELECT * FROM public.achievements
  LOOP
    -- Skip if already unlocked
    IF EXISTS (
      SELECT 1 FROM public.user_achievements
      WHERE user_id = p_user_id AND achievement_id = achievement_record.id
    ) THEN
      CONTINUE;
    END IF;

    -- Check unlock conditions
    CASE achievement_record.id
      WHEN 'first-lesson' THEN
        IF user_stats_record.lessons_completed >= 1 THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement_record.id);
          PERFORM public.update_user_stats(p_user_id, 'points', achievement_record.points);
        END IF;
      WHEN 'lesson-master' THEN
        IF user_stats_record.lessons_completed >= 10 THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement_record.id);
          PERFORM public.update_user_stats(p_user_id, 'points', achievement_record.points);
        END IF;
      WHEN 'scholar' THEN
        IF user_stats_record.lessons_completed >= 50 THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement_record.id);
          PERFORM public.update_user_stats(p_user_id, 'points', achievement_record.points);
        END IF;
      WHEN 'wisdom-seeker' THEN
        IF user_stats_record.lessons_completed >= 100 THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement_record.id);
          PERFORM public.update_user_stats(p_user_id, 'points', achievement_record.points);
        END IF;
      WHEN 'mentee' THEN
        IF user_stats_record.sessions_completed >= 1 THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement_record.id);
          PERFORM public.update_user_stats(p_user_id, 'points', achievement_record.points);
        END IF;
      WHEN 'session-expert' THEN
        IF user_stats_record.sessions_completed >= 25 THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement_record.id);
          PERFORM public.update_user_stats(p_user_id, 'points', achievement_record.points);
        END IF;
      WHEN 'voice-of-wisdom' THEN
        IF user_stats_record.posts_created >= 1 THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement_record.id);
          PERFORM public.update_user_stats(p_user_id, 'points', achievement_record.points);
        END IF;
      WHEN 'thoughtful-commenter' THEN
        IF user_stats_record.comments_made >= 10 THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement_record.id);
          PERFORM public.update_user_stats(p_user_id, 'points', achievement_record.points);
        END IF;
      WHEN 'community-builder' THEN
        IF user_stats_record.posts_created >= 50 THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement_record.id);
          PERFORM public.update_user_stats(p_user_id, 'points', achievement_record.points);
        END IF;
      WHEN 'week-warrior' THEN
        IF user_stats_record.current_streak >= 7 THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement_record.id);
          PERFORM public.update_user_stats(p_user_id, 'points', achievement_record.points);
        END IF;
      WHEN 'monthly-master' THEN
        IF user_stats_record.longest_streak >= 30 THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement_record.id);
          PERFORM public.update_user_stats(p_user_id, 'points', achievement_record.points);
        END IF;
      WHEN 'century-champion' THEN
        IF user_stats_record.longest_streak >= 100 THEN
          INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (p_user_id, achievement_record.id);
          PERFORM public.update_user_stats(p_user_id, 'points', achievement_record.points);
        END IF;
    END CASE;
  END LOOP;
END;
$$;

-- Add trigger to update stats when posts are created
CREATE OR REPLACE FUNCTION public.on_post_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public.update_user_stats(NEW.user_id, 'posts_created');
  PERFORM public.check_achievements(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_post_created_update_stats
  AFTER INSERT ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.on_post_created();

-- Add trigger to update stats when comments are created
CREATE OR REPLACE FUNCTION public.on_comment_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public.update_user_stats(NEW.user_id, 'comments_made');
  PERFORM public.check_achievements(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_comment_created_update_stats
  AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.on_comment_created();

-- Update trigger for updated_at on user_stats
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();