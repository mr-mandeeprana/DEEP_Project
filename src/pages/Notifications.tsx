import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  Heart,
  MessageCircle,
  UserPlus,
  AtSign,
  Bookmark,
  Settings,
  Bell,
  CheckCheck,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'save';
  message: string;
  created_at: string;
  read: boolean;
  actor_id: string;
  target_id?: string;
  post_id?: string;
  actor_profile?: {
    display_name: string | null;
    username: string;
    avatar_url: string | null;
  };
  post_title?: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      // For now, we'll simulate notifications since we need to add them to the database
      // In a real implementation, you'd have a notifications table
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'like',
          message: 'liked your post "Finding peace in meditation"',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          read: false,
          actor_id: 'user1',
          post_id: 'post1',
          actor_profile: {
            display_name: 'Sarah Chen',
            username: 'sarah_meditation',
            avatar_url: null
          },
          post_title: 'Finding peace in meditation'
        },
        {
          id: '2',
          type: 'comment',
          message: 'commented on your post "Daily wisdom practice"',
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
          read: true,
          actor_id: 'user2',
          post_id: 'post2',
          actor_profile: {
            display_name: 'Marcus Johnson',
            username: 'marcus_wisdom',
            avatar_url: null
          },
          post_title: 'Daily wisdom practice'
        },
        {
          id: '3',
          type: 'follow',
          message: 'started following you',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          read: false,
          actor_id: 'user3',
          actor_profile: {
            display_name: 'Elena Rodriguez',
            username: 'elena_spirit',
            avatar_url: null
          }
        } as Notification,
        {
          id: '4',
          type: 'save',
          message: 'saved your post "Ancient wisdom for modern times"',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          read: true,
          actor_id: 'user4',
          post_id: 'post3',
          actor_profile: {
            display_name: 'David Kumar',
            username: 'david_ancient',
            avatar_url: null
          },
          post_title: 'Ancient wisdom for modern times'
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = async () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    toast({
      title: "All notifications marked as read",
    });
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const iconProps = { className: "w-4 h-4" };

    switch (type) {
      case 'like':
        return <Heart {...iconProps} className="w-4 h-4 text-red-500" />;
      case 'comment':
        return <MessageCircle {...iconProps} className="w-4 h-4 text-blue-500" />;
      case 'follow':
        return <UserPlus {...iconProps} className="w-4 h-4 text-green-500" />;
      case 'mention':
        return <AtSign {...iconProps} className="w-4 h-4 text-purple-500" />;
      case 'save':
        return <Bookmark {...iconProps} className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell {...iconProps} className="w-4 h-4" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);

    // Navigate based on notification type
    if (notification.post_id) {
      // Navigate to post
      navigate(`/community?post=${notification.post_id}`);
    } else if (notification.type === 'follow' && notification.actor_id) {
      // Navigate to user profile
      navigate(`/profile/${notification.actor_id}`);
    }
  };

  const filteredNotifications = activeTab === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="w-6 h-6" />
              Notifications
            </h1>
            <p className="text-muted-foreground">
              Stay updated with your community activity
            </p>
          </div>

          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-500">{notifications.filter(n => n.type === 'like').length}</div>
              <div className="text-sm text-muted-foreground">Likes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-500">{notifications.filter(n => n.type === 'comment').length}</div>
              <div className="text-sm text-muted-foreground">Comments</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">{notifications.filter(n => n.type === 'follow').length}</div>
              <div className="text-sm text-muted-foreground">New Followers</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'unread')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all" className="relative">
              All
              <Badge variant="secondary" className="ml-2">{notifications.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="relative">
              Unread
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredNotifications.length > 0 ? (
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                        !notification.read ? 'border-l-4 border-l-primary bg-accent/20' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>

                          <Avatar className="w-10 h-10">
                            <AvatarImage src={notification.actor_profile?.avatar_url || ''} />
                            <AvatarFallback className="bg-gradient-hero text-white text-xs">
                              {notification.actor_profile?.display_name?.[0]?.toUpperCase() ||
                               notification.actor_profile?.username?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm">
                                  <span className="font-semibold">
                                    {notification.actor_profile?.display_name || notification.actor_profile?.username}
                                  </span>
                                  {' '}
                                  {notification.message}
                                </p>

                                {notification.post_title && (
                                  <p className="text-xs text-muted-foreground mt-1 truncate">
                                    "{notification.post_title}"
                                  </p>
                                )}

                                <p className="text-xs text-muted-foreground mt-2">
                                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </p>
                              </div>

                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </h3>
                <p className="text-muted-foreground">
                  {activeTab === 'unread'
                    ? 'You\'re all caught up!'
                    : 'When people interact with your posts, you\'ll see them here.'
                  }
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Settings */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="w-5 h-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Likes</p>
                <p className="text-sm text-muted-foreground">Get notified when someone likes your posts</p>
              </div>
              <Badge variant="secondary">Enabled</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Comments</p>
                <p className="text-sm text-muted-foreground">Get notified when someone comments on your posts</p>
              </div>
              <Badge variant="secondary">Enabled</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New Followers</p>
                <p className="text-sm text-muted-foreground">Get notified when someone follows you</p>
              </div>
              <Badge variant="secondary">Enabled</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mentions</p>
                <p className="text-sm text-muted-foreground">Get notified when someone mentions you</p>
              </div>
              <Badge variant="secondary">Enabled</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}