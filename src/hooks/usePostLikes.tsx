import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const usePostLikes = (postId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchLikeStatus = async () => {
    if (!user || !postId) return;

    try {
      const { data: like, error: likeError } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      setIsLiked(!!like);

      const { count, error: countError } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      setLikesCount(count || 0);
    } catch (error) {
      console.error('Error fetching like status:', error);
    }
  };

  const toggleLike = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like posts.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });

        if (error) throw error;
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      toast({
        title: "Failed to update like",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to delete posts.",
        variant: "destructive",
      });
      return;
    }

    // Check if user owns the post
    const { data: post } = await supabase
      .from('community_posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (!post || post.user_id !== user.id) {
      toast({
        title: "Permission denied",
        description: "You can only delete your own posts.",
        variant: "destructive",
      });
      return;
    }

    const confirmDelete = window.confirm('Are you sure you want to delete this post? This action cannot be undone.');

    if (!confirmDelete) return;

    try {
      // Delete related data first
      await supabase.from('post_likes').delete().eq('post_id', postId);
      await supabase.from('comments').delete().eq('post_id', postId);
      await supabase.from('saved_posts').delete().eq('post_id', postId);

      // Delete the post
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Post deleted",
        description: "Your post has been permanently removed.",
      });

      // Trigger a refetch by calling a callback if needed
      // This would typically be handled by the parent component
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: "Failed to delete post",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchLikeStatus();
  }, [postId, user]);

  return {
    isLiked,
    likesCount,
    loading,
    toggleLike,
    deletePost
  };
};
