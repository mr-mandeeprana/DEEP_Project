-- Learning & Education Platform Database Schema

-- Create enum types
CREATE TYPE public.course_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.lesson_type AS ENUM ('video', 'audio', 'text', 'quiz', 'assignment');
CREATE TYPE public.quiz_type AS ENUM ('multiple_choice', 'true_false', 'short_answer', 'essay');
CREATE TYPE public.enrollment_status AS ENUM ('enrolled', 'in_progress', 'completed', 'dropped');
CREATE TYPE public.certificate_status AS ENUM ('pending', 'issued', 'revoked');

-- Courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  instructor_id UUID REFERENCES auth.users(id),
  instructor_name TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  status course_status DEFAULT 'draft',
  thumbnail_url TEXT,
  duration_hours INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  prerequisites TEXT[] DEFAULT '{}',
  learning_objectives TEXT[] DEFAULT '{}',
  price_cents INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  enrollment_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Course sections (modules)
CREATE TABLE public.course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  duration_hours INTEGER DEFAULT 0,
  lesson_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Lessons table
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.course_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  lesson_type lesson_type NOT NULL,
  content TEXT, -- For text lessons
  video_url TEXT, -- For video lessons
  audio_url TEXT, -- For audio lessons
  duration_minutes INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL,
  is_preview BOOLEAN DEFAULT false,
  resources JSONB DEFAULT '{}', -- Additional files, links, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Quizzes table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quiz_type quiz_type NOT NULL,
  time_limit_minutes INTEGER,
  passing_score INTEGER DEFAULT 70,
  max_attempts INTEGER DEFAULT 3,
  shuffle_questions BOOLEAN DEFAULT true,
  show_answers BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Quiz questions
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type quiz_type NOT NULL,
  options JSONB, -- For multiple choice options
  correct_answer TEXT, -- Store correct answer
  explanation TEXT, -- Explanation for the answer
  points INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User enrollments
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status enrollment_status DEFAULT 'enrolled',
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  current_lesson_id UUID REFERENCES public.lessons(id),
  total_time_spent_minutes INTEGER DEFAULT 0,
  UNIQUE(user_id, course_id)
);

-- Lesson progress
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
  time_spent_minutes INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Quiz attempts
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score DECIMAL(5,2),
  max_score DECIMAL(5,2),
  passed BOOLEAN,
  time_spent_minutes INTEGER,
  answers JSONB DEFAULT '{}', -- Store user answers
  UNIQUE(user_id, quiz_id, attempt_number)
);

-- Certificates
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  status certificate_status DEFAULT 'issued',
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP WITH TIME ZONE,
  verification_url TEXT UNIQUE,
  certificate_data JSONB DEFAULT '{}', -- Store certificate details
  UNIQUE(user_id, course_id)
);

-- Learning paths
CREATE TABLE public.learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_hours INTEGER DEFAULT 0,
  course_ids UUID[] DEFAULT '{}', -- Array of course IDs in this path
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User learning preferences/interests
CREATE TABLE public.user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  interest_level INTEGER CHECK (interest_level BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Course reviews
CREATE TABLE public.course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Courses: Public read, admin write
CREATE POLICY "Courses are viewable by everyone" ON public.courses
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage courses" ON public.courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Course sections: Public read for published courses, admin write
CREATE POLICY "Course sections are viewable by everyone" ON public.course_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = course_sections.course_id AND status = 'published'
    )
  );

CREATE POLICY "Admins can manage course sections" ON public.course_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Lessons: Public read for published courses, admin write
CREATE POLICY "Lessons are viewable by everyone" ON public.lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = lessons.course_id AND status = 'published'
    )
  );

CREATE POLICY "Admins can manage lessons" ON public.lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Quizzes and questions: Public read for enrolled users, admin write
CREATE POLICY "Quizzes are viewable by enrolled users" ON public.quizzes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.lessons l ON l.id = quizzes.lesson_id
      WHERE e.course_id = l.course_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage quizzes" ON public.quizzes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Quiz questions are viewable by enrolled users" ON public.quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.quizzes q ON q.id = quiz_questions.quiz_id
      JOIN public.lessons l ON l.id = q.lesson_id
      WHERE e.course_id = l.course_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage quiz questions" ON public.quiz_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Enrollments: Users can view/manage their own, admins can view all
CREATE POLICY "Users can view their own enrollments" ON public.enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll themselves" ON public.enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments" ON public.enrollments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all enrollments" ON public.enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Lesson progress: Users own their progress
CREATE POLICY "Users can manage their lesson progress" ON public.lesson_progress
  FOR ALL USING (auth.uid() = user_id);

-- Quiz attempts: Users own their attempts
CREATE POLICY "Users can manage their quiz attempts" ON public.quiz_attempts
  FOR ALL USING (auth.uid() = user_id);

-- Certificates: Users can view their own, admins can view all
CREATE POLICY "Users can view their own certificates" ON public.certificates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all certificates" ON public.certificates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Learning paths: Public read, admin write
CREATE POLICY "Learning paths are viewable by everyone" ON public.learning_paths
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage learning paths" ON public.learning_paths
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- User interests: Users can manage their own
CREATE POLICY "Users can manage their interests" ON public.user_interests
  FOR ALL USING (auth.uid() = user_id);

-- Course reviews: Public read, authenticated users can write
CREATE POLICY "Course reviews are viewable by everyone" ON public.course_reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON public.course_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.course_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_courses_category ON public.courses(category);
CREATE INDEX idx_courses_status ON public.courses(status);
CREATE INDEX idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX idx_lesson_progress_user ON public.lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson ON public.lesson_progress(lesson_id);
CREATE INDEX idx_certificates_user ON public.certificates(user_id);
CREATE INDEX idx_certificates_course ON public.certificates(course_id);

-- Create triggers for updated_at
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Functions for course progress calculation
CREATE OR REPLACE FUNCTION public.update_course_progress(p_enrollment_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_lessons INTEGER;
  completed_lessons INTEGER;
  progress_percentage DECIMAL(5,2);
BEGIN
  -- Calculate total lessons in the course
  SELECT COUNT(*) INTO total_lessons
  FROM public.lessons l
  JOIN public.enrollments e ON e.course_id = l.course_id
  WHERE e.id = p_enrollment_id;

  -- Calculate completed lessons
  SELECT COUNT(*) INTO completed_lessons
  FROM public.lesson_progress lp
  WHERE lp.enrollment_id = p_enrollment_id AND lp.status = 'completed';

  -- Calculate progress percentage
  IF total_lessons > 0 THEN
    progress_percentage := (completed_lessons::DECIMAL / total_lessons::DECIMAL) * 100;
  ELSE
    progress_percentage := 0;
  END IF;

  -- Update enrollment progress
  UPDATE public.enrollments
  SET progress_percentage = progress_percentage,
      status = CASE
        WHEN progress_percentage >= 100 THEN 'completed'::enrollment_status
        WHEN progress_percentage > 0 THEN 'in_progress'::enrollment_status
        ELSE 'enrolled'::enrollment_status
      END,
      completed_at = CASE
        WHEN progress_percentage >= 100 AND completed_at IS NULL THEN now()
        ELSE completed_at
      END
  WHERE id = p_enrollment_id;
END;
$$;

-- Function to generate certificates
CREATE OR REPLACE FUNCTION public.generate_certificate(p_enrollment_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment RECORD;
  v_certificate_id UUID;
  v_certificate_number TEXT;
BEGIN
  -- Get enrollment details
  SELECT * INTO v_enrollment
  FROM public.enrollments
  WHERE id = p_enrollment_id AND status = 'completed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment not found or not completed';
  END IF;

  -- Generate unique certificate number
  v_certificate_number := 'CERT-' || UPPER(SUBSTRING(MD5(random()::text) FROM 1 FOR 8)) || '-' || EXTRACT(YEAR FROM now());

  -- Create certificate
  INSERT INTO public.certificates (
    user_id,
    course_id,
    enrollment_id,
    certificate_number,
    verification_url,
    certificate_data
  )
  SELECT
    v_enrollment.user_id,
    v_enrollment.course_id,
    v_enrollment.id,
    v_certificate_number,
    'https://yourapp.com/verify/' || v_certificate_number,
    jsonb_build_object(
      'course_title', c.title,
      'instructor', c.instructor_name,
      'completion_date', v_enrollment.completed_at,
      'duration_hours', c.duration_hours,
      'difficulty', c.difficulty_level
    )
  FROM public.courses c
  WHERE c.id = v_enrollment.course_id
  RETURNING id INTO v_certificate_id;

  RETURN v_certificate_id;
END;
$$;

-- Insert sample course data
INSERT INTO public.courses (title, description, short_description, instructor_name, category, tags, status, duration_hours, total_lessons, difficulty_level, learning_objectives, is_free) VALUES
('Mindfulness Meditation Fundamentals', 'Learn the essential techniques of mindfulness meditation for stress reduction and mental clarity.', 'Master the basics of mindfulness meditation.', 'Dr. Sarah Chen', 'mindfulness', ARRAY['meditation', 'stress-relief', 'mental-health'], 'published', 8, 12, 'beginner', ARRAY['Understand mindfulness principles', 'Practice basic meditation techniques', 'Develop daily meditation habits'], true),
('Spiritual Psychology Essentials', 'Explore the intersection of spirituality and psychology for personal growth.', 'Bridge between spiritual wisdom and modern psychology.', 'Dr. Michael Rodriguez', 'psychology', ARRAY['spirituality', 'psychology', 'personal-growth'], 'published', 15, 20, 'intermediate', ARRAY['Understand spiritual psychology concepts', 'Apply psychological principles to spiritual practice', 'Integrate spirituality into daily life'], false),
('Advanced Yoga Philosophy', 'Deep dive into the philosophical foundations of yoga and spiritual practice.', 'Explore the deeper meaning behind yoga practices.', 'Swami Arjun', 'yoga', ARRAY['yoga', 'philosophy', 'spirituality'], 'published', 12, 16, 'advanced', ARRAY['Understand yoga philosophy', 'Connect asanas with spiritual principles', 'Apply yogic wisdom to modern life'], true);

-- Insert sample lessons
INSERT INTO public.lessons (course_id, title, description, lesson_type, content, duration_minutes, order_index, is_preview) VALUES
((SELECT id FROM public.courses WHERE title = 'Mindfulness Meditation Fundamentals' LIMIT 1), 'Introduction to Mindfulness', 'Understanding what mindfulness is and why it matters.', 'text', 'Mindfulness is the practice of being fully present and engaged with whatever we''re doing at the moment — free from distraction or judgment...', 10, 1, true),
((SELECT id FROM public.courses WHERE title = 'Mindfulness Meditation Fundamentals' LIMIT 1), 'Basic Breathing Techniques', 'Learn fundamental breathing exercises for meditation.', 'video', 'Video content for breathing techniques', 15, 2, false);

-- Insert sample quiz
INSERT INTO public.quizzes (lesson_id, title, description, quiz_type, passing_score, max_attempts) VALUES
((SELECT id FROM public.lessons WHERE title = 'Introduction to Mindfulness' LIMIT 1), 'Mindfulness Basics Quiz', 'Test your understanding of mindfulness concepts.', 'multiple_choice', 80, 3);