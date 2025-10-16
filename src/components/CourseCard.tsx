import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, Star, Play, BookOpen, Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
  progress_percentage?: number;
  enrollment_status?: 'enrolled' | 'in_progress' | 'completed';
}

interface CourseCardProps {
  course: Course;
  onEnroll?: (courseId: string) => void;
  onContinue?: (courseId: string) => void;
  onViewDetails?: (courseId: string) => void;
  showProgress?: boolean;
  size?: 'default' | 'compact';
}

export const CourseCard = ({
  course,
  onEnroll,
  onContinue,
  onViewDetails,
  showProgress = false,
  size = 'default'
}: CourseCardProps) => {
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatPrice = (priceCents: number) => {
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  if (size === 'compact') {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewDetails?.(course.id)}>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-2">{course.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{course.instructor_name}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`text-xs ${getDifficultyColor(course.difficulty_level)}`}>
                  {course.difficulty_level}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {course.duration_hours}h
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Course Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 relative">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-blue-600" />
          </div>
        )}

        {/* Overlay for enrolled courses */}
        {course.enrollment_status && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <Award className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">
                {course.enrollment_status === 'completed' ? 'Completed' :
                 course.enrollment_status === 'in_progress' ? 'In Progress' : 'Enrolled'}
              </p>
            </div>
          </div>
        )}

        {/* Difficulty Badge */}
        <Badge className={`absolute top-2 right-2 ${getDifficultyColor(course.difficulty_level)}`}>
          {course.difficulty_level}
        </Badge>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-2">{course.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {course.short_description}
            </p>
          </div>
        </div>

        {/* Instructor */}
        <div className="flex items-center gap-2 mt-3">
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-xs">
              {course.instructor_name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{course.instructor_name}</span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Course Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{course.duration_hours}h</span>
          </div>
          <div className="flex items-center gap-1">
            <Play className="w-4 h-4" />
            <span>{course.total_lessons} lessons</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{course.enrollment_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{course.rating.toFixed(1)} ({course.review_count})</span>
          </div>
        </div>

        {/* Progress Bar for enrolled courses */}
        {showProgress && course.progress_percentage !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{Math.round(course.progress_percentage)}%</span>
            </div>
            <Progress value={course.progress_percentage} className="h-2" />
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {course.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {course.is_free ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Free
              </Badge>
            ) : (
              <span className="font-semibold text-lg">{formatPrice(course.price_cents)}</span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(course.id);
              }}
            >
              View Details
            </Button>

            {course.enrollment_status === 'enrolled' || course.enrollment_status === 'in_progress' ? (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onContinue?.(course.id);
                }}
              >
                Continue
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEnroll?.(course.id);
                }}
              >
                {course.is_free ? 'Enroll Free' : 'Enroll'}
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};