import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Bot, Filter, Sparkles, Loader2, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCredits } from "@/hooks/useCredits";

const topicTags = [
  "stress", "anxiety", "depression", "love", "life", "loss", "grief", 
  "mental health", "relationships", "purpose", "karma", "dharma",
  "meditation", "wisdom", "peace", "happiness"
];

const popularQuestions = [
  "How to overcome anxiety?",
  "Finding life purpose", 
  "Dealing with loss",
  "Managing stress",
  "Building resilience"
];

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState("all");
  const [aiQuery, setAiQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [aiResponse, setAiResponse] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [currentSpeech, setCurrentSpeech] = useState<SpeechSynthesisUtterance | null>(null);
  const [readingTextId, setReadingTextId] = useState<string | null>(null);
  const { toast } = useToast();
  const { deductCredits, credits } = useCredits();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      let query = supabase.from('sacred_texts').select('*');
      
      if (selectedSource === 'sacred_texts' || selectedSource === 'all') {
        query = query.textSearch('title,content,source', searchQuery);
      }
      
      const { data, error } = await query.limit(20);
      
      if (error) throw error;
      setSearchResults(data || []);
      
      if (data?.length === 0) {
        toast({
          title: "No results found",
          description: "Try different keywords or search terms.",
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return;
    
    // Check and deduct credits (2 credits per AI query)
    const canProceed = await deductCredits(2, "AI Spiritual Guidance");
    if (!canProceed) return;
    
    setIsAiLoading(true);
    setAiResponse("");
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-guidance', {
        body: { query: aiQuery }
      });
      
      if (error) throw error;
      
      if (data?.guidance) {
        setAiResponse(data.guidance);
      } else {
        throw new Error('No guidance received');
      }
    } catch (error: any) {
      console.error('AI query error:', error);
      toast({
        title: "AI guidance failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleReadText = (text: string, textId?: string) => {
    if ('speechSynthesis' in window) {
      // If already reading this specific text, stop it
      if (isReading && readingTextId === textId) {
        window.speechSynthesis.cancel();
        setIsReading(false);
        setCurrentSpeech(null);
        setReadingTextId(null);
        return;
      }
      
      // If reading something else, stop it first
      if (isReading && currentSpeech) {
        window.speechSynthesis.cancel();
      }
      
      // Start reading the new text
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => {
        setIsReading(true);
        setReadingTextId(textId || null);
      };
      
      utterance.onend = () => {
        setIsReading(false);
        setCurrentSpeech(null);
        setReadingTextId(null);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsReading(false);
        setCurrentSpeech(null);
        setReadingTextId(null);
        toast({
          title: "Speech Error",
          description: "Unable to read text aloud. Please try again.",
          variant: "destructive",
        });
      };

      setCurrentSpeech(utterance);
      window.speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Not Supported",
        description: "Text-to-speech is not supported in this browser",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="bg-card border-b border-border p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Search className="w-8 h-8 text-peace" />
            <h1 className="text-3xl font-bold">Seek Wisdom & Guidance</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Search through sacred texts, community wisdom, or ask our AI counselor
          </p>
        </div>
      </div>

      <div className="p-8 max-w-4xl mx-auto">
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-8">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search Knowledge
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              AI Guidance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-8">
            {/* Search Interface */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Search for wisdom, guidance, or specific topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 text-lg h-12"
                    />
                    <Button 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-peace hover:bg-peace/90"
                      onClick={handleSearch}
                      disabled={isSearching || !searchQuery.trim()}
                    >
                      {isSearching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
                    <Select value={selectedSource} onValueChange={setSelectedSource}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Sources" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="sacred_texts">Sacred Texts</SelectItem>
                        <SelectItem value="community">Community Posts</SelectItem>
                        <SelectItem value="psychology">Psychology</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline" className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Filter by topics:
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Topic Tags */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Popular Topics</h3>
              <div className="flex flex-wrap gap-2">
                {topicTags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => setSearchQuery(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Search Results</h3>
                <div className="space-y-4">
                  {searchResults.map((result) => (
                    <Card key={result.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-lg">{result.title}</h4>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReadText(`${result.title}. ${result.content}`, result.id)}
                              className="text-muted-foreground hover:text-primary"
                            >
                              {isReading && readingTextId === result.id ? (
                                <VolumeX className="w-4 h-4" />
                              ) : (
                                <Volume2 className="w-4 h-4" />
                              )}
                            </Button>
                            <Badge variant="outline">{result.source}</Badge>
                          </div>
                        </div>
                        {result.chapter && (
                          <p className="text-sm text-muted-foreground mb-2">
                            Chapter: {result.chapter}
                          </p>
                        )}
                        <p className="text-foreground leading-relaxed">
                          {result.content.length > 300 
                            ? `${result.content.substring(0, 300)}...` 
                            : result.content}
                        </p>
                        {result.tags && result.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {result.tags.map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai" className="space-y-8">
            {/* AI Counselor Interface */}
            <Card className="bg-gradient-to-br from-peace/5 to-wisdom/5 border-peace/20">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-peace to-wisdom rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-peace" />
                  AI Spiritual Counselor
                </h2>
                <p className="text-muted-foreground mb-4">
                  Ask for personalized guidance combining ancient wisdom with modern psychology
                </p>
                <div className="text-sm text-amber-600 dark:text-amber-400 mb-6">
                  Cost: 2 credits per query | Your credits: {credits}
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      placeholder="Ask for guidance... (e.g., 'How to deal with anxiety?' or 'Finding life purpose')"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      className="text-lg h-12 pr-12"
                    />
                    <Button 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-peace to-wisdom hover:opacity-90"
                      disabled={!aiQuery.trim() || isAiLoading}
                      onClick={handleAiQuery}
                    >
                      {isAiLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Popular Questions */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Popular questions:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {popularQuestions.map((question) => (
                  <Button
                    key={question}
                    variant="outline"
                    className="justify-start h-auto p-4 text-left hover:bg-primary/10 hover:border-primary transition-all duration-200"
                    onClick={() => {
                      setAiQuery(question);
                      toast({
                        title: "Question selected",
                        description: "Click the guidance button to get your answer",
                      });
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-peace flex-shrink-0" />
                      <span>{question}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* AI Response */}
            {aiResponse && (
              <Card className="bg-gradient-to-br from-peace/5 to-wisdom/5 border-peace/20">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-peace" />
                      AI Spiritual Guidance
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReadText(aiResponse, 'ai-response')}
                      className="text-muted-foreground hover:text-primary"
                    >
                      {isReading && readingTextId === 'ai-response' ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                      <span className="ml-2 hidden sm:inline">
                        {isReading && readingTextId === 'ai-response' ? 'Stop Reading' : 'Read Aloud'}
                      </span>
                    </Button>
                  </div>
                  <div className="prose prose-sm max-w-none text-foreground">
                    {aiResponse.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-3 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Guidance Disclaimer */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground text-center">
                  Our AI counselor draws from sacred texts and psychological research to provide guidance. 
                  For serious mental health concerns, please consult with a qualified professional.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}