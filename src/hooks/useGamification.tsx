import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

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

interface UserStats {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lessonsCompleted: number;
  sessionsCompleted: number;
  postsCreated: number;
  commentsMade: number;
  badgesEarned: number;
  level: number;
  experience: number;
  experienceToNext: number;
  lastActivityDate?: string;
}

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar?: string;
  totalPoints: number;
  badgesCount: number;
  streak: number;
  level: number;
}

export const useGamification = () => {
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 0,
    currentStreak: 0,
    longestStreak: 0,
    lessonsCompleted: 0,
    sessionsCompleted: 0,
    postsCreated: 0,
    commentsMade: 0,
    badgesEarned: 0,
    level: 1,
    experience: 0,
    experienceToNext: 100,
    lastActivityDate: undefined,
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Predefined achievements
  const allAchievements: Achievement[] = [
    // Learning Achievements
    {
      id: 'first-lesson',
      name: 'First Steps',
      description: 'Complete your first lesson',
      icon: '🎓',
      category: 'learning',
      points: 50,
      rarity: 'common',
      maxProgress: 1,
    },
    {
      id: 'lesson-master',
      name: 'Lesson Master',
      description: 'Complete 10 lessons',
      icon: '📚',
      category: 'learning',
      points: 200,
      rarity: 'rare',
      maxProgress: 10,
    },
    {
      id: 'scholar',
      name: 'Scholar',
      description: 'Complete 50 lessons',
      icon: '🎓',
      category: 'learning',
      points: 500,
      rarity: 'epic',
      maxProgress: 50,
    },
    {
      id: 'wisdom-seeker',
      name: 'Wisdom Seeker',
      description: 'Complete 100 lessons',
      icon: '🧠',
      category: 'learning',
      points: 1000,
      rarity: 'legendary',
      maxProgress: 100,
    },

    // Mentorship Achievements
    {
      id: 'first-session',
      name: 'Mentee',
      description: 'Complete your first mentorship session',
      icon: '🤝',
      category: 'mentorship',
      points: 100,
      rarity: 'common',
      maxProgress: 1,
    },
    {
      id: 'session-expert',
      name: 'Session Expert',
      description: 'Complete 25 mentorship sessions',
      icon: '🎯',
      category: 'mentorship',
      points: 750,
      rarity: 'epic',
      maxProgress: 25,
    },

    // Community Achievements
    {
      id: 'first-post',
      name: 'Voice of Wisdom',
      description: 'Create your first post',
      icon: '📝',
      category: 'community',
      points: 25,
      rarity: 'common',
      maxProgress: 1,
    },
    {
      id: 'commenter',
      name: 'Thoughtful Commenter',
      description: 'Leave 10 comments',
      icon: '💬',
      category: 'community',
      points: 100,
      rarity: 'rare',
      maxProgress: 10,
    },
    {
      id: 'community-builder',
      name: 'Community Builder',
      description: 'Create 50 posts',
      icon: '🌟',
      category: 'community',
      points: 300,
      rarity: 'epic',
      maxProgress: 50,
    },

    // Streak Achievements
    {
      id: 'streak-7',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      category: 'streak',
      points: 150,
      rarity: 'rare',
      maxProgress: 7,
    },
    {
      id: 'streak-30',
      name: 'Monthly Master',
      description: 'Maintain a 30-day streak',
      icon: '🚀',
      category: 'streak',
      points: 500,
      rarity: 'epic',
      maxProgress: 30,
    },
    {
      id: 'streak-100',
      name: 'Century Champion',
      description: 'Maintain a 100-day streak',
      icon: '👑',
      category: 'streak',
      points: 2000,
      rarity: 'legendary',
      maxProgress: 100,
    },

    // Special Achievements
    {
      id: 'perfect-quiz',
      name: 'Perfect Score',
      description: 'Get 100% on a quiz',
      icon: '🎖️',
      category: 'special',
      points: 75,
      rarity: 'rare',
      maxProgress: 1,
    },
    {
      id: 'mentor-review',
      name: 'Five-Star Mentor',
      description: 'Receive a 5-star review as a mentor',
      icon: '⭐',
      category: 'special',
      points: 200,
      rarity: 'epic',
      maxProgress: 1,
    },
  ];

  useEffect(() => {
    if (user) {
      fetchUserStats();
      fetchAchievements();
      fetchLeaderboard();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      const { data: stats, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setUserStats({
        totalPoints: stats.total_points,
        currentStreak: stats.current_streak,
        longestStreak: stats.longest_streak,
        lessonsCompleted: stats.lessons_completed,
        sessionsCompleted: stats.sessions_completed,
        postsCreated: stats.posts_created,
        commentsMade: stats.comments_made,
        badgesEarned: stats.badges_earned,
        level: stats.level,
        experience: stats.experience,
        experienceToNext: stats.experience_to_next,
        lastActivityDate: stats.last_activity_date,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Fallback to mock data if database not ready
      const stats = {
        totalPoints: 1250,
        currentStreak: 12,
        longestStreak: 28,
        lessonsCompleted: 15,
        sessionsCompleted: 5,
        postsCreated: 8,
        commentsMade: 23,
        badgesEarned: 7,
        level: 5,
        experience: 250,
        experienceToNext: 350,
        lastActivityDate: new Date().toISOString().split('T')[0],
      };
      setUserStats(stats);
    }
  };

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      // Fetch unlocked achievements
      const { data: unlockedData, error: unlockedError } = await supabase
        .from('user_achievements')
        .select(`
          unlocked_at,
          achievements (
            id,
            name,
            description,
            icon,
            category,
            points,
            rarity,
            max_progress
          )
        `)
        .eq('user_id', user.id);

      if (unlockedError) throw unlockedError;

      const unlocked = unlockedData?.map(item => ({
        ...item.achievements,
        unlockedAt: item.unlocked_at,
      })) || [];

      // Add progress to locked achievements
      const withProgress = allAchievements.map(achievement => {
        if (unlocked.some(u => u.id === achievement.id)) return achievement;

        let progress = 0;
        switch (achievement.id) {
          case 'lesson-master':
            progress = userStats.lessonsCompleted;
            break;
          case 'scholar':
            progress = userStats.lessonsCompleted;
            break;
          case 'wisdom-seeker':
            progress = userStats.lessonsCompleted;
            break;
          case 'session-expert':
            progress = userStats.sessionsCompleted;
            break;
          case 'community-builder':
            progress = userStats.postsCreated;
            break;
          case 'streak-30':
            progress = userStats.currentStreak;
            break;
          case 'streak-100':
            progress = userStats.longestStreak;
            break;
          default:
            progress = 0;
        }

        return { ...achievement, progress };
      });

      setAchievements(withProgress);
      setUnlockedAchievements(unlocked);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      // Fallback to mock data
      const unlockedIds = ['first-lesson', 'first-post', 'first-session', 'streak-7', 'commenter', 'lesson-master'];
      const unlocked = allAchievements.filter(achievement => unlockedIds.includes(achievement.id))
        .map(achievement => ({ ...achievement, unlockedAt: new Date().toISOString() }));

      const withProgress = allAchievements.map(achievement => {
        if (unlockedIds.includes(achievement.id)) return achievement;

        let progress = 0;
        switch (achievement.id) {
          case 'lesson-master':
            progress = userStats.lessonsCompleted;
            break;
          case 'scholar':
            progress = userStats.lessonsCompleted;
            break;
          case 'wisdom-seeker':
            progress = userStats.lessonsCompleted;
            break;
          case 'session-expert':
            progress = userStats.sessionsCompleted;
            break;
          case 'community-builder':
            progress = userStats.postsCreated;
            break;
          case 'streak-30':
            progress = userStats.currentStreak;
            break;
          case 'streak-100':
            progress = userStats.longestStreak;
            break;
          default:
            progress = 0;
        }

        return { ...achievement, progress };
      });

      setAchievements(withProgress);
      setUnlockedAchievements(unlocked);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      // Fetch leaderboard data from database
      const { data: leaderboardData, error } = await supabase
        .from('user_stats')
        .select(`
          user_id,
          total_points,
          badges_earned,
          current_streak,
          level,
          profiles (
            display_name,
            avatar_url
          )
        `)
        .order('total_points', { ascending: false })
        .limit(10);

      if (error) throw error;

      const leaderboard: LeaderboardEntry[] = leaderboardData?.map(item => ({
        user_id: item.user_id,
        display_name: item.profiles?.display_name || item.user_id.substring(0, 8),
        avatar: item.profiles?.avatar_url || item.user_id.substring(0, 2).toUpperCase(),
        totalPoints: item.total_points,
        badgesCount: item.badges_earned,
        streak: item.current_streak,
        level: item.level,
      })) || [];

      setLeaderboard(leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Fallback to mock data
      const mockLeaderboard: LeaderboardEntry[] = [
        { user_id: '1', display_name: 'Sarah Chen', avatar: 'SC', totalPoints: 2850, badgesCount: 12, streak: 45, level: 8 },
        { user_id: '2', display_name: 'Raj Patel', avatar: 'RP', totalPoints: 2650, badgesCount: 11, streak: 32, level: 7 },
        { user_id: '3', display_name: 'Maya Sharma', avatar: 'MS', totalPoints: 2400, badgesCount: 9, streak: 28, level: 6 },
        { user_id: '4', display_name: 'David Kim', avatar: 'DK', totalPoints: 2200, badgesCount: 8, streak: 15, level: 6 },
        { user_id: user?.id || 'current', display_name: user?.email?.split('@')[0] || 'You', totalPoints: userStats.totalPoints, badgesCount: userStats.badgesEarned, streak: userStats.currentStreak, level: userStats.level },
      ];

      setLeaderboard(mockLeaderboard.sort((a, b) => b.totalPoints - a.totalPoints));
    }
  };

  const awardPoints = async (points: number, reason: string, statType?: string) => {
    if (!user) return;

    try {
      // Update database first
      if (statType) {
        const { error: updateError } = await supabase.rpc('update_user_stats', {
          p_user_id: user.id,
          p_stat_type: statType,
          p_increment: 1
        });

        if (updateError) throw updateError;
      }

      // Update local state
      setUserStats(prev => ({
        ...prev,
        totalPoints: prev.totalPoints + points,
        experience: prev.experience + points,
      }));

      toast({
        title: `+${points} Points!`,
        description: reason,
      });

      // Check for level up
      const newExperience = userStats.experience + points;
      if (newExperience >= userStats.experienceToNext) {
        const newLevel = userStats.level + 1;
        setUserStats(prev => ({
          ...prev,
          level: newLevel,
          experience: newExperience - userStats.experienceToNext,
          experienceToNext: newLevel * 100,
        }));

        toast({
          title: `Level Up! 🎉`,
          description: `You've reached level ${newLevel}!`,
        });

        // Update database with level up
        const { error: levelError } = await supabase
          .from('user_stats')
          .update({
            level: newLevel,
            experience: newExperience - userStats.experienceToNext,
            experience_to_next: newLevel * 100
          })
          .eq('user_id', user.id);

        if (levelError) console.error('Error updating level:', levelError);
      }

      // Check for achievements
      checkAchievements();

      // Refresh data
      fetchUserStats();
      fetchAchievements();
    } catch (error) {
      console.error('Error awarding points:', error);
      // Fallback to local state update only
      setUserStats(prev => ({
        ...prev,
        totalPoints: prev.totalPoints + points,
        experience: prev.experience + points,
      }));

      toast({
        title: `+${points} Points!`,
        description: reason,
      });
    }
  };

  const checkAchievements = () => {
    const newAchievements: Achievement[] = [];

    achievements.forEach(achievement => {
      if (achievement.unlockedAt) return; // Already unlocked

      let shouldUnlock = false;

      switch (achievement.id) {
        case 'first-lesson':
          shouldUnlock = userStats.lessonsCompleted >= 1;
          break;
        case 'lesson-master':
          shouldUnlock = userStats.lessonsCompleted >= 10;
          break;
        case 'scholar':
          shouldUnlock = userStats.lessonsCompleted >= 50;
          break;
        case 'wisdom-seeker':
          shouldUnlock = userStats.lessonsCompleted >= 100;
          break;
        case 'first-session':
          shouldUnlock = userStats.sessionsCompleted >= 1;
          break;
        case 'session-expert':
          shouldUnlock = userStats.sessionsCompleted >= 25;
          break;
        case 'first-post':
          shouldUnlock = userStats.postsCreated >= 1;
          break;
        case 'commenter':
          shouldUnlock = userStats.commentsMade >= 10;
          break;
        case 'community-builder':
          shouldUnlock = userStats.postsCreated >= 50;
          break;
        case 'streak-7':
          shouldUnlock = userStats.currentStreak >= 7;
          break;
        case 'streak-30':
          shouldUnlock = userStats.longestStreak >= 30;
          break;
        case 'streak-100':
          shouldUnlock = userStats.longestStreak >= 100;
          break;
      }

      if (shouldUnlock) {
        newAchievements.push(achievement);
      }
    });

    if (newAchievements.length > 0) {
      // Unlock achievements
      const unlocked = newAchievements.map(achievement => ({
        ...achievement,
        unlockedAt: new Date().toISOString()
      }));

      setUnlockedAchievements(prev => [...prev, ...unlocked]);

      // Remove from locked achievements
      setAchievements(prev =>
        prev.map(achievement =>
          unlocked.find(u => u.id === achievement.id)
            ? { ...achievement, unlockedAt: new Date().toISOString() }
            : achievement
        )
      );

      // Award points for new achievements
      newAchievements.forEach(achievement => {
        awardPoints(achievement.points, `Achievement unlocked: ${achievement.name}`);
      });

      toast({
        title: `🏆 Achievement${newAchievements.length > 1 ? 's' : ''} Unlocked!`,
        description: `${newAchievements.map(a => a.name).join(', ')}`,
      });
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'learning': return '📚';
      case 'mentorship': return '🤝';
      case 'community': return '💬';
      case 'streak': return '🔥';
      case 'special': return '⭐';
      default: return '🎯';
    }
  };

  return {
    userStats,
    achievements,
    unlockedAchievements,
    leaderboard,
    isLoading,
    awardPoints,
    checkAchievements,
    getRarityColor,
    getCategoryIcon,
    fetchLeaderboard,
    fetchUserStats,
  };
};