import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Target, BookOpen, Users, MessageSquare } from 'lucide-react';

interface ProgressItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  progress?: number;
  maxProgress?: number;
  category: 'learning' | 'mentorship' | 'community' | 'streak' | 'special';
  points: number;
}

interface ProgressTrackerProps {
  items: ProgressItem[];
  title?: string;
}

export const ProgressTracker = ({ items, title = "Progress Tracker" }: ProgressTrackerProps) => {
  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const overallProgress = (completedCount / totalCount) * 100;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'learning':
        return <BookOpen className="w-4 h-4" />;
      case 'mentorship':
        return <Users className="w-4 h-4" />;
      case 'community':
        return <MessageSquare className="w-4 h-4" />;
      case 'streak':
        return <Target className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'learning':
        return 'bg-blue-100 text-blue-700';
      case 'mentorship':
        return 'bg-green-100 text-green-700';
      case 'community':
        return 'bg-purple-100 text-purple-700';
      case 'streak':
        return 'bg-orange-100 text-orange-700';
      case 'special':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {title}
          </span>
          <Badge variant="outline">
            {completedCount}/{totalCount} completed
          </Badge>
        </CardTitle>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-lg border transition-colors ${
                item.completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-background border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {item.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className={`font-medium ${
                        item.completed ? 'text-green-800' : 'text-foreground'
                      }`}>
                        {item.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={`text-xs gap-1 ${getCategoryColor(item.category)}`}>
                        {getCategoryIcon(item.category)}
                        {item.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        +{item.points} pts
                      </Badge>
                    </div>
                  </div>

                  {/* Progress bar for incomplete items with progress tracking */}
                  {!item.completed && item.maxProgress && item.maxProgress > 1 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{item.progress || 0}/{item.maxProgress}</span>
                      </div>
                      <Progress
                        value={((item.progress || 0) / item.maxProgress) * 100}
                        className="h-1.5"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No progress items available.</p>
            <p className="text-sm">Complete activities to track your progress!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};