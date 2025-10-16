import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Notebook,
  Plus,
  Search,
  Calendar,
  BookOpen,
  Heart,
  Lightbulb,
  Star,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNotes } from "@/hooks/useNotes";

interface PersonalNote {
  id: string;
  title: string;
  content: string;
  note_type: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
}

const noteTypeColors = {
  reflection: "bg-wisdom/10 text-wisdom",
  insight: "bg-peace/10 text-peace",
  study: "bg-growth/10 text-growth",
  practice: "bg-community/10 text-community"
};

const noteTypeIcons = {
  reflection: Lightbulb,
  insight: Star,
  study: BookOpen,
  practice: Heart
};

export default function MyNotes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    tags: "",
    note_type: "reflection"
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const { deleteNote } = useNotes();

  const fetchNotes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('personal_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      toast({
        title: "Failed to load notes",
        description: "Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!user || !newNote.title.trim() || !newNote.content.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in title and content.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const tagsArray = newNote.tags.split(',').map(tag => tag.trim()).filter(Boolean);

      const { error } = await supabase
        .from('personal_notes')
        .insert({
          user_id: user.id,
          title: newNote.title.trim(),
          content: newNote.content.trim(),
          note_type: newNote.note_type,
          tags: tagsArray,
        });

      if (error) throw error;

      toast({
        title: "Note saved!",
        description: "Your note has been saved successfully.",
      });

      setNewNote({ title: "", content: "", tags: "", note_type: "reflection" });
      setIsCreating(false);
      fetchNotes();
    } catch (error: any) {
      console.error('Error creating note:', error);
      toast({
        title: "Failed to save note",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const success = await deleteNote(noteId);
    if (success) {
      fetchNotes();
    }
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    fetchNotes();
  }, [user]);

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="bg-card border-b border-border p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Notebook className="w-8 h-8 text-notes-bg" />
                <h1 className="text-3xl font-bold">My Notes</h1>
              </div>
              <p className="text-lg text-muted-foreground">
                Your personal journal for insights, reflections, and spiritual growth
              </p>
            </div>
            <Button 
              className="bg-gradient-hero hover:opacity-90 flex items-center gap-2"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="w-4 h-4" />
              New Note
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search your notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Create Note Form */}
        {isCreating && (
          <Card className="mb-8 bg-notes-bg/20 border-peace/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New Note
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Note title..."
                value={newNote.title}
                onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
              />
              <Textarea
                placeholder="Write your thoughts, insights, or reflections..."
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                className="min-h-[120px]"
              />
              <div className="flex gap-4">
                <Input
                  placeholder="Tags (comma-separated)"
                  value={newNote.tags}
                  onChange={(e) => setNewNote(prev => ({ ...prev, tags: e.target.value }))}
                  className="flex-1"
                />
                <Select value={newNote.note_type} onValueChange={(value) => setNewNote(prev => ({ ...prev, note_type: value }))}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reflection">Reflection</SelectItem>
                    <SelectItem value="insight">Insight</SelectItem>
                    <SelectItem value="study">Study</SelectItem>
                    <SelectItem value="practice">Practice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3">
                <Button 
                  className="bg-gradient-hero hover:opacity-90"
                  disabled={!newNote.title.trim() || !newNote.content.trim() || isSubmitting}
                  onClick={handleCreateNote}
                >
                  {isSubmitting ? "Saving..." : "Save Note"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Notebook className="w-6 h-6 text-community mx-auto mb-2" />
              <div className="text-lg font-bold">{notes.length}</div>
              <div className="text-sm text-muted-foreground">Total Notes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="w-6 h-6 text-wisdom mx-auto mb-2" />
              <div className="text-lg font-bold">{notes.filter(n => n.is_favorite).length}</div>
              <div className="text-sm text-muted-foreground">Favorites</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="w-6 h-6 text-peace mx-auto mb-2" />
              <div className="text-lg font-bold">7</div>
              <div className="text-sm text-muted-foreground">Days Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Lightbulb className="w-6 h-6 text-growth mx-auto mb-2" />
              <div className="text-lg font-bold">{notes.length}</div>
              <div className="text-sm text-muted-foreground">Insights</div>
            </CardContent>
          </Card>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-16 bg-gray-200 rounded mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => {
              const TypeIcon = noteTypeIcons[note.note_type as keyof typeof noteTypeIcons];
              return (
                <Card key={note.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className={noteTypeColors[note.note_type as keyof typeof noteTypeColors]}>
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {note.note_type}
                      </Badge>
                      <div className="flex items-center gap-2">
                        {note.is_favorite && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors p-1 rounded"
                          title="Delete note"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-3 group-hover:text-primary transition-colors">
                      {note.title}
                    </h3>
                    
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-4">
                      {note.content}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {note.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <Notebook className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No notes found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? "Try adjusting your search terms" : "Start your spiritual journal by creating your first note"}
            </p>
            {!searchQuery && (
              <Button 
                className="bg-gradient-hero hover:opacity-90"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Note
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}