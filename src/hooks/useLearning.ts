import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useGamification } from './useGamification';
import { toast } from '@/hooks/use-toast';

interface Course {
  id: string;
  title: string;
  description: string;
  short_description: string;
  instructor_name: string;
  category: string;
  tags: string[];
  thumbnail_url?: string;
  duration_hours: number;
  total_lessons: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  review_count: number;
  enrollment_count: number;
  is_free: boolean;
  price_cents: number;
  status: string;
}

interface Enrollment {
  id: string;
  course_id: string;
  status: string;
  progress_percentage: number;
  enrolled_at: string;
  completed_at?: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  lesson_type: string;
  order_index: number;
  duration_minutes: number;
  is_preview: boolean;
}

export const useLearning = () => {
  const { user } = useAuth();
  const { awardPoints } = useGamification();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all published courses
  const fetchCourses = async (category?: string) => {
    setIsLoading(true);
    console.log('fetchCourses called with category:', category);
    try {
      let query = supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      console.log('Executing query for courses...');
      const { data, error } = await query;
      console.log('Query result - data length:', data?.length, 'error:', error);

      if (error) throw error;

      setCourses(data || []);
      console.log('Courses set in state:', data?.length || 0);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      console.log('fetchCourses completed, isLoading set to false');
    }
  };

  // Fetch user's enrollments
  const fetchEnrollments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  // Enroll in a course
  const enrollInCourse = async (courseId: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to enroll in courses',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Check if already enrolled
      const existingEnrollment = enrollments.find(e => e.course_id === courseId);
      if (existingEnrollment) {
        toast({
          title: 'Already enrolled',
          description: 'You are already enrolled in this course',
        });
        return false;
      }

      const { data, error } = await supabase
        .from('enrollments')
        .insert([{
          user_id: user.id,
          course_id: courseId,
          status: 'enrolled',
          progress_percentage: 0,
        }])
        .select()
        .single();

      if (error) throw error;

      setEnrollments(prev => [...prev, data]);

      // Update course enrollment count
      await supabase.rpc('increment', {
        table_name: 'courses',
        row_id: courseId,
        column_name: 'enrollment_count'
      });

      // Award points for enrollment
      await awardPoints(25, 'Enrolled in a new course');

      toast({
        title: 'Enrolled successfully!',
        description: 'Welcome to your new course',
      });

      return true;
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast({
        title: 'Enrollment failed',
        description: 'Please try again later',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Get course lessons
  const getCourseLessons = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching lessons:', error);
      return [];
    }
  };

  // Get enrollment for a course
  const getEnrollment = (courseId: string) => {
    return enrollments.find(e => e.course_id === courseId);
  };

  // Update lesson progress
  const updateLessonProgress = async (lessonId: string, enrollmentId: string, status: string, timeSpent: number = 0) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('lesson_progress')
        .upsert([{
          user_id: user.id,
          lesson_id: lessonId,
          enrollment_id: enrollmentId,
          status,
          time_spent_minutes: timeSpent,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          last_accessed_at: new Date().toISOString(),
        }], {
          onConflict: 'user_id,lesson_id'
        });

      if (error) throw error;

      // Update course progress
      await supabase.rpc('update_course_progress', {
        p_enrollment_id: enrollmentId
      });

      // Award points for lesson completion
      if (status === 'completed') {
        await awardPoints(10, 'Completed a lesson');
      }

      // Refresh enrollments
      await fetchEnrollments();

    } catch (error) {
      console.error('Error updating lesson progress:', error);
    }
  };

  // Get course progress
  const getCourseProgress = async (courseId: string) => {
    if (!user) return null;

    const enrollment = getEnrollment(courseId);
    if (!enrollment) return null;

    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select(`
          lessons (
            id,
            title,
            duration_minutes
          ),
          status,
          time_spent_minutes,
          completed_at
        `)
        .eq('enrollment_id', enrollment.id);

      if (error) throw error;

      return {
        enrollment,
        lessons: data || []
      };
    } catch (error) {
      console.error('Error fetching course progress:', error);
      return null;
    }
  };

  // Initialize
  useEffect(() => {
    fetchCourses();
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  return {
    courses,
    enrollments,
    isLoading,
    fetchCourses,
    fetchEnrollments,
    enrollInCourse,
    getCourseLessons,
    getEnrollment,
    updateLessonProgress,
    getCourseProgress,
  };
};