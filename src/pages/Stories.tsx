import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useStories } from '@/hooks/useStories';
import {
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Send,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption?: string;
  created_at: string;
  expires_at: string;
  profiles?: {
    display_name: string | null;
    username: string;
    avatar_url: string | null;
  };
}

interface StoryView {
  id: string;
  story_id: string;
  viewer_id: string;
  viewed_at: string;
}

export default function Stories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { deleteStory } = useStories();
  const [stories, setStories] = useState<Story[]>([]);
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    fetchStories();
    if (user) {
      fetchUserStories();
    }
  }, [user]);

  // Auto-advance stories
  useEffect(() => {
    if (!isViewerOpen || isPaused) return;

    const interval = setInterval(() => {
      setCurrentProgress(prev => {
        if (prev >= 100) {
          // Move to next story or close viewer
          const nextIndex = selectedStoryIndex + 1;
          if (nextIndex < stories.length) {
            setSelectedStoryIndex(nextIndex);
            return 0;
          } else {
            setIsViewerOpen(false);
            return 0;
          }
        }
        return prev + 2; // Progress per interval
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isViewerOpen, selectedStoryIndex, stories.length, isPaused]);

  const fetchStories = async () => {
    try {
      // Get stories from the last 24 hours that haven't expired
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('user_stories')
        .select(`
          *,
          profiles!inner (
            display_name,
            username,
            avatar_url
          )
        `)
        .gt('created_at', twentyFourHoursAgo)
        .neq('user_id', user?.id || '') // Exclude own stories for now
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const fetchUserStories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_stories')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserStories(data || []);
    } catch (error) {
      console.error('Error fetching user stories:', error);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    const success = await deleteStory(storyId);
    if (success) {
      fetchUserStories();
      fetchStories();
    }
  };

  const openStoryViewer = (storyIndex: number) => {
    setSelectedStoryIndex(storyIndex);
    setCurrentProgress(0);
    setIsViewerOpen(true);
  };

  const closeStoryViewer = () => {
    setIsViewerOpen(false);
    setCurrentProgress(0);
  };

  const goToPreviousStory = () => {
    if (selectedStoryIndex > 0) {
      setSelectedStoryIndex(selectedStoryIndex - 1);
      setCurrentProgress(0);
    }
  };

  const goToNextStory = () => {
    if (selectedStoryIndex < stories.length - 1) {
      setSelectedStoryIndex(selectedStoryIndex + 1);
      setCurrentProgress(0);
    } else {
      closeStoryViewer();
    }
  };

  // Group stories by user
  const storiesByUser = stories.reduce((acc, story) => {
    const userId = story.user_id;
    if (!acc[userId]) {
      acc[userId] = {
        user: story.profiles,
        stories: []
      };
    }
    acc[userId].stories.push(story);
    return acc;
  }, {} as Record<string, { user: any; stories: Story[] }>);

  const currentStory = stories[selectedStoryIndex];

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Stories</h1>
          <Button className="bg-gradient-hero hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Add Story
          </Button>
        </div>

        {/* Stories Row */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
          {/* Add Story for current user */}
          <Card className="flex-shrink-0 w-20 h-28 cursor-pointer group">
            <CardContent className="p-2 h-full flex flex-col items-center justify-center relative">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-2 group-hover:bg-accent transition-colors">
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-xs text-center text-muted-foreground">Add Story</p>
            </CardContent>
          </Card>

          {/* User Stories */}
          {Object.entries(storiesByUser).map(([userId, userData]) => (
            <Card
              key={userId}
              className="flex-shrink-0 w-20 h-28 cursor-pointer group"
              onClick={() => openStoryViewer(stories.findIndex(s => s.user_id === userId))}
            >
              <CardContent className="p-2 h-full flex flex-col items-center justify-center relative">
                {/* Story Ring */}
                <div className="absolute inset-0 rounded-lg p-1">
                  <div className="w-full h-full rounded-lg bg-gradient-to-tr from-orange-400 via-pink-500 to-purple-600 p-0.5">
                    <div className="w-full h-full bg-background rounded-lg flex items-center justify-center">
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={userData.user?.avatar_url || ''} />
                        <AvatarFallback className="bg-gradient-hero text-white text-sm">
                          {userData.user?.display_name?.[0]?.toUpperCase() ||
                           userData.user?.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </div>

                {/* Story Indicator */}
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs text-primary-foreground font-bold">
                    {userData.stories.length}
                  </span>
                </div>

                <p className="text-xs text-center mt-16 truncate w-full">
                  {userData.user?.display_name || userData.user?.username || 'User'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Story Viewer Modal */}
        <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
          <DialogContent className="max-w-md h-[600px] p-0 bg-black border-0">
            {currentStory && (
              <div
                className="relative w-full h-full"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {/* Progress Bar */}
                <div className="absolute top-4 left-4 right-4 z-10">
                  <Progress value={currentProgress} className="h-1" />
                </div>

                {/* Close Button */}
                <button
                  onClick={closeStoryViewer}
                  className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 rounded-full p-1"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Story Content */}
                <div className="w-full h-full flex items-center justify-center">
                  {currentStory.media_type === 'image' ? (
                    <img
                      src={currentStory.media_url}
                      alt="Story"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <video
                      src={currentStory.media_url}
                      className="max-w-full max-h-full object-contain"
                      autoPlay
                      muted
                    />
                  )}
                </div>

                {/* Caption */}
                {currentStory.caption && (
                  <div className="absolute bottom-20 left-4 right-4 bg-black/50 text-white p-3 rounded-lg">
                    <p className="text-sm">{currentStory.caption}</p>
                  </div>
                )}

                {/* User Info & Actions */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={currentStory.profiles?.avatar_url || ''} />
                      <AvatarFallback className="bg-gradient-hero text-white text-xs">
                        {currentStory.profiles?.display_name?.[0]?.toUpperCase() ||
                         currentStory.profiles?.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white text-sm font-semibold">
                        {currentStory.profiles?.display_name || currentStory.profiles?.username}
                      </p>
                      <p className="text-white/70 text-xs">
                        {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30">
                      <Heart className="w-4 h-4 text-white" />
                    </Button>
                    <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </Button>
                    <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30">
                      <Send className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                </div>

                {/* Navigation Areas */}
                <div
                  className="absolute left-0 top-0 w-1/3 h-full cursor-pointer"
                  onClick={goToPreviousStory}
                />
                <div
                  className="absolute right-0 top-0 w-1/3 h-full cursor-pointer"
                  onClick={goToNextStory}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Highlights Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-6">Highlights</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {userStories.slice(0, 8).map((story, index) => (
              <Card key={story.id} className="aspect-square relative cursor-pointer group overflow-hidden">
                <img
                  src={story.media_url}
                  alt={`Highlight ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStory(story.id);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                    >
                      View Highlight
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}