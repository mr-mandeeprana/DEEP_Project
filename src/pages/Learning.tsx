import { useState, useEffect } from 'react';
import { useLearning } from '@/hooks/useLearning';
import { useGamification } from '@/hooks/useGamification';
import { CourseCard } from '@/components/CourseCard';
import { StreakCounter } from '@/components/StreakCounter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  BookOpen,
  Clock,
  Users,
  Star,
  TrendingUp,
  Award,
  PlayCircle,
  Trophy
} from 'lucide-react';

export default function Learning() {
  const {
    courses,
    enrollments,
    isLoading,
    fetchCourses,
    enrollInCourse,
    getEnrollment
  } = useLearning();
  const { userStats, leaderboard } = useGamification();

  // Sample courses data if no courses are loaded
  const defaultCourses = [
    {
      id: 'course-1',
      title: 'Introduction to Mindfulness Meditation',
      description: 'Learn the fundamentals of mindfulness meditation practices rooted in ancient wisdom traditions.',
      short_description: 'Master the art of mindful presence',
      instructor_name: 'Dr. Maya Patel',
      category: 'meditation',
      tags: ['mindfulness', 'meditation', 'beginner'],
      thumbnail_url: '/placeholder.svg',
      duration_hours: 8,
      total_lessons: 12,
      difficulty_level: 'beginner' as const,
      rating: 4.8,
      review_count: 156,
      enrollment_count: 2450,
      is_free: true,
      price_cents: 0,
      status: 'published'
    },
    {
      id: 'course-2',
      title: 'Bhagavad Gita: Modern Applications',
      description: 'Apply the timeless wisdom of the Bhagavad Gita to contemporary life challenges and decision-making.',
      short_description: 'Ancient wisdom for modern life',
      instructor_name: 'Prof. Rajesh Kumar',
      category: 'philosophy',
      tags: ['bhagavad gita', 'leadership', 'ethics'],
      thumbnail_url: '/placeholder.svg',
      duration_hours: 15,
      total_lessons: 20,
      difficulty_level: 'intermediate' as const,
      rating: 4.9,
      review_count: 89,
      enrollment_count: 1200,
      is_free: false,
      price_cents: 2999,
      status: 'published'
    },
    {
      id: 'course-3',
      title: 'Mindful Communication & Relationships',
      description: 'Develop deeper connections through mindful communication practices inspired by spiritual traditions.',
      short_description: 'Transform your relationships with awareness',
      instructor_name: 'Dr. Sarah Johnson',
      category: 'relationships',
      tags: ['communication', 'relationships', 'mindfulness'],
      thumbnail_url: '/placeholder.svg',
      duration_hours: 10,
      total_lessons: 14,
      difficulty_level: 'intermediate' as const,
      rating: 4.7,
      review_count: 203,
      enrollment_count: 1800,
      is_free: false,
      price_cents: 1999,
      status: 'published'
    },
    {
      id: 'course-4',
      title: 'Karma Yoga: The Path of Selfless Action',
      description: 'Understand and practice the principles of Karma Yoga for balanced, purposeful living.',
      short_description: 'Action without attachment, results without expectation',
      instructor_name: 'Swami Arjun',
      category: 'yoga',
      tags: ['karma yoga', 'action', 'spirituality'],
      thumbnail_url: '/placeholder.svg',
      duration_hours: 12,
      total_lessons: 16,
      difficulty_level: 'advanced' as const,
      rating: 4.6,
      review_count: 67,
      enrollment_count: 950,
      is_free: false,
      price_cents: 3499,
      status: 'published'
    },
    {
      id: 'course-5',
      title: 'Breathing Techniques for Stress Relief',
      description: 'Master ancient Pranayama techniques combined with modern stress management approaches.',
      short_description: 'Breathe away stress and anxiety',
      instructor_name: 'Dr. Lisa Chen',
      category: 'wellness',
      tags: ['pranayama', 'stress relief', 'breathing'],
      thumbnail_url: '/placeholder.svg',
      duration_hours: 6,
      total_lessons: 8,
      difficulty_level: 'beginner' as const,
      rating: 4.5,
      review_count: 312,
      enrollment_count: 3200,
      is_free: true,
      price_cents: 0,
      status: 'published'
    },
    {
      id: 'course-6',
      title: 'Digital Detox: Finding Balance in Modern Life',
      description: 'Learn to balance technology use with spiritual practices for a more mindful digital existence.',
      short_description: 'Mindful technology use in the modern world',
      instructor_name: 'Tech Monk',
      category: 'lifestyle',
      tags: ['digital detox', 'mindfulness', 'balance'],
      thumbnail_url: '/placeholder.svg',
      duration_hours: 7,
      total_lessons: 10,
      difficulty_level: 'beginner' as const,
      rating: 4.4,
      review_count: 178,
      enrollment_count: 1650,
      is_free: true,
      price_cents: 0,
      status: 'published'
    }
  ];

  // Use default courses if none loaded from database
  const displayCourses = courses.length > 0 ? courses : defaultCourses;
  console.log('Learning page - courses from API:', courses.length, 'displayCourses:', displayCourses.length, 'isLoading:', isLoading);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('all-courses');

  // Get unique categories
  const categories = ['all', ...new Set(displayCourses.map(course => course.category))];

  // Filter courses based on search and category
  const filteredCourses = displayCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Separate enrolled and available courses
  const enrolledCourses = displayCourses.filter(course =>
    getEnrollment(course.id)?.status === 'enrolled' ||
    getEnrollment(course.id)?.status === 'in_progress' ||
    getEnrollment(course.id)?.status === 'completed'
  );

  const availableCourses = displayCourses.filter(course => !getEnrollment(course.id));

  // Stats
  const totalEnrolled = enrolledCourses.length;
  const completedCourses = enrolledCourses.filter(course =>
    getEnrollment(course.id)?.status === 'completed'
  ).length;
  const totalHoursLearned = enrolledCourses.reduce((total, course) => {
    const enrollment = getEnrollment(course.id);
    if (enrollment) {
      return total + (course.duration_hours * (enrollment.progress_percentage / 100));
    }
    return total;
  }, 0);

  // Overall stats from display courses
  const totalCourses = displayCourses.length;
  const freeCourses = displayCourses.filter(course => course.is_free).length;

  const handleEnroll = async (courseId: string) => {
    await enrollInCourse(courseId);
  };

  const handleContinue = (courseId: string) => {
    // Navigate to course detail page
    console.log('Continue course:', courseId);
  };

  const handleViewDetails = (courseId: string) => {
    // Navigate to course detail page
    console.log('View course details:', courseId);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Learning Center
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover structured courses designed for spiritual growth and personal development
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          {enrolledCourses.length > 0 && (
            <>
              <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-700">{totalEnrolled}</div>
                  <p className="text-sm text-muted-foreground">Courses Enrolled</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-6 text-center">
                  <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-700">{completedCourses}</div>
                  <p className="text-sm text-muted-foreground">Courses Completed</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
                <CardContent className="p-6 text-center">
                  <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-700">{Math.round(totalHoursLearned)}</div>
                  <p className="text-sm text-muted-foreground">Hours Learned</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-700">
                    {totalEnrolled > 0 ? Math.round((completedCourses / totalEnrolled) * 100) : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                </CardContent>
              </Card>
            </>
          )}

          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
            <CardContent className="p-6 text-center">
              <Trophy className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-700">{userStats.totalPoints}</div>
              <p className="text-sm text-muted-foreground">Total Points</p>
            </CardContent>
          </Card>
        </div>

        {/* Streak and Leaderboard Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <StreakCounter
            currentStreak={userStats.currentStreak}
            longestStreak={userStats.longestStreak}
            todayCompleted={userStats.currentStreak > 0}
            nextMilestone={userStats.currentStreak >= 30 ? 100 : 30}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                Leaderboard Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <div key={entry.user_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{entry.display_name}</p>
                        <p className="text-xs text-muted-foreground">Level {entry.level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{entry.totalPoints} pts</p>
                      <p className="text-xs text-muted-foreground">{entry.badgesCount} badges</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" asChild>
                <a href="/gamification">View Full Leaderboard</a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category === 'all' ? 'All Categories' : category}
              </Button>
            ))}
          </div>
        </div>

        {/* Course Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="all-courses" className="gap-2">
                <BookOpen className="w-4 h-4" />
                All Courses ({totalCourses})
              </TabsTrigger>
            <TabsTrigger value="my-courses" className="gap-2">
              <PlayCircle className="w-4 h-4" />
              My Courses ({enrolledCourses.length})
            </TabsTrigger>
            <TabsTrigger value="available" className="gap-2">
              <Star className="w-4 h-4" />
              Available ({availableCourses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all-courses">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const enrollment = getEnrollment(course.id);
                return (
                  <CourseCard
                    key={course.id}
                    course={{
                      ...course,
                      enrollment_status: enrollment?.status as 'enrolled' | 'in_progress' | 'completed',
                      progress_percentage: enrollment?.progress_percentage || 0,
                    }}
                    onEnroll={handleEnroll}
                    onContinue={handleContinue}
                    onViewDetails={handleViewDetails}
                    showProgress={true}
                  />
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="my-courses">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => {
                const enrollment = getEnrollment(course.id);
                return (
                  <CourseCard
                    key={course.id}
                    course={{
                      ...course,
                      enrollment_status: enrollment?.status as 'enrolled' | 'in_progress' | 'completed',
                      progress_percentage: enrollment?.progress_percentage || 0,
                    }}
                    onEnroll={handleEnroll}
                    onContinue={handleContinue}
                    onViewDetails={handleViewDetails}
                    showProgress={true}
                  />
                );
              })}
            </div>

            {enrolledCourses.length === 0 && (
              <Card className="p-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start your learning journey by enrolling in a course
                </p>
                <Button onClick={() => setActiveTab('available')}>
                  Browse Available Courses
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="available">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses
                .filter(course =>
                  course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  course.description.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .filter(course => selectedCategory === 'all' || course.category === selectedCategory)
                .map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onEnroll={handleEnroll}
                    onContinue={handleContinue}
                    onViewDetails={handleViewDetails}
                    showProgress={false}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded mb-4"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredCourses.length === 0 && (
          <Card className="p-12 text-center">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </Card>
        )}

        {/* Course Categories Info */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalCourses}</div>
            <div className="text-sm text-muted-foreground">Total Courses</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{freeCourses}</div>
            <div className="text-sm text-muted-foreground">Free Courses</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{categories.length - 1}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(displayCourses.reduce((sum, course) => sum + course.rating, 0) / displayCourses.length * 10) / 10}
            </div>
            <div className="text-sm text-muted-foreground">Avg Rating</div>
          </Card>
        </div>
      </div>
    </div>
  );
}