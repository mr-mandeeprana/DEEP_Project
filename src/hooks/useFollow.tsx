import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface FollowData {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
  isLoading: boolean;
}

export function useFollow(targetUserId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [followData, setFollowData] = useState<FollowData>({
    isFollowing: false,
    followersCount: 0,
    followingCount: 0,
    isLoading: true,
  });

  // Fetch follow status and counts
  useEffect(() => {
    const fetchFollowData = async () => {
      if (!user || !targetUserId) return;

      try {
        // Check if current user follows target user
        const { data: followData, error: followError } = await supabase
          .from('user_follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
          .single();

        // Get followers count for target user
        const { count: followersCount, error: followersError } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', targetUserId);

        // Get following count for target user
        const { count: followingCount, error: followingError } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', targetUserId);

        if (followError && followError.code !== 'PGRST116') {
          console.error('Error fetching follow data:', followError);
          return;
        }

        if (followersError || followingError) {
          console.error('Error fetching counts:', followersError || followingError);
          return;
        }

        setFollowData({
          isFollowing: !!followData,
          followersCount: followersCount || 0,
          followingCount: followingCount || 0,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error in fetchFollowData:', error);
        setFollowData(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchFollowData();
  }, [user, targetUserId]);

  // Follow user
  const followUser = async () => {
    if (!user || !targetUserId) return;

    try {
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to follow user",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setFollowData(prev => ({
        ...prev,
        isFollowing: true,
        followersCount: prev.followersCount + 1,
      }));

      // Update profiles table counts
      await Promise.all([
        supabase.rpc('increment_followers_count', { user_id: targetUserId }),
        supabase.rpc('increment_following_count', { user_id: user.id }),
      ]);

      toast({
        title: "Success",
        description: "You are now following this user",
      });
    } catch (error) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    }
  };

  // Unfollow user
  const unfollowUser = async () => {
    if (!user || !targetUserId) return;

    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to unfollow user",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setFollowData(prev => ({
        ...prev,
        isFollowing: false,
        followersCount: Math.max(0, prev.followersCount - 1),
      }));

      // Update profiles table counts
      await Promise.all([
        supabase.rpc('decrement_followers_count', { user_id: targetUserId }),
        supabase.rpc('decrement_following_count', { user_id: user.id }),
      ]);

      toast({
        title: "Success",
        description: "You have unfollowed this user",
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive",
      });
    }
  };

  return {
    ...followData,
    followUser,
    unfollowUser,
  };
}
