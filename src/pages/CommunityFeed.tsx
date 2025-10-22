import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Heart, Plus, Users, TrendingUp, Bookmark, Trash2, Loader2, RefreshCw, Rss, Search, Filter, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { usePostLikes } from "@/hooks/usePostLikes";
import { CommentsSection } from "@/components/CommentsSection";

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  post_type: string;
  tags: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  profiles?: {
    display_name: string;
    avatar_url?: string | null;
  };
}

const getPostTypeColor = (type: string) => {
  const colors = {
    thought: "bg-orange-100 text-orange-700",
    experience: "bg-blue-100 text-blue-700",
    verse: "bg-purple-100 text-purple-700",
    question: "bg-yellow-100 text-yellow-700",
    reflection: "bg-green-100 text-green-700"
  };
  return colors[type.toLowerCase() as keyof typeof colors] || "bg-gray-100 text-gray-700";
};

const ShareButton = ({ post }: { post: CommunityPost }) => {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const shareData = {
        title: post.title,
        text: post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content,
        url: `${window.location.origin}/community?post=${post.id}`
      };

      // Check if Web Share API is supported
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: "Shared successfully",
          description: "Post shared via native sharing.",
        });
      } else {
        // Fallback: Copy link to clipboard
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link copied",
          description: "Post link copied to clipboard.",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback options
      const fallbackOptions = [
        {
          name: 'Copy Link',
          action: async () => {
            try {
              await navigator.clipboard.writeText(`${window.location.origin}/community?post=${post.id}`);
              toast({
                title: "Link copied",
                description: "Post link copied to clipboard.",
              });
            } catch (clipboardError) {
              toast({
                title: "Error",
                description: "Failed to copy link. Please try again.",
                variant: "destructive",
              });
            }
          }
        },
        {
          name: 'Share via Email',
          action: () => {
            const subject = encodeURIComponent(post.title);
            const body = encodeURIComponent(`${post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}\n\nRead more: ${window.location.origin}/community?post=${post.id}`);
            window.open(`mailto:?subject=${subject}&body=${body}`);
          }
        }
      ];

      // Show fallback options using a simple alert for now (could be improved with a modal)
      const choice = window.confirm(
        "Native sharing not available. Choose an option:\n1. Copy Link\n2. Share via Email\n\nClick OK for Copy Link, Cancel for Email"
      );
      if (choice) {
        await fallbackOptions[0].action();
      } else {
        fallbackOptions[1].action();
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      className={`flex items-center gap-1 sm:gap-1.5 lg:gap-2 transition-colors touch-manipulation min-h-[40px] sm:min-h-[44px] px-1.5 sm:px-2 py-1 rounded ${
        isSharing ? 'text-blue-500' : 'text-muted-foreground hover:text-blue-500'
      }`}
      onClick={handleShare}
      disabled={isSharing}
      title="Share this post"
    >
      {isSharing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Share2 className="w-4 h-4" />
      )}
      <span className="text-xs sm:text-sm font-medium hidden xs:inline">Share</span>
    </button>
  );
};

const PostInteractions = ({ post, onDelete }: { post: CommunityPost; onDelete?: () => void }) => {
  const { isLiked, likesCount, toggleLike, loading: likeLoading, deletePost } = usePostLikes(post.id);
  const { isSaved, loading: saveLoading, toggleSave } = useSavedPosts(post.id);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await deletePost();
      toast({
        title: "Post deleted",
        description: "Your post has been removed from the community.",
      });
      onDelete?.();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
        <button
          className={`flex items-center gap-1 sm:gap-1.5 lg:gap-2 transition-colors touch-manipulation min-h-[40px] sm:min-h-[44px] px-1.5 sm:px-2 py-1 rounded ${
            isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
          }`}
          onClick={toggleLike}
          disabled={likeLoading}
        >
          {likeLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          )}
          <span className="text-xs sm:text-sm font-medium">{likesCount}</span>
        </button>
        <Link to={`/community?post=${post.id}#comments`} className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 text-muted-foreground hover:text-primary transition-colors touch-manipulation min-h-[40px] sm:min-h-[44px] px-1.5 sm:px-2 py-1 rounded">
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs sm:text-sm font-medium">{post.comments_count}</span>
        </Link>
        <button
          className={`flex items-center gap-1 sm:gap-1.5 lg:gap-2 transition-colors touch-manipulation min-h-[40px] sm:min-h-[44px] px-1.5 sm:px-2 py-1 rounded ${
            isSaved ? 'text-primary' : 'text-muted-foreground hover:text-primary'
          }`}
          onClick={toggleSave}
          disabled={saveLoading}
        >
          {saveLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          )}
          <span className="text-xs sm:text-sm font-medium hidden xs:inline">{isSaved ? 'Saved' : 'Save'}</span>
          <span className="text-xs sm:text-sm font-medium xs:hidden">{isSaved ? '✓' : 'Save'}</span>
        </button>
        <ShareButton post={post} />
        {user && post.user_id === user.id && (
          <button
            className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 text-muted-foreground hover:text-red-500 transition-colors touch-manipulation min-h-[40px] sm:min-h-[44px] px-1.5 sm:px-2 py-1 rounded"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">Delete</span>
          </button>
        )}
      </div>
      <Button variant="ghost" size="sm" className="touch-manipulation min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm self-start sm:self-center">
        Read More
      </Button>
    </div>
  );
};

const samplePosts: CommunityPost[] = [
  {
    id: 'sample-1',
    title: 'Finding Peace in Daily Chaos',
    content: 'In our fast-paced world, finding moments of peace can seem impossible. But the ancient wisdom teaches us that peace is not found in the absence of chaos, but in our response to it. How do you cultivate inner peace amidst daily challenges?',
    post_type: 'reflection',
    tags: ['peace', 'mindfulness', 'daily_life'],
    likes_count: 12,
    comments_count: 8,
    created_at: new Date().toISOString(),
    user_id: 'sample-user',
    profiles: {
      display_name: 'Maya Patel',
      avatar_url: null
    }
  },
  {
    id: 'sample-2',
    title: 'The Power of Gratitude Practice',
    content: 'Starting my day with gratitude has transformed my perspective completely. Even on difficult days, I can find at least three things to be grateful for. This ancient practice of counting blessings has modern scientific backing too.',
    post_type: 'experience',
    tags: ['gratitude', 'practice', 'transformation'],
    likes_count: 24,
    comments_count: 15,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    user_id: 'sample-user-2',
    profiles: {
      display_name: 'Raj Kumar',
      avatar_url: null
    }
  },
  {
    id: 'sample-3',
    title: 'Understanding Karma in Modern Life',
    content: 'How do we apply the ancient concept of karma to our contemporary decision-making? Karma is not about punishment or reward, but about understanding the ripple effects of our actions.',
    post_type: 'thought',
    tags: ['karma', 'action', 'awareness'],
    likes_count: 31,
    comments_count: 22,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    user_id: 'sample-user-3',
    profiles: {
      display_name: 'Dr. Sarah Chen',
      avatar_url: null
    }
  }
];

export default function CommunityFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>(samplePosts);
  const [stats, setStats] = useState({ members: 156, posts: 3, engagement: 267 });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [postCount, setPostCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPosts = useCallback(async () => {
    try {
      // Direct database query to get posts
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles!fk_community_posts_user_id (
            display_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Database error:', error.message);
        // Fall back to sample data
        setPosts(samplePosts);
        return;
      }

      if (data && data.length > 0) {
        // Show real posts from database
        setPosts(data);
        setPostCount(data.length);
      } else {
        // No posts in database, show sample posts
        setPosts(samplePosts);
        setPostCount(samplePosts.length);
      }
    } catch (error) {
      console.error('Network error:', error);
      // Fall back to sample data
      setPosts(samplePosts);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [postsResponse, profilesResponse] = await Promise.all([
        supabase.from('community_posts').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
      ]);

      const postCount = postsResponse.count || 0;
      const memberCount = profilesResponse.count || 0;

      setStats({
        members: memberCount,
        posts: postCount,
        engagement: postCount * 5
      });
    } catch (error) {
      console.error('Stats error:', error);
      // Set default stats
      setStats({ members: 156, posts: 3, engagement: 267 });
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPosts(), fetchStats()]);
    setLoading(false);
  }, [fetchPosts, fetchStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Community feed has been updated.",
    });
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for post creation events
  useEffect(() => {
    const handlePostCreated = () => {
      fetchPosts(); // Refresh posts when a new post is created
    };

    window.addEventListener('postCreated', handlePostCreated);

    return () => {
      window.removeEventListener('postCreated', handlePostCreated);
    };
  }, [fetchPosts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading community wisdom...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 border border-orange-100">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 lg:mb-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-orange-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Rss className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Community Feed
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">Discover and share spiritual wisdom</p>
              </div>
            </div>
            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
              {/* Search and Filter Controls */}
              <div className="flex gap-2 w-full xs:w-auto">
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 xs:flex-initial px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent min-w-0"
                />
                <Button variant="outline" size="sm" className="gap-1 flex-shrink-0">
                  <Filter className="w-4 h-4" />
                  <span className="hidden xs:inline">Filter</span>
                </Button>
              </div>
              <div className="flex xs:flex-row gap-2 w-full xs:w-auto">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base flex-1 xs:flex-initial"
                  size="sm"
                >
                  <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden xs:inline">Refresh</span>
                </Button>
                <Link to="/create-post" className="flex-1 xs:flex-initial">
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white shadow-lg gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base" size="sm">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Share Wisdom</span>
                    <span className="xs:hidden">Post</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-3 sm:p-4 md:p-6 text-center">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-600 mx-auto mb-1 sm:mb-2 md:mb-3" />
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-700">{stats.members}</div>
              <div className="text-xs sm:text-sm text-blue-600 font-medium">Community Members</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-3 sm:p-4 md:p-6 text-center">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-green-600 mx-auto mb-1 sm:mb-2 md:mb-3" />
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-700">{postCount}</div>
              <div className="text-xs sm:text-sm text-green-600 font-medium">Wisdom Posts</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 xs:col-span-2 md:col-span-1">
            <CardContent className="p-3 sm:p-4 md:p-6 text-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-purple-600 mx-auto mb-1 sm:mb-2 md:mb-3" />
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-700">{stats.engagement}</div>
              <div className="text-xs sm:text-sm text-purple-600 font-medium">Engagement Score</div>
            </CardContent>
          </Card>
        </div>

        {/* Posts */}
        <div className="space-y-4 sm:space-y-6">
          {posts.filter(post =>
            searchQuery === "" ||
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (post.tags && post.tags.some((tag: string) => tag && tag.toLowerCase().includes(searchQuery.toLowerCase())))
          ).map((post) => (
            <Card key={post.id} className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-orange-400">
              <CardContent className="p-3 sm:p-4 md:p-6 lg:p-8">
                <div className="flex flex-col xs:flex-row items-start gap-2 sm:gap-3 md:gap-4">
                  <Avatar className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 ring-2 ring-orange-200 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-orange-400 to-purple-600 text-white font-bold text-sm sm:text-base md:text-lg">
                      {post.profiles?.display_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-col xs:flex-row xs:items-center gap-1 sm:gap-2 md:gap-3 mb-2 sm:mb-3">
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 break-words">{post.title}</h2>
                      <Badge className={`${getPostTypeColor(post.post_type)} font-semibold px-1.5 sm:px-2 md:px-3 py-0.5 text-xs sm:text-sm`}>
                        {post.post_type}
                      </Badge>
                    </div>

                    <div className="flex flex-col xs:flex-row xs:items-center gap-0.5 sm:gap-1 md:gap-2 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                      <span className="font-medium">by {post.profiles?.display_name || "Anonymous"}</span>
                      <span className="hidden xs:inline">•</span>
                      <span>{new Date(post.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}</span>
                    </div>

                    <p className="text-gray-700 leading-relaxed mb-3 sm:mb-4 md:mb-6 text-sm sm:text-base md:text-lg break-words">
                      {post.content}
                    </p>

                    <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 mb-3 sm:mb-4 md:mb-6">
                      {post.tags && post.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-orange-700 border-orange-300 bg-orange-50 text-xs sm:text-sm">
                          #{tag}
                        </Badge>
                      ))}
                    </div>

                    <PostInteractions post={post} onDelete={() => {
                      setPosts(prev => prev.filter(p => p.id !== post.id));
                      fetchPosts();
                    }} />

                    {/* Comments Section */}
                    <CommentsSection
                      postId={post.id}
                      initialCommentsCount={post.comments_count}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-6 sm:mt-8 md:mt-12">
          <Button variant="outline" size="lg" className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 text-sm sm:text-base md:text-lg touch-manipulation min-h-[40px] sm:min-h-[44px]">
            Load More Wisdom
          </Button>
        </div>

        {/* Empty State (fallback) */}
        {posts.filter(post =>
          searchQuery === "" ||
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (post.tags && post.tags.some((tag: string) => tag && tag.toLowerCase().includes(searchQuery.toLowerCase())))
        ).length === 0 && (
          <div className="text-center py-8 sm:py-12 md:py-20">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-orange-200 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6">
              <Search className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-orange-600" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3">
              {searchQuery ? "No posts found" : "No posts yet"}
            </h3>
            <p className="text-gray-600 mb-4 sm:mb-6 md:mb-8 max-w-md mx-auto text-xs sm:text-sm md:text-base px-2 sm:px-4">
              {searchQuery
                ? "Try adjusting your search terms or filters."
                : "Be the first to share your wisdom and inspire others on their spiritual journey."
              }
            </p>
            {searchQuery ? (
              <Button
                onClick={() => setSearchQuery("")}
                className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 text-sm sm:text-base md:text-lg gap-1 sm:gap-2 touch-manipulation min-h-[40px] sm:min-h-[44px]"
              >
                Clear Search
              </Button>
            ) : (
              <Link to="/create-post">
                <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 text-sm sm:text-base md:text-lg gap-1 sm:gap-2 touch-manipulation min-h-[40px] sm:min-h-[44px]">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  Create First Post
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}