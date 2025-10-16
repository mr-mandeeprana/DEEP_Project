import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/hooks/useGamification';
import { Leaderboard } from '@/components/Leaderboard';
import { StreakCounter } from '@/components/StreakCounter';
import { AchievementCard } from '@/components/AchievementCard';
import { ProgressTracker } from '@/components/ProgressTracker';
import { RewardSystem } from '@/components/RewardSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Target, Gift, TrendingUp, Users } from 'lucide-react';

export default function Gamification() {
  const { user } = useAuth();
  const {
    userStats,
    achievements,
    unlockedAchievements,
    leaderboard,
    isLoading,
    awardPoints,
    getRarityColor,
    getCategoryIcon
  } = useGamification();

  const [activeTab, setActiveTab] = useState('overview');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view gamification features.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            Gamification Hub
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track your progress, unlock achievements, and compete with the community in your journey of wisdom.
          </p>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                  <p className="text-3xl font-bold text-yellow-700">{userStats.totalPoints.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-yellow-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Level</p>
                  <p className="text-3xl font-bold text-blue-700">Level {userStats.level}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Target className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Achievements</p>
                  <p className="text-3xl font-bold text-green-700">{unlockedAchievements.length}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Trophy className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                  <p className="text-3xl font-bold text-purple-700">{userStats.currentStreak}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="w-6 h-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview" className="gap-2">
              <Target className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy className="w-4 h-4" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-2">
              <Gift className="w-4 h-4" />
              Rewards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Streak Counter */}
              <StreakCounter
                currentStreak={userStats.currentStreak}
                longestStreak={userStats.longestStreak}
                todayCompleted={userStats.lastActivityDate === new Date().toISOString().split('T')[0]}
                nextMilestone={userStats.currentStreak + (7 - (userStats.currentStreak % 7))}
              />

              {/* Progress Tracker */}
              <ProgressTracker
                items={achievements.slice(0, 6).map(achievement => ({
                  id: achievement.id,
                  title: achievement.name,
                  description: achievement.description,
                  completed: !!achievement.unlockedAt,
                  progress: achievement.progress || 0,
                  maxProgress: achievement.maxProgress || 1,
                  category: achievement.category,
                  points: achievement.points,
                }))}
                title="Recent Progress"
              />
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            {/* Unlocked Achievements */}
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Your Achievements ({unlockedAchievements.length})
              </h3>
              {unlockedAchievements.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <p className="text-muted-foreground">No achievements unlocked yet.</p>
                    <p className="text-sm text-muted-foreground">Start engaging to earn your first badge!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {unlockedAchievements.map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      getRarityColor={getRarityColor}
                      getCategoryIcon={getCategoryIcon}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Available Achievements */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Available Achievements</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {achievements
                  .filter(achievement => !achievement.unlockedAt)
                  .map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      getRarityColor={getRarityColor}
                      getCategoryIcon={getCategoryIcon}
                    />
                  ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard
              leaderboard={leaderboard}
              currentUserId={user.id}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="rewards">
            <RewardSystem
              userCredits={userStats.totalPoints}
              rewards={[
                {
                  id: 'theme-pack',
                  name: 'Premium Theme Pack',
                  description: 'Unlock beautiful premium themes',
                  cost: 500,
                  icon: '🎨',
                  category: 'cosmetic',
                  available: true,
                },
                {
                  id: 'badge-showcase',
                  name: 'Badge Showcase',
                  description: 'Display achievements prominently',
                  cost: 300,
                  icon: '🏆',
                  category: 'feature',
                  available: true,
                },
                {
                  id: 'analytics-insights',
                  name: 'Advanced Analytics',
                  description: 'Detailed progress insights',
                  cost: 750,
                  icon: '📊',
                  category: 'premium',
                  available: true,
                },
                {
                  id: 'mentor-badge',
                  name: 'Mentor Badge',
                  description: 'Special recognition for mentoring',
                  cost: 1000,
                  icon: '👨‍🏫',
                  category: 'special',
                  available: true,
                },
              ]}
              onRedeemReward={(rewardId) => {
                console.log('Redeem reward:', rewardId);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}