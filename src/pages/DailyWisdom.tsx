import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, BookOpen, RefreshCw } from "lucide-react";
import { useState } from "react";

const wisdomQuotes = [
  {
    id: 1,
    text: "The mind is indeed difficult to control and is restless. But by practice and detachment it can be controlled.",
    source: "Bhagavad Gita - Chapter 6, Verse 35",
    category: "Mind Control",
    likes: 45,
    color: "bg-orange-100 text-orange-700"
  },
  {
    id: 2,
    text: "You have a right to perform your prescribed duty, but never to the fruits of action. Never consider yourself the cause of the results...",
    source: "Bhagavad Gita - Chapter 2, Verse 47",
    category: "Karma",
    likes: 52,
    color: "bg-blue-100 text-blue-700"
  },
  {
    id: 3,
    text: "Peace comes from within. Do not seek it without.",
    source: "Buddha",
    category: "Peace",
    likes: 38,
    color: "bg-green-100 text-green-700"
  },
  {
    id: 4,
    text: "The only way to do great work is to love what you do.",
    source: "Steve Jobs",
    category: "Purpose",
    likes: 67,
    color: "bg-purple-100 text-purple-700"
  },
  {
    id: 5,
    text: "Change is the law of life. And those who look only to the past or present are certain to miss the future.",
    source: "John F. Kennedy",
    category: "Change",
    likes: 41,
    color: "bg-yellow-100 text-yellow-700"
  }
];

export default function DailyWisdom() {
  const [likedQuotes, setLikedQuotes] = useState<Set<number>>(new Set());

  const toggleLike = (id: number) => {
    setLikedQuotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const refreshQuotes = () => {
    // In a real app, this could fetch new quotes from an API
    console.log("Refreshing quotes...");
  };

  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-wisdom mb-4">Daily Wisdom</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Inspirational quotes from ancient and modern wisdom traditions
          </p>
          <Button variant="outline" onClick={refreshQuotes}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Wisdom
          </Button>
        </div>

        {/* Quotes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wisdomQuotes.map((quote) => (
            <Card key={quote.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 bg-wisdom/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-wisdom" />
                  </div>
                  <Badge className={quote.color}>{quote.category}</Badge>
                </div>
                <blockquote className="text-lg italic text-foreground mb-4">
                  "{quote.text}"
                </blockquote>
                <p className="text-sm font-medium text-wisdom mb-4">
                  {quote.source}
                </p>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleLike(quote.id)}
                    className={`flex items-center gap-2 transition-colors ${
                      likedQuotes.has(quote.id)
                        ? 'text-red-500'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${likedQuotes.has(quote.id) ? 'fill-current' : ''}`} />
                    <span className="text-sm">
                      {quote.likes + (likedQuotes.has(quote.id) ? 1 : 0)}
                    </span>
                  </button>
                  <Button variant="ghost" size="sm">
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Card className="bg-gradient-hero text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Start Your Wisdom Journey</h2>
              <p className="text-lg opacity-90 mb-6">
                Explore sacred texts and join our community of seekers
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="secondary" className="bg-white text-gradient-hero">
                  Explore Sacred Texts
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-gradient-hero">
                  Join Community
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}