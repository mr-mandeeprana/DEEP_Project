import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  estimated_hours: number;
  course_ids: string[];
  is_active: boolean;
  courses?: Course[];
}

interface Course {
  id: string;
  title: string;
  difficulty_level: string;
  duration_hours: number;
  thumbnail_url?: string;
}

interface UserInterest {
  category: string;
  interest_level: number;
}

interface PersonalizedRecommendation {
  path: LearningPath;
  match_score: number;
  reasons: string[];
}

export const useLearningPaths = () => {
  const { user } = useAuth();
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [userInterests, setUserInterests] = useState<UserInterest[]>([]);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all active learning paths
  const fetchLearningPaths = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('learning_paths')
        .select(`
          *,
          courses:course_ids (
            id,
            title,
            difficulty_level,
            duration_hours,
            thumbnail_url
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLearningPaths(data || []);
    } catch (error) {
      console.error('Error fetching learning paths:', error);
      toast({
        title: 'Error',
        description: 'Failed to load learning paths',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user's interests
  const fetchUserInterests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_interests')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserInterests(data || []);
    } catch (error) {
      console.error('Error fetching user interests:', error);
    }
  };

  // Update user interests
  const updateUserInterest = async (category: string, interestLevel: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_interests')
        .upsert([{
          user_id: user.id,
          category,
          interest_level: interestLevel,
          updated_at: new Date().toISOString(),
        }], {
          onConflict: 'user_id,category'
        });

      if (error) throw error;

      // Update local state
      setUserInterests(prev =>
        prev.filter(i => i.category !== category)
           .concat({ category, interest_level: interestLevel })
      );

      toast({
        title: 'Interest updated',
        description: `Your interest in ${category} has been saved`,
      });

      // Refresh recommendations
      generateRecommendations();
    } catch (error) {
      console.error('Error updating interest:', error);
      toast({
        title: 'Error',
        description: 'Failed to update interest',
        variant: 'destructive',
      });
    }
  };

  // Generate personalized recommendations
  const generateRecommendations = () => {
    if (!user || learningPaths.length === 0) return;

    const personalizedRecommendations: PersonalizedRecommendation[] = [];

    learningPaths.forEach(path => {
      let matchScore = 0;
      const reasons: string[] = [];

      // Match based on user interests
      const interestMatch = userInterests.find(
        interest => interest.category.toLowerCase() === path.category.toLowerCase()
      );

      if (interestMatch) {
        matchScore += interestMatch.interest_level * 0.4; // 40% weight for interest level
        reasons.push(`High interest in ${path.category}`);
      }

      // Match based on current skill level (this would be enhanced with user progress data)
      // For now, assume beginner level
      const userLevel = 'beginner';
      if (path.difficulty_level === userLevel) {
        matchScore += 30; // Good match for skill level
        reasons.push(`Matches your current skill level`);
      } else if (
        (userLevel === 'beginner' && path.difficulty_level === 'intermediate') ||
        (userLevel === 'intermediate' && ['intermediate', 'advanced'].includes(path.difficulty_level))
      ) {
        matchScore += 15; // Decent progression match
        reasons.push(`Good next step from your current level`);
      }

      // Match based on time commitment (this could be personalized)
      // For now, assume moderate time commitment preference
      if (path.estimated_hours <= 50) {
        matchScore += 20; // Preferred time commitment
        reasons.push(`Reasonable time commitment`);
      }

      // Only include if there's some match
      if (matchScore > 10) {
        personalizedRecommendations.push({
          path,
          match_score: Math.min(matchScore, 100), // Cap at 100
          reasons
        });
      }
    });

    // Sort by match score
    personalizedRecommendations.sort((a, b) => b.match_score - a.match_score);
    setRecommendations(personalizedRecommendations.slice(0, 5)); // Top 5 recommendations
  };

  // Get learning path details with full course information
  const getLearningPathDetails = async (pathId: string) => {
    try {
      const { data, error } = await supabase
        .from('learning_paths')
        .select(`
          *,
          courses (
            id,
            title,
            description,
            short_description,
            instructor_name,
            difficulty_level,
            duration_hours,
            total_lessons,
            rating,
            review_count,
            thumbnail_url,
            is_free,
            price_cents
          )
        `)
        .eq('id', pathId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching learning path details:', error);
      return null;
    }
  };

  // Initialize
  useEffect(() => {
    fetchLearningPaths();
    if (user) {
      fetchUserInterests();
    }
  }, [user]);

  // Generate recommendations when data changes
  useEffect(() => {
    if (learningPaths.length > 0 && userInterests.length >= 0) {
      generateRecommendations();
    }
  }, [learningPaths, userInterests]);

  return {
    learningPaths,
    userInterests,
    recommendations,
    isLoading,
    fetchLearningPaths,
    updateUserInterest,
    getLearningPathDetails,
    generateRecommendations,
  };
};