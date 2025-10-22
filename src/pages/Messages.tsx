import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMessages, Conversation, Message } from '@/hooks/useMessages';
import { useRealtime } from '@/hooks/useRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Send,
  Search,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Image,
  ArrowLeft
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// Use interfaces from useMessages hook for consistency
// Conversation and Message interfaces are imported from useMessages hook

export default function Messages() {
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('user');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { conversations, loading, fetchConversations, getOrCreateConversation, sendMessage } = useMessages();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (user && targetUserId) {
      startConversationWithUser(targetUserId);
    }
  }, [user, targetUserId]);

  // Fetch messages when selected conversation changes
  useEffect(() => {
    if (selectedConversation) {
      fetchMessagesForConversation(selectedConversation.id);
      // Mark messages as read when conversation is selected
      markMessagesAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  const markMessagesAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      // Mark messages as read where sender is not the current user
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('read', false);

      if (error) throw error;

      // Update local state to reflect read status
      setMessages(prev => prev.map(msg =>
        msg.sender_id !== user.id ? { ...msg, read: true } : msg
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time message updates with improved handling
  useRealtime({
    onMessageUpdate: (payload) => {
      console.log('[REALTIME] Message update:', payload);

      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new as Message;
        // Only update if the message belongs to the current conversation
        if (selectedConversation && newMessage.conversation_id === selectedConversation.id) {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage].sort((a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
        }

        // Refresh conversations to update last messages and unread counts
        fetchConversations();
      } else if (payload.eventType === 'UPDATE') {
        const updatedMessage = payload.new as Message;
        // Update read status in real-time
        if (selectedConversation && updatedMessage.conversation_id === selectedConversation.id) {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      }
    },
  });

  const fetchMessagesForConversation = useCallback(async (conversationId: string) => {
    console.log('[DEBUG] fetchMessagesForConversation called for conversation:', conversationId);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      console.log('[DEBUG] fetchMessagesForConversation result - messages count:', data?.length, 'error:', error);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  }, [toast]);

  const startConversationWithUser = useCallback(async (targetUserId: string) => {
    console.log('[DEBUG] startConversationWithUser called with targetUserId:', targetUserId);
    try {
      // Use the hook's getOrCreateConversation method
      const conversationId = await getOrCreateConversation(targetUserId);

      if (conversationId) {
        // Find the conversation in the list and select it
        const conversation = conversations.find(conv => conv.id === conversationId);
        if (conversation) {
          setSelectedConversation(conversation);
        } else {
          // If not found, refresh conversations and try again
          await fetchConversations();
          // The conversations will be updated and we can select it
          setTimeout(() => {
            const updatedConversation = conversations.find(conv => conv.id === conversationId);
            if (updatedConversation) {
              setSelectedConversation(updatedConversation);
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  }, [conversations, getOrCreateConversation, fetchConversations, toast]);


  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) {
      return;
    }

    setIsSending(true);
    const messageContent = newMessage.trim();

    try {
      await sendMessage(selectedConversation.id, messageContent);
      setNewMessage('');
      // Messages will be updated via real-time subscription
    } catch (error) {
      // Error handling is done in the hook, but we can add additional UI feedback
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.other_user?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.other_user?.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex bg-background">
      {/* Conversations Sidebar */}
      <div className="w-full md:w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">Messages</h1>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length > 0 ? (
            <div className="p-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-accent'
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => {
                    setSelectedConversation(conversation);
                    fetchMessagesForConversation(conversation.id);
                  }}
                >
                  <div className="flex gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conversation.other_user?.avatar_url || ''} />
                      <AvatarFallback className="bg-gradient-hero text-white">
                        {conversation.other_user?.display_name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm truncate">
                          {conversation.other_user?.display_name || conversation.other_user?.username}
                        </h3>
                        {conversation.last_message && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>

                      {conversation.last_message && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {conversation.last_message.sender_id === user?.id ? 'You: ' : ''}
                          {conversation.last_message.content}
                        </p>
                      )}

                      {/* TODO: Implement unread count */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No conversations yet</h3>
              <p className="text-sm text-muted-foreground">
                Start a conversation by searching for users
              </p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col hidden md:flex">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedConversation.other_user?.avatar_url || ''} />
                  <AvatarFallback className="bg-gradient-hero text-white">
                    {selectedConversation.other_user?.display_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">
                    {selectedConversation.other_user?.display_name || selectedConversation.other_user?.username}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    @{selectedConversation.other_user?.username}
                  </p>
                </div>
                <div className="ml-auto flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs opacity-70">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </p>
                        {message.sender_id === user?.id && (
                          <span className="text-xs opacity-70">
                            {message.read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-3">
                <Button variant="ghost" size="icon">
                  <Image className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button onClick={handleSendMessage} disabled={!newMessage.trim() || isSending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
