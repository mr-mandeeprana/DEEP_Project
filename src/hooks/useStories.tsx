import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useStories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const deleteStory = async (storyId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to delete stories.",
        variant: "destructive",
      });
      return false;
    }

    const confirmDelete = window.confirm('Are you sure you want to delete this story? This action cannot be undone.');

    if (!confirmDelete) return false;

    setLoading(true);

    try {
      // Check if user owns the story
      const { data: story } = await supabase
        .from('user_stories')
        .select('user_id')
        .eq('id', storyId)
        .single();

      if (!story || story.user_id !== user.id) {
        toast({
          title: "Permission denied",
          description: "You can only delete your own stories.",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('user_stories')
        .delete()
        .eq('id', storyId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Story deleted",
        description: "Your story has been permanently removed.",
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting story:', error);
      toast({
        title: "Failed to delete story",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createStory = async (file: File, caption?: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create stories.",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);

    try {
      // Upload media to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `stories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Create story record
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now

      const { error: storyError } = await supabase
        .from('user_stories')
        .insert({
          user_id: user.id,
          media_url: publicUrl,
          media_type: file.type.startsWith('image/') ? 'image' : 'video',
          caption: caption || null,
          expires_at: expiresAt
        });

      if (storyError) throw storyError;

      toast({
        title: "Story created!",
        description: "Your story has been shared successfully.",
      });

      return true;
    } catch (error: any) {
      console.error('Error creating story:', error);
      toast({
        title: "Failed to create story",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteStory,
    createStory,
    loading
  };
};