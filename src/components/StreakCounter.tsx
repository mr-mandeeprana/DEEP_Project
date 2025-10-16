import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, Calendar, TrendingUp, Target } from 'lucide-react';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: boolean;
  nextMilestone: number;
}

export const StreakCounter = ({
  currentStreak,
  longestStreak,
  todayCompleted,
  nextMilestone
}: StreakCounterProps) => {
  const progressToNext = (currentStreak % 7) / 7 * 100; // Weekly progress

  return (
    <div className="space-y-4">
      {/* Current Streak */}
      <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className={`w-6 h-6 ${todayCompleted ? 'text-orange-500 animate-pulse' : 'text-gray-400'}`} />
            Current Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-4xl font-bold text-orange-600">{currentStreak}</div>
              <p className="text-sm text-muted-foreground">consecutive days</p>
            </div>
            {todayCompleted && (
              <Badge className="bg-green-500 text-white animate-bounce">
                🔥 Hot Streak!
              </Badge>
            )}
          </div>

          {/* Weekly Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Weekly Progress</span>
              <span>{currentStreak % 7}/7 days</span>
            </div>
            <Progress value={progressToNext} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{longestStreak}</p>
              <p className="text-xs text-muted-foreground">Longest Streak</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{nextMilestone - currentStreak}</p>
              <p className="text-xs text-muted-foreground">Days to {nextMilestone}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Daily Status */}
      <Card className={`p-4 ${todayCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${todayCompleted ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Calendar className={`w-5 h-5 ${todayCompleted ? 'text-green-600' : 'text-gray-400'}`} />
          </div>
          <div className="flex-1">
            <p className={`font-medium ${todayCompleted ? 'text-green-700' : 'text-gray-700'}`}>
              {todayCompleted ? 'Today\'s Goal Completed! 🎉' : 'Complete today\'s goal to extend your streak'}
            </p>
            <p className="text-sm text-muted-foreground">
              {todayCompleted ? 'Keep it up!' : `${nextMilestone - currentStreak - 1} days until next milestone`}
            </p>
          </div>
        </div>
      </Card>

      {/* Streak Calendar Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 14 }, (_, i) => {
              const dayIndex = 13 - i;
              const isActive = dayIndex < currentStreak;
              const isToday = dayIndex === 0;

              return (
                <div
                  key={i}
                  className={`
                    aspect-square rounded-lg flex items-center justify-center text-xs font-medium
                    ${isActive
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                    }
                    ${isToday ? 'ring-2 ring-blue-400' : ''}
                  `}
                >
                  {isToday ? 'T' : dayIndex + 1}
                </div>
              );
            }).reverse()}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Active</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 rounded"></div>
              <span>Inactive</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};