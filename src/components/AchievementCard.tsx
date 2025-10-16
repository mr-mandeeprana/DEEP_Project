import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Lock, Star } from 'lucide-react';
import { format } from 'date-fns';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'learning' | 'mentorship' | 'community' | 'streak' | 'special';
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

interface AchievementCardProps {
  achievement: Achievement;
  getRarityColor: (rarity: string) => string;
  getCategoryIcon: (category: string) => string;
}

export const AchievementCard = ({ achievement, getRarityColor, getCategoryIcon }: AchievementCardProps) => {
  const isUnlocked = !!achievement.unlockedAt;
  const progress = achievement.progress || 0;
  const maxProgress = achievement.maxProgress || 1;
  const progressPercentage = (progress / maxProgress) * 100;

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
      isUnlocked
        ? 'border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50'
        : 'border border-gray-200 bg-gray-50/50'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Achievement Icon */}
          <div className={`relative flex-shrink-0 ${
            isUnlocked ? 'scale-110' : 'grayscale opacity-60'
          }`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
              isUnlocked
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-400'
            }`}>
              {isUnlocked ? achievement.icon : <Lock className="w-6 h-6" />}
            </div>
            {isUnlocked && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <Trophy className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Achievement Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className={`font-bold text-lg ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                  {achievement.name}
                </h3>
                <p className={`text-sm ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                  {achievement.description}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-xs gap-1">
                {getCategoryIcon(achievement.category)}
                {achievement.category}
              </Badge>
              <Badge className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                {achievement.rarity}
              </Badge>
              {isUnlocked && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Star className="w-3 h-3" />
                  {achievement.points} pts
                </Badge>
              )}
            </div>

            {/* Progress Bar for Locked Achievements */}
            {!isUnlocked && achievement.maxProgress && achievement.maxProgress > 1 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Progress</span>
                  <span>{progress}/{maxProgress}</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}

            {/* Unlock Date */}
            {isUnlocked && achievement.unlockedAt && (
              <div className="text-xs text-green-600 font-medium">
                Unlocked {format(new Date(achievement.unlockedAt), 'MMM dd, yyyy')}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};