import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Search, Eye, BookOpenCheck, Volume2, ChevronRight, ChevronDown, Filter, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCredits } from "@/hooks/useCredits";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SacredText {
  id: string;
  title: string;
  source: string;
  chapter: string;
  content: string;
  category: string;
  tags: string[];
  reads_count: number;
  audio_url?: string;
  book_title?: string;
}

// Hierarchical structure
interface Book {
  title: string;
  category: string;
  chapters: Chapter[];
}

interface Chapter {
  title: string;
  verses: SacredText[];
}

const categories = [
  { value: "bhagavad_gita", label: "Bhagavad Gita", color: "bg-wisdom/10 text-wisdom" },
  { value: "vedas", label: "Vedas", color: "bg-peace/10 text-peace" },
  { value: "puranas", label: "Puranas", color: "bg-community/10 text-community" },
  { value: "psychology", label: "Psychology Literature", color: "bg-growth/10 text-growth" },
  { value: "upanishads", label: "Upanishads", color: "bg-purple-100 text-purple-700" },
  { value: "yoga_sutras", label: "Yoga Sutras", color: "bg-orange-100 text-orange-700" }
];

const sourceColors = {
  bhagavad_gita: "bg-wisdom/10 text-wisdom",
  psychology: "bg-growth/10 text-growth",
  vedas: "bg-peace/10 text-peace",
  puranas: "bg-community/10 text-community",
  upanishads: "bg-purple-100 text-purple-700",
  yoga_sutras: "bg-orange-100 text-orange-700"
};

export default function SacredTexts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [sacredTexts, setSacredTexts] = useState<SacredText[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedText, setSelectedText] = useState<SacredText | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeView, setActiveView] = useState<'books' | 'search'>('books');
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());
  const [allTags, setAllTags] = useState<string[]>([]);
  const { toast } = useToast();
  const { addCredits } = useCredits();

  const fetchSacredTexts = async () => {
    try {
      const { data, error } = await supabase
        .from('sacred_texts')
        .select('*')
        .order('category', { ascending: true })
        .order('source', { ascending: true });

      if (error) throw error;

      const texts = data || [];
      setSacredTexts(texts);

      // Extract all unique tags
      const tags = Array.from(new Set(texts.flatMap(text => text.tags)));
      setAllTags(tags);

      // Organize into hierarchical structure
      organizeTextsIntoBooks(texts);
    } catch (error: any) {
      console.error('Error fetching sacred texts:', error);
      toast({
        title: "Failed to load texts",
        description: "Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const organizeTextsIntoBooks = (texts: SacredText[]) => {
    const bookMap = new Map<string, Book>();

    texts.forEach(text => {
      const bookKey = `${text.category}_${text.source}`;
      const bookTitle = text.source || text.category;

      if (!bookMap.has(bookKey)) {
        bookMap.set(bookKey, {
          title: bookTitle,
          category: text.category,
          chapters: []
        });
      }

      const book = bookMap.get(bookKey)!;
      const chapterTitle = text.chapter || 'General';

      let chapter = book.chapters.find(ch => ch.title === chapterTitle);
      if (!chapter) {
        chapter = { title: chapterTitle, verses: [] };
        book.chapters.push(chapter);
      }

      chapter.verses.push(text);
    });

    setBooks(Array.from(bookMap.values()));
  };

  useEffect(() => {
    fetchSacredTexts();
  }, []);

  const handleReadText = async (text: SacredText) => {
    setSelectedText(text);
    setIsDialogOpen(true);

    // Award credits for reading
    await addCredits(5, `Read: ${text.title}`);
  };

  const toggleBookExpansion = (bookTitle: string) => {
    setExpandedBooks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookTitle)) {
        newSet.delete(bookTitle);
      } else {
        newSet.add(bookTitle);
      }
      return newSet;
    });
  };

  const filteredTexts = sacredTexts.filter(text => {
    const matchesSearch = !searchQuery ||
      text.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      text.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      text.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || text.category === selectedCategory;
    const matchesTag = selectedTag === "all" || text.tags.includes(selectedTag);

    return matchesSearch && matchesCategory && matchesTag;
  });

  const getCategoryColor = (category: string) => {
    return categories.find(cat => cat.value === category)?.color || "bg-gray-100 text-gray-700";
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedTag("all");
  };

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-community" />
              <h1 className="text-2xl md:text-3xl font-bold">Sacred Texts & Wisdom</h1>
            </div>
          </div>
          <p className="text-sm md:text-lg text-muted-foreground">
            Explore ancient wisdom and modern insights for your spiritual journey
          </p>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Navigation Tabs */}
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'books' | 'search')} className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="books" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Library
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </TabsTrigger>
          </TabsList>

          {/* Books View */}
          <TabsContent value="books" className="mt-6">
            <div className="space-y-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : books.length > 0 ? (
                books.map((book) => (
                  <Card key={`${book.category}_${book.title}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Collapsible
                            open={expandedBooks.has(book.title)}
                            onOpenChange={() => toggleBookExpansion(book.title)}
                          >
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="p-0 h-auto">
                                {expandedBooks.has(book.title) ? (
                                  <ChevronDown className="w-5 h-5" />
                                ) : (
                                  <ChevronRight className="w-5 h-5" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </Collapsible>
                          <div>
                            <CardTitle className="text-xl">{book.title}</CardTitle>
                            <Badge className={getCategoryColor(book.category)}>
                              {categories.find(cat => cat.value === book.category)?.label || book.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {book.chapters.length} chapters
                        </div>
                      </div>
                    </CardHeader>

                    <Collapsible open={expandedBooks.has(book.title)}>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            {book.chapters.map((chapter) => (
                              <div key={chapter.title} className="border-l-2 border-muted pl-4">
                                <h4 className="font-semibold text-lg mb-3">{chapter.title}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {chapter.verses.map((verse) => (
                                    <Card key={verse.id} className="hover:shadow-md transition-shadow">
                                      <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                          <h5 className="font-medium text-sm">{verse.title}</h5>
                                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Eye className="w-3 h-3" />
                                            {verse.reads_count}
                                          </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                                          {verse.content}
                                        </p>
                                        <div className="flex items-center justify-between">
                                          <div className="flex flex-wrap gap-1">
                                            {verse.tags.slice(0, 2).map((tag) => (
                                              <Badge key={tag} variant="secondary" className="text-xs">
                                                {tag}
                                              </Badge>
                                            ))}
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleReadText(verse)}
                                          >
                                            <BookOpenCheck className="w-3 h-3 mr-1" />
                                            Read
                                          </Button>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No texts found</h3>
                  <p className="text-muted-foreground">Texts will appear here once added.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Search View */}
          <TabsContent value="search" className="mt-6">
            {/* Search and Filters */}
            <div className="space-y-4 mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search verses, topics, or concepts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {allTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters */}
              {(searchQuery || selectedCategory !== "all" || selectedTag !== "all") && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Filters:</span>
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1">
                      Search: "{searchQuery}"
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setSearchQuery("")}
                      />
                    </Badge>
                  )}
                  {selectedCategory !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {categories.find(cat => cat.value === selectedCategory)?.label}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setSelectedCategory("all")}
                      />
                    </Badge>
                  )}
                  {selectedTag !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {selectedTag}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => setSelectedTag("all")}
                      />
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                </div>
              )}

              {/* Results Count and Credits Info */}
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">
                  {filteredTexts.length} texts found
                </p>
                <div className="text-sm text-community font-medium">
                  +5 credits per reading
                </div>
              </div>
            </div>

            {/* Search Results */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                      <div className="h-16 bg-gray-200 rounded mb-4"></div>
                      <div className="flex gap-2 mb-4">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTexts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTexts.map((text) => (
                  <Card key={text.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-start justify-between mb-3">
                        <Badge className={sourceColors[text.category as keyof typeof sourceColors] || "bg-gray-100 text-gray-700"}>
                          {categories.find(cat => cat.value === text.category)?.label || text.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Eye className="w-4 h-4" />
                          {text.reads_count}
                        </div>
                      </div>

                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                        {text.title}
                      </h3>

                      <p className="text-sm text-muted-foreground mb-3">
                        {text.source} - {text.chapter}
                      </p>

                      <p className="text-foreground text-sm leading-relaxed mb-4 line-clamp-3">
                        {text.content}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {text.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <Button
                        onClick={() => handleReadText(text)}
                        className="w-full group-hover:bg-primary/90 transition-colors"
                      >
                        <BookOpenCheck className="w-4 h-4 mr-2" />
                        Read Text
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No texts found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or filters
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Reading Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl">{selectedText?.title}</DialogTitle>
            <DialogDescription className="text-sm md:text-base">
              {selectedText?.source} - {selectedText?.chapter}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Content */}
            <div className="bg-muted/50 p-4 md:p-6 rounded-lg">
              <p className="text-base leading-relaxed whitespace-pre-wrap">
                {selectedText?.content}
              </p>
            </div>

            {/* Audio Player */}
            {selectedText?.audio_url && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Volume2 className="w-4 h-4 text-primary" />
                  <span className="font-medium">Audio Recitation</span>
                </div>
                <AudioPlayer
                  src={selectedText.audio_url}
                  title={`${selectedText.title} - ${selectedText.source}`}
                />
              </div>
            )}

            {/* Tags */}
            <div>
              <h4 className="font-medium mb-3">Related Concepts</h4>
              <div className="flex flex-wrap gap-2">
                {selectedText?.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="text-sm text-muted-foreground border-t pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="font-medium">Category:</span>
                  <p>{categories.find(cat => cat.value === selectedText?.category)?.label}</p>
                </div>
                <div>
                  <span className="font-medium">Source:</span>
                  <p>{selectedText?.source}</p>
                </div>
                <div>
                  <span className="font-medium">Chapter:</span>
                  <p>{selectedText?.chapter}</p>
                </div>
                <div>
                  <span className="font-medium">Reads:</span>
                  <p>{selectedText?.reads_count}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}