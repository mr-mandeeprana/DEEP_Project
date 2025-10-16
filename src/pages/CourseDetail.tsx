import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLearning } from '@/hooks/useLearning';
import { useGamification } from '@/hooks/useGamification';
import { LessonViewer } from '@/components/LessonViewer';
import { CourseCard } from '@/components/CourseCard';
import { CertificateGenerator } from '@/components/CertificateGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Play,
  Clock,
  Users,
  Star,
  CheckCircle,
  BookOpen,
  Award,
  ChevronRight,
  ArrowLeft,
  Download,
  Trophy
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Course {
  id: string;
  title: string;
  description: string;
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

interface LessonProgress {
  status: 'not_started' | 'in_progress' | 'completed';
  time_spent_minutes: number;
  completed_at?: string;
}

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const {
    enrollInCourse,
    getEnrollment,
    getCourseLessons,
    updateLessonProgress,
    getCourseProgress
  } = useLearning();
  const { awardPoints, userStats } = useGamification();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgress>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

  const fetchCourseDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch lessons
      const lessonsData = await getCourseLessons(courseId);
      setLessons(lessonsData);

      // Check enrollment
      const enrollmentData = getEnrollment(courseId);
      setEnrollment(enrollmentData);

      // Fetch progress if enrolled
      if (enrollmentData) {
        const progressData = await getCourseProgress(courseId);
        if (progressData) {
          const progressMap: Record<string, LessonProgress> = {};
          progressData.lessons.forEach((item: any) => {
            progressMap[item.lessons.id] = {
              status: item.status,
              time_spent_minutes: item.time_spent_minutes,
              completed_at: item.completed_at,
            };
          });
          setLessonProgress(progressMap);
        }
      }

    } catch (error) {
      console.error('Error fetching course details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!course) return;

    const success = await enrollInCourse(course.id);
    if (success) {
      await fetchCourseDetails(); // Refresh data
    }
  };

  const handleStartLesson = (lesson: Lesson) => {
    if (!enrollment) {
      toast({
        title: 'Enrollment required',
        description: 'Please enroll in the course to access lessons',
        variant: 'destructive',
      });
      return;
    }

    setSelectedLesson(lesson);
    // Update progress to in_progress
    updateLessonProgress(lesson.id, enrollment.id, 'in_progress');
  };

  const handleLessonComplete = (lessonId: string) => {
    if (!enrollment) return;

    updateLessonProgress(lessonId, enrollment.id, 'completed');
    setLessonProgress(prev => ({
      ...prev,
      [lessonId]: {
        ...prev[lessonId],
        status: 'completed',
        completed_at: new Date().toISOString(),
      }
    }));

    toast({
      title: 'Lesson completed!',
      description: 'Great progress on your learning journey',
    });
  };

  const getLessonStatus = (lesson: Lesson) => {
    return lessonProgress[lesson.id]?.status || 'not_started';
  };

  const completedLessons = lessons.filter(lesson => getLessonStatus(lesson) === 'completed').length;
  const progressPercentage = lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Course not found</h2>
          <p className="text-muted-foreground">The course you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (selectedLesson) {
    return (
      <LessonViewer
        lesson={{
          ...selectedLesson,
          content: selectedLesson.lesson_type === 'text' ? 'Sample lesson content...' : undefined,
          video_url: selectedLesson.lesson_type === 'video' ? 'sample-video-url' : undefined,
          audio_url: selectedLesson.lesson_type === 'audio' ? 'sample-audio-url' : undefined,
          lesson_type: selectedLesson.lesson_type as 'video' | 'audio' | 'text' | 'quiz',
        }}
        progress={lessonProgress[selectedLesson.id] || { status: 'not_started', time_spent_minutes: 0 }}
        onComplete={handleLessonComplete}
        onNext={() => {
          const currentIndex = lessons.findIndex(l => l.id === selectedLesson.id);
          const nextLesson = lessons[currentIndex + 1];
          if (nextLesson) {
            handleStartLesson(nextLesson);
          }
        }}
        onPrevious={() => {
          const currentIndex = lessons.findIndex(l => l.id === selectedLesson.id);
          const prevLesson = lessons[currentIndex - 1];
          if (prevLesson) {
            setSelectedLesson(prevLesson);
          }
        }}
        hasNext={lessons.findIndex(l => l.id === selectedLesson.id) < lessons.length - 1}
        hasPrevious={lessons.findIndex(l => l.id === selectedLesson.id) > 0}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Button
            variant="ghost"
            onClick={() => navigate('/learning')}
            className="text-white hover:bg-white/20 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Learning
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className="mb-4 bg-white/20 text-white border-white/30">
                {course.difficulty_level}
              </Badge>
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-lg opacity-90 mb-6">{course.description}</p>

              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-white/20 text-white">
                      {course.instructor_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span>{course.instructor_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{course.rating.toFixed(1)} ({course.review_count})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{course.enrollment_count} students</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {course.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-white/20 text-white border-white/30">
                    {tag}
                  </Badge>
                ))}
              </div>

              {!enrollment ? (
                <Button size="lg" onClick={handleEnroll} className="bg-white text-blue-600 hover:bg-gray-100">
                  {course.is_free ? 'Enroll for Free' : `Enroll - $${(course.price_cents / 100).toFixed(2)}`}
                </Button>
              ) : (
                <div className="bg-white/10 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Your Progress</h3>
                  <Progress value={progressPercentage} className="mb-2" />
                  <p className="text-sm opacity-90">
                    {completedLessons} of {lessons.length} lessons completed ({Math.round(progressPercentage)}%)
                  </p>
                </div>
              )}
            </div>

            <div className="lg:text-right">
              <div className="bg-white/10 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Course Overview</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5" />
                    <span>{course.duration_hours} hours total</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5" />
                    <span>{course.total_lessons} lessons</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5" />
                    <span>Certificate of completion</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lessons List */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">Course Content</h2>
            <div className="space-y-4">
              {lessons.map((lesson, index) => {
                const status = getLessonStatus(lesson);
                const isAccessible = enrollment && (status !== 'not_started' || index === 0 || lessons[index - 1] && getLessonStatus(lessons[index - 1]) === 'completed');

                return (
                  <Card key={lesson.id} className={`transition-all ${!isAccessible ? 'opacity-60' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            status === 'completed' ? 'bg-green-100 text-green-700' :
                            status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {status === 'completed' ? <CheckCircle className="w-4 h-4" /> : index + 1}
                          </div>

                          <div className="flex-1">
                            <h3 className="font-semibold">{lesson.title}</h3>
                            <p className="text-sm text-muted-foreground">{lesson.description}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {lesson.duration_minutes} min
                              </span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {lesson.lesson_type}
                              </Badge>
                              {lesson.is_preview && (
                                <Badge variant="secondary" className="text-xs">
                                  Preview
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleStartLesson(lesson)}
                          disabled={!isAccessible}
                          variant={status === 'completed' ? 'outline' : 'default'}
                        >
                          {status === 'completed' ? 'Review' : status === 'in_progress' ? 'Continue' : 'Start'}
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            {enrollment && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={progressPercentage} className="mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {completedLessons} of {lessons.length} lessons completed
                  </p>

                  {progressPercentage === 100 && (
                    <div className="space-y-3">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-yellow-600" />
                        <div>
                          <p className="font-semibold text-yellow-800">Course Completed!</p>
                          <p className="text-sm text-yellow-700">Congratulations! You've earned {course.duration_hours * 10} points!</p>
                        </div>
                      </div>

                      <CertificateGenerator
                        enrollmentId={enrollment.id}
                        courseData={{
                          title: course.title,
                          instructor_name: course.instructor_name,
                          duration_hours: course.duration_hours,
                          difficulty_level: course.difficulty_level,
                        }}
                        learnerName={'Learner'}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Course Info */}
            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">What you'll learn</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Understanding of core concepts</li>
                    <li>• Practical application techniques</li>
                    <li>• Advanced problem-solving skills</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Requirements</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• No prior experience required</li>
                    <li>• Internet connection</li>
                    <li>• Commitment to learning</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}