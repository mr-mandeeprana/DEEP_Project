import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ImageIcon,
  Video,
  X,
  Upload,
  Loader2,
  Hash,
  Plus
} from 'lucide-react';

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export default function CreatePost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('thought');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const postTypes = [
    { value: 'thought', label: 'Thought', description: 'Share your wisdom or reflection' },
    { value: 'question', label: 'Question', description: 'Ask for guidance or advice' },
    { value: 'experience', label: 'Experience', description: 'Share your personal journey' },
    { value: 'reflection', label: 'Quote/Reflection', description: 'Share an inspiring quote or reflection' }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    files.forEach(file => {
      if (mediaFiles.length >= 4) {
        toast({
          title: "Too many files",
          description: "You can upload up to 4 media files",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please select files smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      const fileType = file.type.startsWith('image/') ? 'image' : 'video';

      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setMediaFiles(prev => [...prev, {
          file,
          preview,
          type: fileType
        }]);
      };
      reader.readAsDataURL(file);
    });

    // Clear input
    event.target.value = '';
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags(prev => [...prev, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const uploadMediaFiles = async (files: MediaFile[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const mediaFile of files) {
      const fileExt = mediaFile.file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, mediaFile.file);

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing content",
        description: "Please provide both title and content",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let mediaUrls: string[] = [];

      if (mediaFiles.length > 0) {
        setUploading(true);
        mediaUrls = await uploadMediaFiles(mediaFiles);
        setUploading(false);
      }

      const { error } = await supabase
        .from('community_posts')
        .insert({
          title: title.trim(),
          content: content.trim(),
          post_type: postType,
          tags: tags.length > 0 ? tags : null,
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
          user_id: user?.id,
        });

      if (error) throw error;

      toast({
        title: "Post created!",
        description: "Your post has been shared with the community",
      });

      // Navigate to community and refresh posts
      navigate('/community');

      // Dispatch custom event to trigger refresh in CommunityFeed
      window.dispatchEvent(new CustomEvent('postCreated'));
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Post
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Post Type */}
              <div>
                <Label className="text-base font-medium">Post Type</Label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {postTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setPostType(type.value)}
                      className={`p-3 text-left border rounded-lg transition-colors ${
                        postType === type.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-accent'
                      }`}
                    >
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-muted-foreground">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your post a meaningful title..."
                  className="mt-1"
                  maxLength={100}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {title.length}/100 characters
                </div>
              </div>

              {/* Content */}
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your wisdom, experience, or question..."
                  className="mt-1 min-h-[120px]"
                  maxLength={2000}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {content.length}/2000 characters
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label>Tags (optional)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    placeholder="Add tags..."
                    className="flex-1"
                    maxLength={20}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTag}
                    disabled={!tagInput.trim() || tags.length >= 5}
                  >
                    <Hash className="w-4 h-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  {tags.length}/5 tags
                </div>
              </div>

              {/* Media Upload */}
              <div>
                <Label>Media (optional)</Label>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || mediaFiles.length >= 4}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Add Photos/Videos
                  </Button>
                </div>

                {/* Media Preview */}
                {mediaFiles.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {mediaFiles.map((mediaFile, index) => (
                      <div key={index} className="relative group">
                        {mediaFile.type === 'image' ? (
                          <img
                            src={mediaFile.preview}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                        ) : (
                          <video
                            src={mediaFile.preview}
                            className="w-full h-32 object-cover rounded-lg border"
                            controls
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMediaFile(index)}
                          className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          {mediaFile.type === 'image' ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-xs text-muted-foreground mt-2">
                  {mediaFiles.length}/4 files • Max 10MB each
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || uploading}
                  className="flex-1 bg-gradient-hero hover:opacity-90"
                >
                  {loading || uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {uploading ? 'Uploading...' : 'Creating...'}
                    </>
                  ) : (
                    'Share Post'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}