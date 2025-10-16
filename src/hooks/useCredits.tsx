import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const useCredits = () => {
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCredits();
      
      // Set up real-time subscription for credits changes
      const channel = supabase
        .channel('credits-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newCredits = payload.new.credits;
            setCredits(newCredits);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchCredits = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setCredits(data?.credits || 0);
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addCredits = async (amount: number, reason: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('increment_credits', {
        user_id: user.id,
        amount: amount
      });

      if (error) throw error;

      toast({
        title: `+${amount} Credits!`,
        description: reason,
        duration: 3000,
      });

      await fetchCredits();
      return true;
    } catch (error) {
      console.error('Error adding credits:', error);
      return false;
    }
  };

  const deductCredits = async (amount: number, reason: string) => {
    if (!user) return false;

    if (credits < amount) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${amount} credits for this action. Current: ${credits}`,
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('increment_credits', {
        user_id: user.id,
        amount: -amount
      });

      if (error) throw error;

      toast({
        title: `-${amount} Credits`,
        description: reason,
        duration: 3000,
      });

      await fetchCredits();
      return true;
    } catch (error) {
      console.error('Error deducting credits:', error);
      return false;
    }
  };

  return {
    credits,
    isLoading,
    addCredits,
    deductCredits,
    refreshCredits: fetchCredits,
  };
};
