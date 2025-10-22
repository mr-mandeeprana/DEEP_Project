import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  other_user?: {
    user_id: string;
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
  last_message?: Message;
}

export const useMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    console.log('[DEBUG] useMessages fetchConversations called, user:', user?.id);
    if (!user) return;

    try {
      setLoading(true);

      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations (
            id,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      console.log('[DEBUG] useMessages participantData:', participantData?.length, 'error:', participantError);

      if (participantError) throw participantError;

      const conversationsWithDetails = await Promise.all(
        participantData.map(async (participant: any) => {
          const conversationId = participant.conversation_id;
          console.log('[DEBUG] Processing conversation:', conversationId);

          // Get other participant with error handling
          const { data: otherParticipant, error: otherError } = await supabase
            .from('conversation_participants')
            .select(`
              user_id,
              profiles (
                user_id,
                display_name,
                username,
                avatar_url
              )
            `)
            .eq('conversation_id', conversationId)
            .neq('user_id', user.id)
            .single();

          console.log('[DEBUG] Other participant for', conversationId, ':', otherParticipant, 'error:', otherError);

          // Get last message with error handling
          const { data: lastMessage, error: msgError } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .limit(1);

          console.log('[DEBUG] Last message for', conversationId, ':', !!lastMessage, 'error:', msgError);

          return {
            ...participant.conversations,
            other_user: otherParticipant?.profiles || null,
            last_message: lastMessage?.[0] || null,
          };
        })
      );

      console.log('[DEBUG] useMessages final conversations:', conversationsWithDetails.length);
      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const getOrCreateConversation = useCallback(async (otherUserId: string) => {
    console.log('[DEBUG] getOrCreateConversation called with otherUserId:', otherUserId);
    if (!user) return null;

    try {
      // Check if conversation already exists with better error handling
      console.log('[DEBUG] Checking existing conversations for user:', user.id);
      const { data: existingParticipants, error: existingError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      console.log('[DEBUG] Existing participants:', existingParticipants?.length, 'error:', existingError);

      if (existingError) throw existingError;

      if (existingParticipants) {
        for (const participant of existingParticipants) {
          console.log('[DEBUG] Checking conversation:', participant.conversation_id);
          const { data: otherParticipant, error: otherError } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', participant.conversation_id)
            .eq('user_id', otherUserId);

          console.log('[DEBUG] Other participant check result:', !!otherParticipant, 'error:', otherError);

          if (otherParticipant && otherParticipant.length > 0) {
            console.log('[DEBUG] Found existing conversation:', participant.conversation_id);
            return participant.conversation_id;
          }
        }
      }

      // Create new conversation
      console.log('[DEBUG] Creating new conversation');
      const { data: newConversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

      console.log('[DEBUG] New conversation created:', newConversation?.id, 'error:', conversationError);

      if (conversationError) throw conversationError;

      // Add both participants with transaction-like behavior
      console.log('[DEBUG] Adding participants to conversation:', newConversation.id);
      const participants = [
        { conversation_id: newConversation.id, user_id: user.id },
        { conversation_id: newConversation.id, user_id: otherUserId },
      ];

      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      console.log('[DEBUG] Participants added, error:', participantsError);

      if (participantsError) throw participantsError;

      return newConversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation');
      return null;
    }
  }, [user, toast]);

  const sendMessage = async (conversationId: string, content: string) => {
    console.log('[DEBUG] useMessages sendMessage called, conversation:', conversationId, 'content length:', content.length);
    if (!user) throw new Error('User not authenticated');

    try {
      // First, ensure the conversation exists and user has access
      const { data: conversationCheck, error: convError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (convError || !conversationCheck) {
        throw new Error('Conversation not found or access denied');
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          read: false,
        })
        .select()
        .single();

      console.log('[DEBUG] useMessages sendMessage result:', data, 'error:', error);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      throw error; // Re-throw to allow caller to handle
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  return {
    conversations,
    loading,
    fetchConversations,
    getOrCreateConversation,
    sendMessage,
  };
};
