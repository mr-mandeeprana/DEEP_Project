import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar?: string;
  totalPoints: number;
  badgesCount: number;
  streak: number;
  level: number;
}

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
  currentUserId?: string;
  isLoading?: boolean;
}

export const Leaderboard = ({ leaderboard, currentUserId, isLoading }: LeaderboardProps) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500 text-white';
      case 2:
        return 'bg-gray-400 text-white';
      case 3:
        return 'bg-amber-600 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🏆 Community Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Community Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const rank = index + 1;
            const isCurrentUser = entry.user_id === currentUserId;

            return (
              <div
                key={entry.user_id}
                className={`flex items-center space-x-4 p-3 rounded-lg transition-colors ${
                  isCurrentUser ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'
                }`}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(rank)}
                </div>

                {/* Avatar and Name */}
                <div className="flex items-center space-x-3 flex-1">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={entry.avatar} />
                    <AvatarFallback className="text-sm">{entry.avatar || entry.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className={`font-medium ${isCurrentUser ? 'text-primary' : ''}`}>
                      {entry.display_name}
                      {isCurrentUser && <span className="text-xs text-muted-foreground ml-1">(You)</span>}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Level {entry.level}</span>
                      <span>•</span>
                      <span>{entry.streak} day streak</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-bold text-lg">{entry.totalPoints.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">points</div>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Award className="w-3 h-3" />
                    {entry.badgesCount}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No leaderboard data available yet.</p>
            <p className="text-sm">Start engaging to see rankings!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};