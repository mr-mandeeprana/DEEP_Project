import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  Clock,
  Users,
  Star,
  TrendingUp,
  Target,
  ChevronRight
} from 'lucide-react';

interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_hours: number;
  course_ids: string[];
  is_active: boolean;
  courses?: Array<{
    id: string;
    title: string;
    difficulty_level: string;
    duration_hours: number;
    thumbnail_url?: string;
  }>;
}

interface LearningPathCardProps {
  path: LearningPath;
  matchScore?: number;
  reasons?: string[];
  onViewDetails?: (pathId: string) => void;
  onStartPath?: (pathId: string) => void;
  showRecommendations?: boolean;
}

export const LearningPathCard = ({
  path,
  matchScore,
  reasons = [],
  onViewDetails,
  onStartPath,
  showRecommendations = false
}: LearningPathCardProps) => {
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

  const courseCount = path.course_ids?.length || 0;
  const totalHours = path.courses?.reduce((sum, course) => sum + course.duration_hours, 0) || path.estimated_hours;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Match Score Banner (for recommendations) */}
      {showRecommendations && matchScore !== undefined && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">{Math.round(matchScore)}% Match</span>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white">
              Recommended
            </Badge>
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg line-clamp-2">{path.title}</h3>
              {showRecommendations && (
                <Target className="w-5 h-5 text-blue-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{path.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Badge className={`text-xs ${getDifficultyColor(path.difficulty_level)}`}>
            {path.difficulty_level}
          </Badge>
          <Badge variant="outline" className="text-xs capitalize">
            {path.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Path Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <BookOpen className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-lg font-semibold">{courseCount}</div>
            <div className="text-xs text-muted-foreground">Courses</div>
          </div>
          <div className="text-center">
            <Clock className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <div className="text-lg font-semibold">{totalHours}</div>
            <div className="text-xs text-muted-foreground">Hours</div>
          </div>
          <div className="text-center">
            <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <div className="text-lg font-semibold">{path.difficulty_level === 'beginner' ? 'Beginner' : path.difficulty_level === 'intermediate' ? 'Intermediate' : 'Advanced'}</div>
            <div className="text-xs text-muted-foreground">Level</div>
          </div>
        </div>

        {/* Recommendation Reasons */}
        {showRecommendations && reasons.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Why this path?</h4>
            <div className="space-y-1">
              {reasons.slice(0, 2).map((reason, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                  {reason}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course Preview */}
        {path.courses && path.courses.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Courses in this path:</h4>
            <div className="space-y-2">
              {path.courses.slice(0, 3).map((course, index) => (
                <div key={course.id} className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <span className="flex-1 line-clamp-1">{course.title}</span>
                  <span className="text-muted-foreground text-xs">{course.duration_hours}h</span>
                </div>
              ))}
              {path.courses.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{path.courses.length - 3} more courses
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onViewDetails?.(path.id)}
          >
            View Details
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={() => onStartPath?.(path.id)}
          >
            Start Path
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};