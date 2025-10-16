import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string | null;
    username: string;
    avatar_url: string | null;
  };
}

interface CommentsData {
  comments: Comment[];
  loading: boolean;
  count: number;
}

export function useComments(postId: string): CommentsData & {
  addComment: (content: string) => Promise<void>;
  editComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  refreshComments: () => Promise<void>;
} {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentsData, setCommentsData] = useState<CommentsData>({
    comments: [],
    loading: true,
    count: 0,
  });

  // Fetch comments
  const fetchComments = async () => {
    try {
      const { data, error, count } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles (
            display_name,
            username,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setCommentsData({
        comments: data || [],
        loading: false,
        count: count || 0,
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      setCommentsData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  // Add comment
  const addComment = async (content: string) => {
    if (!user || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
        });

      if (error) throw error;

      // Update post comments count
      await supabase.rpc('increment_post_comments', { post_id: postId });

      // Refresh comments
      await fetchComments();

      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  // Edit comment
  const editComment = async (commentId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .eq('user_id', user.id); // Ensure user owns the comment

      if (error) throw error;

      // Refresh comments
      await fetchComments();

      toast({
        title: "Comment updated",
        description: "Your comment has been updated",
      });
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      });
    }
  };

  // Delete comment
  const deleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // Ensure user owns the comment

      if (error) throw error;

      // Update post comments count
      await supabase.rpc('decrement_post_comments', { post_id: postId });

      // Refresh comments
      await fetchComments();

      toast({
        title: "Comment deleted",
        description: "Your comment has been removed",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    }
  };

  // Refresh comments
  const refreshComments = async () => {
    await fetchComments();
  };

  return {
    ...commentsData,
    addComment,
    editComment,
    deleteComment,
    refreshComments,
  };
}