import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFollow } from '@/hooks/useFollow';
import { Search, User, Users, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  followers_count: number;
  following_count: number;
}

export default function SearchUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq('user_id', user?.id || '') // Exclude current user
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
      setIsOpen(true);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Could not search users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleMessage = (userId: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to send messages',
        variant: 'destructive',
      });
      return;
    }
    navigate(`/messages?user=${userId}`);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="start">
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Searching...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="max-h-80 overflow-y-auto">
            {searchResults.map((profile) => (
              <UserResultItem
                key={profile.user_id}
                profile={profile}
                onUserClick={handleUserClick}
                onMessage={handleMessage}
              />
            ))}
          </div>
        ) : searchQuery.trim() ? (
          <div className="p-4 text-center">
            <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No users found</p>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

interface UserResultItemProps {
  profile: UserProfile;
  onUserClick: (userId: string) => void;
  onMessage: (userId: string) => void;
}

function UserResultItem({ profile, onUserClick, onMessage }: UserResultItemProps) {
  const { user } = useAuth();
  const { isFollowing, followUser, unfollowUser, isLoading } = useFollow(profile.user_id);

  const toggleFollow = async () => {
    if (isFollowing) {
      await unfollowUser();
    } else {
      await followUser();
    }
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering user click
    await toggleFollow();
  };

  return (
    <div
      className="p-3 hover:bg-accent/50 cursor-pointer border-b border-border last:border-b-0"
      onClick={() => onUserClick(profile.user_id)}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile.avatar_url || ''} />
          <AvatarFallback className="bg-gradient-hero text-white">
            {profile.display_name?.[0]?.toUpperCase() || profile.username[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">
              {profile.display_name || profile.username}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              @{profile.username}
            </p>
          </div>

          {profile.bio && (
            <p className="text-xs text-muted-foreground truncate mt-1">
              {profile.bio}
            </p>
          )}

          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{profile.followers_count} followers</span>
            </div>
          </div>
        </div>

        <div className="flex gap-1">
          {user && user.id !== profile.user_id && (
            <>
              <Button
                size="sm"
                variant={isFollowing ? 'outline' : 'default'}
                className={isFollowing ? '' : 'bg-gradient-hero hover:opacity-90'}
                onClick={handleFollow}
                disabled={isLoading}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onMessage(profile.user_id);
                }}
              >
                <MessageCircle className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
