import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

interface SacredText {
  id: string;
  title: string;
  content: string;
  source: string;
  category: string;
  chapter?: string;
  tags?: string[];
  reads_count: number;
  created_at: string;
}

export default function AdminSacredTexts() {
  const [texts, setTexts] = useState<SacredText[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingText, setEditingText] = useState<SacredText | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    source: '',
    category: '',
    chapter: '',
    tags: '',
  });

  useEffect(() => {
    fetchTexts();
  }, []);

  const fetchTexts = async () => {
    try {
      const { data, error } = await supabase
        .from('sacred_texts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTexts(data || []);
    } catch (error) {
      console.error('Error fetching texts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch sacred texts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (text?: SacredText) => {
    if (text) {
      setEditingText(text);
      setFormData({
        title: text.title,
        content: text.content,
        source: text.source,
        category: text.category,
        chapter: text.chapter || '',
        tags: text.tags?.join(', ') || '',
      });
    } else {
      setEditingText(null);
      setFormData({
        title: '',
        content: '',
        source: '',
        category: '',
        chapter: '',
        tags: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const tagsArray = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t);

      const textData = {
        title: formData.title,
        content: formData.content,
        source: formData.source,
        category: formData.category,
        chapter: formData.chapter || null,
        tags: tagsArray,
        reads_count: editingText?.reads_count || 0, // Include reads_count for insert
      };

      if (editingText) {
        const { error } = await supabase
          .from('sacred_texts')
          .update(textData)
          .eq('id', editingText.id);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Sacred text updated successfully',
        });
      } else {
        const { error } = await supabase.from('sacred_texts').insert([textData]);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Sacred text created successfully',
        });
      }

      fetchTexts();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving text:', error);
      toast({
        title: 'Error',
        description: 'Failed to save sacred text',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this text?')) return;

    try {
      const { error } = await supabase.from('sacred_texts').delete().eq('id', id);

      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Sacred text deleted successfully',
      });
      fetchTexts();
    } catch (error) {
      console.error('Error deleting text:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete sacred text',
        variant: 'destructive',
      });
    }
  };

  const filteredTexts = texts.filter(
    (text) =>
      text.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      text.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      text.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sacred Texts Management</h1>
          <p className="text-muted-foreground">Manage sacred texts and scriptures</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Text
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sacred Texts</CardTitle>
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search texts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Chapter</TableHead>
                  <TableHead>Reads</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTexts.map((text) => (
                  <TableRow key={text.id}>
                    <TableCell className="font-medium">{text.title}</TableCell>
                    <TableCell>{text.source}</TableCell>
                    <TableCell>{text.category}</TableCell>
                    <TableCell>{text.chapter || '-'}</TableCell>
                    <TableCell>{text.reads_count}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(text)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(text.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingText ? 'Edit Sacred Text' : 'Add New Sacred Text'}
            </DialogTitle>
            <DialogDescription>
              {editingText ? 'Update the sacred text details' : 'Create a new sacred text entry'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Text title"
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Text content"
                rows={8}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source</Label>
                <Input
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="e.g., Bible, Quran, Bhagavad Gita"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Christianity, Islam, Hinduism"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Chapter (Optional)</Label>
              <Input
                value={formData.chapter}
                onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                placeholder="Chapter or section"
              />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="wisdom, faith, love"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingText ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
