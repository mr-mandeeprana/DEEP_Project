import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useNotes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const deleteNote = async (noteId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to delete notes.",
        variant: "destructive",
      });
      return false;
    }

    const confirmDelete = window.confirm('Are you sure you want to delete this note? This action cannot be undone.');

    if (!confirmDelete) return false;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('personal_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Note deleted",
        description: "Your note has been permanently removed.",
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting note:', error);
      toast({
        title: "Failed to delete note",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (noteId: string, currentFavorite: boolean) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to favorite notes.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('personal_notes')
        .update({ is_favorite: !currentFavorite })
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: currentFavorite ? "Removed from favorites" : "Added to favorites",
        description: currentFavorite ? "Note removed from your favorites." : "Note added to your favorites.",
      });

      return true;
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Failed to update favorite",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    deleteNote,
    toggleFavorite,
    loading
  };
};