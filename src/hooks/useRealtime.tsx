import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface RealtimeCallbacks {
  onPostUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onCommentUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onLikeUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onFollowUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onMessageUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onSessionUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onBookingUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
}

export function useRealtime(callbacks: RealtimeCallbacks = {}) {
  const { user } = useAuth();
  const { toast } = useToast();

  const setupRealtimeSubscriptions = useCallback(() => {
    if (!user) return;

    const channels: RealtimeChannel[] = [];

    // Posts realtime updates
    const postsChannel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_posts',
        },
        (payload) => {
          console.log('Post change:', payload);
          callbacks.onPostUpdate?.(payload);
        }
      )
      .subscribe();

    channels.push(postsChannel);

    // Comments realtime updates
    const commentsChannel = supabase
      .channel('comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_comments',
        },
        (payload) => {
          console.log('Comment change:', payload);
          callbacks.onCommentUpdate?.(payload);
        }
      )
      .subscribe();

    channels.push(commentsChannel);

    // Likes realtime updates
    const likesChannel = supabase
      .channel('likes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_likes',
        },
        (payload) => {
          console.log('Like change:', payload);
          callbacks.onLikeUpdate?.(payload);
        }
      )
      .subscribe();

    channels.push(likesChannel);

    // Follows realtime updates
    const followsChannel = supabase
      .channel('follows-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_follows',
          filter: `follower_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Follow change:', payload);
          callbacks.onFollowUpdate?.(payload);
        }
      )
      .subscribe();

    channels.push(followsChannel);

    // Messages realtime updates
    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Message change:', payload);
          callbacks.onMessageUpdate?.(payload);
        }
      )
      .subscribe();

    channels.push(messagesChannel);

    // Sessions realtime updates
    const sessionsChannel = supabase
      .channel('sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `mentor_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Session change:', payload);
          callbacks.onSessionUpdate?.(payload);
        }
      )
      .subscribe();

    channels.push(sessionsChannel);

    // Bookings realtime updates
    const bookingsChannel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `learner_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Booking change:', payload);
          callbacks.onBookingUpdate?.(payload);
        }
      )
      .subscribe();

    channels.push(bookingsChannel);

    // Profile updates for followed users
    const profileChannel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log('Profile change:', payload);
          // Handle profile updates (follower counts, etc.)
        }
      )
      .subscribe();

    channels.push(profileChannel);

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user, callbacks]);

  useEffect(() => {
    const cleanup = setupRealtimeSubscriptions();

    return () => {
      cleanup?.();
    };
  }, [setupRealtimeSubscriptions]);

  return {
    // You can return any utilities here if needed
  };
}

// Hook for specific table realtime updates
export function useRealtimeTable<T>(
  table: string,
  callbacks: {
    onInsert?: (payload: RealtimePostgresChangesPayload<T>) => void;
    onUpdate?: (payload: RealtimePostgresChangesPayload<T>) => void;
    onDelete?: (payload: RealtimePostgresChangesPayload<T>) => void;
  } = {},
  filter?: string
) {
  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter,
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              callbacks.onInsert?.(payload as any);
              break;
            case 'UPDATE':
              callbacks.onUpdate?.(payload as any);
              break;
            case 'DELETE':
              callbacks.onDelete?.(payload as any);
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, callbacks]);
}