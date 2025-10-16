import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Loader2, Grid3x3, Bookmark, Heart, MessageCircle, Send, Share2, Trophy, Target, Gift, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import EditProfileDialog from '@/components/EditProfileDialog';
import { usePostLikes } from '@/hooks/usePostLikes';
import { useSavedPosts } from '@/hooks/useSavedPosts';
import { useFollow } from '@/hooks/useFollow';
import { CommentsSection } from '@/components/CommentsSection';
import { useGamification } from '@/hooks/useGamification';
import { AchievementCard } from '@/components/AchievementCard';
import { Leaderboard } from '@/components/Leaderboard';
import { ProgressTracker } from '@/components/ProgressTracker';
import { RewardSystem } from '@/components/RewardSystem';
import { StreakCounter } from '@/components/StreakCounter';

const PostInteractionButtons = ({ postId, onDelete }: { postId: string; onDelete?: () => void }) => {
  const { isLiked, likesCount, toggleLike, loading: likeLoading, deletePost } = usePostLikes(postId);
  const { isSaved, loading: saveLoading, toggleSave } = useSavedPosts(postId);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/community?post=${postId}`);
      toast({
        title: 'Link copied!',
        description: 'Post link copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy link to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    await deletePost();
    onDelete?.(); // Trigger refetch in parent component
  };

  return (
    <div className="flex items-center gap-4 pt-4 border-t">
      <button
        className={`flex items-center gap-2 transition-colors ${
          isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
        }`}
        onClick={toggleLike}
        disabled={likeLoading}
      >
        <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
        <span className="text-sm font-semibold">{likesCount} likes</span>
      </button>
      <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
        <MessageCircle className="h-5 w-5" />
        <span className="text-sm">Comment</span>
      </button>
      <button
        className={`flex items-center gap-2 transition-colors ${
          isSaved ? 'text-primary' : 'text-muted-foreground hover:text-primary'
        }`}
        onClick={toggleSave}
        disabled={saveLoading}
      >
        <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
        <span className="text-sm">{isSaved ? 'Saved' : 'Save'}</span>
      </button>
      <button
        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        onClick={handleShare}
      >
        <Share2 className="h-5 w-5" />
        <span className="text-sm">Share</span>
      </button>
      {user && onDelete && (
        <button
          className="flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-colors"
          onClick={handleDelete}
        >
          <Trash2 className="h-5 w-5" />
          <span className="text-sm">Delete</span>
        </button>
      )}
    </div>
  );
};

const SavedPostsTab = ({ userId, onPostUpdate }: { userId: string; onPostUpdate?: () => void }) => {
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const { user } = useAuth();
  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (isOwnProfile) {
      fetchSavedPosts();
    }
  }, [userId, isOwnProfile]);

  const fetchSavedPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_posts')
        .select(`
          post_id,
          community_posts (
            id,
            title,
            content,
            media_urls,
            likes_count,
            comments_count,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const posts = data
        ?.map((item: any) => item.community_posts)
        .filter(Boolean) || [];
      
      setSavedPosts(posts);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOwnProfile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">You can only view your own saved posts</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  if (savedPosts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No saved posts yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-4">
      {savedPosts.map((post) => (
        <Dialog key={post.id}>
          <DialogTrigger asChild>
            <Card
              className="aspect-square relative group cursor-pointer overflow-hidden border-0"
              onClick={() => setSelectedPost(post)}
            >
              {post.media_urls?.[0] ? (
                <img
                  src={post.media_urls[0]}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <p className="text-xs text-center p-2 line-clamp-4">
                    {post.content}
                  </p>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-white">
                  <Heart className="h-5 w-5 fill-white" />
                  <span className="font-semibold">{post.likes_count}</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <MessageCircle className="h-5 w-5 fill-white" />
                  <span className="font-semibold">{post.comments_count}</span>
                </div>
              </div>
            </Card>
          </DialogTrigger>

          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
            {selectedPost && selectedPost.id === post.id && (
              <div className="grid md:grid-cols-2 gap-0">
                <div className="bg-black flex items-center justify-center min-h-[400px]">
                  {selectedPost.media_urls?.[0] ? (
                    <img
                      src={selectedPost.media_urls[0]}
                      alt={selectedPost.title}
                      className="max-h-[80vh] w-full object-contain"
                    />
                  ) : (
                    <div className="p-8 text-white">
                      <p className="whitespace-pre-wrap">{selectedPost.content}</p>
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">{selectedPost.title}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedPost.content}
                    </p>
                  </div>

                  <PostInteractionButtons postId={selectedPost.id} onDelete={onPostUpdate} />

                  {/* Comments Section */}
                  <CommentsSection
                    postId={selectedPost.id}
                    initialCommentsCount={selectedPost.comments_count}
                  />

                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(selectedPost.created_at), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
};

interface Profile {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  followers_count: number;
  following_count: number;
}

interface Post {
  id: string;
  title: string;
  content: string;
  media_urls: string[] | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id?: string;
}

export default function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isFollowing, followUser, unfollowUser, isLoading } = useFollow(userId || '');
  const {
    userStats,
    achievements,
    unlockedAchievements,
    leaderboard,
    isLoading: gamificationLoading,
    awardPoints,
    getRarityColor,
    getCategoryIcon
  } = useGamification();

  const toggleFollow = async () => {
    if (isFollowing) {
      await unfollowUser();
    } else {
      await followUser();
    }
  };

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchPosts();
      if (isOwnProfile) {
        fetchSavedPosts();
      }
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchSavedPosts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('saved_posts')
        .select(`
          post_id,
          community_posts (
            id,
            title,
            content,
            media_urls,
            likes_count,
            comments_count,
            created_at,
            user_id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedPosts = (data || [])
        .map(item => item.community_posts)
        .filter(Boolean) as Post[];
      
      setSavedPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    }
  };

  const handleMessage = () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to send messages',
        variant: 'destructive',
      });
      return;
    }
    navigate(`/messages?user=${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col sm:flex-row gap-4 md:gap-8 items-center sm:items-start mb-6 md:mb-8">
          {/* Avatar */}
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 shrink-0">
            <AvatarImage src={profile.avatar_url || ''} />
            <AvatarFallback className="text-xl md:text-2xl">
              {profile.display_name?.[0]?.toUpperCase() || profile.username[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          {/* Profile Info */}
          <div className="flex-1 w-full text-center sm:text-left">
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-center sm:items-start mb-4">
              <div className="flex-1">
                <h1 className="text-xl md:text-2xl font-semibold">{profile.display_name || profile.username}</h1>
                <p className="text-sm md:text-base text-muted-foreground">@{profile.username}</p>
              </div>
              
              {isOwnProfile ? (
                <EditProfileDialog profile={profile} onUpdate={fetchProfile} />
              ) : (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    onClick={toggleFollow}
                    variant={isFollowing ? 'outline' : 'default'}
                    disabled={isLoading}
                    className="flex-1 sm:flex-initial"
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </Button>
                  <Button
                    onClick={handleMessage}
                    variant="outline"
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex justify-center sm:justify-start gap-4 md:gap-6 mb-4">
              <div className="text-center">
                <div className="font-semibold text-base md:text-lg">{posts.length}</div>
                <div className="text-xs md:text-sm text-muted-foreground">posts</div>
              </div>
              <div className="text-center cursor-pointer hover:opacity-70">
                <div className="font-semibold text-base md:text-lg">{profile.followers_count}</div>
                <div className="text-xs md:text-sm text-muted-foreground">followers</div>
              </div>
              <div className="text-center cursor-pointer hover:opacity-70">
                <div className="font-semibold text-base md:text-lg">{profile.following_count}</div>
                <div className="text-xs md:text-sm text-muted-foreground">following</div>
              </div>
              {isOwnProfile && (
                <>
                  <div className="text-center">
                    <div className="font-semibold text-base md:text-lg">{userStats.totalPoints}</div>
                    <div className="text-xs md:text-sm text-muted-foreground">points</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-base md:text-lg">Level {userStats.level}</div>
                    <div className="text-xs md:text-sm text-muted-foreground">{userStats.badgesEarned} badges</div>
                  </div>
                </>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full justify-start border-t">
            <TabsTrigger value="posts" className="gap-2 text-xs md:text-sm">
              <Grid3x3 className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Posts</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2 text-xs md:text-sm">
              <Bookmark className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Saved</span>
            </TabsTrigger>
            {isOwnProfile && (
              <>
                <TabsTrigger value="achievements" className="gap-2 text-xs md:text-sm">
                  <Trophy className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Achievements</span>
                </TabsTrigger>
                <TabsTrigger value="progress" className="gap-2 text-xs md:text-sm">
                  <Target className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Progress</span>
                </TabsTrigger>
                <TabsTrigger value="rewards" className="gap-2 text-xs md:text-sm">
                  <Gift className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Rewards</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="posts" className="mt-4 md:mt-6">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No posts yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {posts.map((post) => (
                  <Dialog key={post.id}>
                    <DialogTrigger asChild>
                      <Card
                        className="aspect-square relative group cursor-pointer overflow-hidden border-0"
                        onClick={() => setSelectedPost(post)}
                      >
                        {post.media_urls?.[0] ? (
                          <img
                            src={post.media_urls[0]}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <p className="text-xs text-center p-2 line-clamp-4">
                              {post.content}
                            </p>
                          </div>
                        )}
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                          <div className="flex items-center gap-2 text-white">
                            <Heart className="h-5 w-5 fill-white" />
                            <span className="font-semibold">{post.likes_count}</span>
                          </div>
                          <div className="flex items-center gap-2 text-white">
                            <MessageCircle className="h-5 w-5 fill-white" />
                            <span className="font-semibold">{post.comments_count}</span>
                          </div>
                        </div>
                      </Card>
                    </DialogTrigger>

                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
                      {selectedPost && (
                        <div className="grid md:grid-cols-2 gap-0">
                          {/* Image/Content */}
                          <div className="bg-black flex items-center justify-center min-h-[400px]">
                            {selectedPost.media_urls?.[0] ? (
                              <img
                                src={selectedPost.media_urls[0]}
                                alt={selectedPost.title}
                                className="max-h-[80vh] w-full object-contain"
                              />
                            ) : (
                              <div className="p-8 text-white">
                                <p className="whitespace-pre-wrap">{selectedPost.content}</p>
                              </div>
                            )}
                          </div>

                          {/* Post Details */}
                          <div className="p-6 flex flex-col gap-4">
                            <div className="flex items-center gap-3 pb-4 border-b">
                              <Avatar>
                                <AvatarImage src={profile.avatar_url || ''} />
                                <AvatarFallback>
                                  {profile.display_name?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-semibold">{profile.display_name}</span>
                            </div>

                            <div>
                              <h3 className="font-semibold mb-2">{selectedPost.title}</h3>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {selectedPost.content}
                              </p>
                            </div>
<PostInteractionButtons
  postId={selectedPost.id}
  onDelete={isOwnProfile ? fetchPosts : undefined}
/>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(selectedPost.created_at), {
                                addSuffix: true,
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-4 md:mt-6">
            <SavedPostsTab userId={userId!} onPostUpdate={fetchSavedPosts} />
          </TabsContent>

          {isOwnProfile && (
            <>
              <TabsContent value="achievements" className="mt-4 md:mt-6">
                <div className="space-y-6">
                  {/* Streak Counter */}
                  <StreakCounter
                    currentStreak={userStats.currentStreak}
                    longestStreak={userStats.longestStreak}
                    todayCompleted={userStats.lastActivityDate === new Date().toISOString().split('T')[0]}
                    nextMilestone={userStats.currentStreak + (7 - (userStats.currentStreak % 7))}
                  />

                  {/* Unlocked Achievements */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      Your Achievements ({unlockedAchievements.length})
                    </h3>
                    {unlockedAchievements.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No achievements unlocked yet.</p>
                        <p className="text-sm">Start engaging to earn your first badge!</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {unlockedAchievements.map((achievement) => (
                          <AchievementCard
                            key={achievement.id}
                            achievement={achievement}
                            getRarityColor={getRarityColor}
                            getCategoryIcon={getCategoryIcon}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Locked Achievements */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Available Achievements</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {achievements
                        .filter(achievement => !achievement.unlockedAt)
                        .map((achievement) => (
                          <AchievementCard
                            key={achievement.id}
                            achievement={achievement}
                            getRarityColor={getRarityColor}
                            getCategoryIcon={getCategoryIcon}
                          />
                        ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="progress" className="mt-4 md:mt-6">
                <ProgressTracker
                  items={achievements.map(achievement => ({
                    id: achievement.id,
                    title: achievement.name,
                    description: achievement.description,
                    completed: !!achievement.unlockedAt,
                    progress: achievement.progress || 0,
                    maxProgress: achievement.maxProgress || 1,
                    category: achievement.category,
                    points: achievement.points,
                  }))}
                  title="Learning & Achievement Progress"
                />
              </TabsContent>

              <TabsContent value="rewards" className="mt-4 md:mt-6">
                <RewardSystem
                  userCredits={userStats.totalPoints}
                  rewards={[
                    {
                      id: 'theme-pack',
                      name: 'Premium Theme Pack',
                      description: 'Unlock beautiful premium themes',
                      cost: 500,
                      icon: '🎨',
                      category: 'cosmetic',
                      available: true,
                    },
                    {
                      id: 'badge-showcase',
                      name: 'Badge Showcase',
                      description: 'Display achievements prominently',
                      cost: 300,
                      icon: '🏆',
                      category: 'feature',
                      available: true,
                    },
                    {
                      id: 'analytics-insights',
                      name: 'Advanced Analytics',
                      description: 'Detailed progress insights',
                      cost: 750,
                      icon: '📊',
                      category: 'premium',
                      available: true,
                    },
                  ]}
                  onRedeemReward={(rewardId) => {
                    // Handle reward redemption
                    console.log('Redeem reward:', rewardId);
                  }}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}
