import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface SaveData {
  isSaved: boolean;
  loading: boolean;
}

export function useSavedPosts(postId: string): SaveData & {
  toggleSave: () => Promise<void>;
} {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saveData, setSaveData] = useState<SaveData>({
    isSaved: false,
    loading: true,
  });

  // Fetch save status
  useEffect(() => {
    const fetchSaveStatus = async () => {
      if (!postId || !user) {
        setSaveData(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        const { data: saveData, error } = await supabase
          .from('saved_posts')
          .select('*')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching save status:', error);
          return;
        }

        setSaveData({
          isSaved: !!saveData,
          loading: false,
        });
      } catch (error) {
        console.error('Error in fetchSaveStatus:', error);
        setSaveData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchSaveStatus();
  }, [postId, user]);

  // Toggle save
  const toggleSave = async () => {
    if (!user || !postId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save posts",
        variant: "destructive",
      });
      return;
    }

    const wasSaved = saveData.isSaved;

    // Optimistic update
    setSaveData(prev => ({
      ...prev,
      isSaved: !wasSaved,
    }));

    try {
      if (wasSaved) {
        // Unsave
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Save
        const { error } = await supabase
          .from('saved_posts')
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        if (error) throw error;
      }

      toast({
        title: wasSaved ? "Post unsaved" : "Post saved",
        description: wasSaved ? "Post removed from your saved posts" : "Post added to your saved posts",
      });
    } catch (error) {
      // Revert optimistic update on error
      setSaveData(prev => ({
        ...prev,
        isSaved: wasSaved,
      }));

      console.error('Error toggling save:', error);
      toast({
        title: "Error",
        description: `Failed to ${wasSaved ? 'unsave' : 'save'} post`,
        variant: "destructive",
      });
    }
  };

  return {
    ...saveData,
    toggleSave,
  };
}
