import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import heroImage from "@/assets/hero-spiritual.jpg";
import { useNavigate } from "react-router-dom";
import { 
  Trophy, 
  Calendar,
  BookOpen,
  Heart,
  MessageCircle,
  TrendingUp,
  Sparkles,
  ArrowRight,
  BookMarked,
  Search,
  PenTool
} from "lucide-react";

const dailyVerse = {
  text: "The mind is indeed difficult to control and is restless. But by practice and detachment it can be controlled.",
  source: "Bhagavad Gita - Chapter 6, Verse 35"
};

const communityPosts = [
  {
    id: 1,
    title: "The Psychology of Karma: Actions and Mental Health",
    author: "psych_scholar",
    avatar: "P",
    timeAgo: "Sep 11, 2025",
    type: "Thought",
    excerpt: "As someone who studies both psychology and Hindu philosophy, I'm fascinated by how the concept of karma aligns with what we know about behavioral psychology...",
    tags: ["karma", "psychology", "mental_health"],
    likes: 2,
    color: "bg-orange-100 text-orange-700"
  },
  {
    id: 2,
    title: "My Journey from Anxiety to Acceptance",
    author: "anxious_no_more",
    avatar: "A",
    timeAgo: "Sep 11, 2025",
    type: "Experience",
    excerpt: "Three years ago, I was crippled by anxiety about the future. Every decision felt overwhelming because I was so attached to controlling outcomes...",
    tags: ["anxiety", "surrender", "acceptance"],
    likes: 3,
    color: "bg-blue-100 text-blue-700"
  },
  {
    id: 3,
    title: "Daily Verse: On Finding Inner Peace",
    author: "morning_wisdom",
    avatar: "M",
    timeAgo: "Sep 11, 2025",
    type: "Verse",
    excerpt: "You have a right to perform your prescribed duty, but never to the fruits of action. Never consider yourself the cause of the results...",
    tags: ["daily_verse", "peace", "karma"],
    likes: 2,
    color: "bg-purple-100 text-purple-700"
  }
];

const popularTexts = [
  { title: "On Controlling the Mind", source: "bhagavad gita", reads: 235 },
  { title: "Managing Anxiety Through Breath", source: "psychology", reads: 201 },
  { title: "The Power of Focused Action", source: "bhagavad gita", reads: 189 },
  { title: "The Nature of Reality", source: "bhagavad gita", reads: 157 }
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="h-full overflow-auto">
      {/* Hero Section */}
      <div
        className="relative bg-gradient-hero p-4 md:p-8 text-white overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(234, 88, 12, 0.85) 0%, rgba(251, 146, 60, 0.85) 100%), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay'
        }}
      >
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-2xl md:text-4xl font-bold mb-4">
            Welcome to Deep, mr.mandeeprana52
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-6">
            Your journey into ancient wisdom and modern understanding
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span>0 Credits</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>0 Day Streak</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Verse of the Day */}
            <Card className="bg-verse border-wisdom border">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-wisdom/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-wisdom" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg md:text-xl font-semibold text-wisdom mb-3">
                      📖 Verse of the Day
                    </h2>
                    <blockquote className="text-base md:text-lg italic text-text-wisdom mb-4">
                      "{dailyVerse.text}"
                    </blockquote>
                    <p className="text-sm md:text-base text-text-wisdom font-medium">
                      {dailyVerse.source}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Community Wisdom */}
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-community" />
                  Community Wisdom
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/community')}
                  className="w-full sm:w-auto"
                >
                  View All Posts
                </Button>
              </div>

              <div className="space-y-4">
                {communityPosts.map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-hero text-white">
                            {post.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{post.title}</h3>
                            <Badge className={post.color}>{post.type}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <span>by {post.author}</span>
                            <span>•</span>
                            <span>{post.timeAgo}</span>
                          </div>
                          <p className="text-foreground mb-4 line-clamp-2">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                              {post.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-4">
                              <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                                <Heart className="w-4 h-4" />
                                <span className="text-sm">{post.likes}</span>
                              </button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate('/community')}
                              >
                                Read More
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Popular Texts */}
            <Card>
              <CardContent className="p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-growth" />
                  Popular Texts
                </h3>
                <div className="space-y-4">
                  {popularTexts.map((text, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => navigate('/sacred-texts')}
                    >
                      <div className="w-8 h-8 bg-wisdom/10 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-wisdom" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm mb-1">{text.title}</h4>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">{text.source}</Badge>
                          <span className="text-xs text-muted-foreground">{text.reads} reads</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => navigate('/sacred-texts')}
                >
                  Explore All Texts
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-peace" />
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-gradient-hero hover:opacity-90"
                    onClick={() => navigate('/create-post')}
                  >
                    <PenTool className="w-4 h-4 mr-2" />
                    Share Your Wisdom
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/search')}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Seek Guidance
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/sacred-texts')}
                  >
                    <BookMarked className="w-4 h-4 mr-2" />
                    Reading Books
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/my-notes')}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    My Journal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}