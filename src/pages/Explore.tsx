import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Heart,
  MessageCircle,
  Bookmark,
  TrendingUp,
  Search,
  Filter,
  Grid3X3,
  List
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const trendingPosts = [
  {
    id: 1,
    user: { id: "1", username: "spiritual_guide", display_name: "Spiritual Guide", avatar: "SG" },
    media: ["/placeholder.svg"],
    caption: "Finding peace in the chaos of daily life...",
    likes: 234,
    comments: 45,
    timestamp: "2h ago",
    tags: ["mindfulness", "peace", "meditation"]
  },
  {
    id: 2,
    user: { id: "2", username: "ancient_wisdom", display_name: "Ancient Wisdom", avatar: "AW" },
    media: ["/placeholder.svg"],
    caption: "The Bhagavad Gita teaches us that...",
    likes: 189,
    comments: 32,
    timestamp: "4h ago",
    tags: ["bhagavad_gita", "wisdom", "philosophy"]
  },
  {
    id: 3,
    user: { id: "3", username: "mindful_moments", display_name: "Mindful Moments", avatar: "MM" },
    media: ["/placeholder.svg"],
    caption: "Today's meditation practice: breath awareness",
    likes: 156,
    comments: 28,
    timestamp: "6h ago",
    tags: ["meditation", "breathwork", "mindfulness"]
  }
];

const popularUsers = [
  { id: "1", username: "spiritual_guide", display_name: "Spiritual Guide", avatar: "SG", followers: 1250, isFollowing: false },
  { id: "2", username: "ancient_wisdom", display_name: "Ancient Wisdom", avatar: "AW", followers: 890, isFollowing: true },
  { id: "3", username: "mindful_moments", display_name: "Mindful Moments", avatar: "MM", followers: 654, isFollowing: false }
];

export default function Explore() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = useState<'all' | 'posts' | 'users' | 'tags'>('all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-center mb-6">Explore</h1>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search posts, users, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </form>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('all')}
            >
              All
            </Button>
            <Button
              variant={activeFilter === 'posts' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('posts')}
            >
              Posts
            </Button>
            <Button
              variant={activeFilter === 'users' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('users')}
            >
              Users
            </Button>
            <Button
              variant={activeFilter === 'tags' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('tags')}
            >
              Tags
            </Button>
          </div>

          {/* View Toggle */}
          <div className="flex justify-end mb-4">
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className={viewMode === 'grid' ? 'lg:col-span-3' : 'lg:col-span-4'}>
              {/* Trending Posts */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-growth" />
                  <h2 className="text-xl font-semibold">Trending Now</h2>
                </div>

                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {trendingPosts.map((post) => (
                      <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <div className="aspect-square bg-muted relative">
                          <img
                            src={post.media[0]}
                            alt="Post"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="flex items-center gap-4 text-white">
                              <div className="flex items-center gap-1">
                                <Heart className="w-5 h-5" />
                                <span>{post.likes}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="w-5 h-5" />
                                <span>{post.comments}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-gradient-hero text-white text-xs">
                                {post.user.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{post.user.display_name}</p>
                              <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Bookmark className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-sm mb-3 line-clamp-2">{post.caption}</p>
                          <div className="flex flex-wrap gap-1">
                            {post.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {trendingPosts.map((post) => (
                      <Card key={post.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <img
                              src={post.media[0]}
                              alt="Post"
                              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-gradient-hero text-white text-xs">
                                    {post.user.avatar}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold text-sm">{post.user.display_name}</p>
                                  <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                                </div>
                              </div>
                              <p className="text-sm mb-2">{post.caption}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{post.likes} likes</span>
                                <span>{post.comments} comments</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Bookmark className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            {viewMode === 'grid' && (
              <div className="space-y-6">
                {/* Popular Users */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Popular Users</h3>
                    <div className="space-y-4">
                      {popularUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 cursor-pointer" onClick={() => navigate(`/profile/${user.id}`)}>
                            <AvatarFallback className="bg-gradient-hero text-white">
                              {user.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate cursor-pointer hover:underline"
                               onClick={() => navigate(`/profile/${user.id}`)}>
                              {user.display_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.followers} followers</p>
                          </div>
                          <Button
                            variant={user.isFollowing ? "outline" : "default"}
                            size="sm"
                            className={user.isFollowing ? "" : "bg-gradient-hero hover:opacity-90"}
                          >
                            {user.isFollowing ? "Following" : "Follow"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Popular Tags */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Popular Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {["mindfulness", "meditation", "bhagavad_gita", "peace", "wisdom", "spirituality"].map((tag) => (
                        <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-accent">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}