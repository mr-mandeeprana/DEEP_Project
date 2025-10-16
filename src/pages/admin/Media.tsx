import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Image,
  Trash2,
  Search,
  Upload,
  FileVideo,
  FileAudio,
  FileText,
  Download,
  Eye,
  RefreshCw,
  FolderOpen,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  Filter,
  Grid3X3,
  List,
  MoreHorizontal
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';

interface MediaFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

interface MediaStats {
  totalFiles: number;
  totalSize: number;
  imagesCount: number;
  videosCount: number;
  documentsCount: number;
  otherCount: number;
}

export default function AdminMedia() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [mediaStats, setMediaStats] = useState<MediaStats>({
    totalFiles: 0,
    totalSize: 0,
    imagesCount: 0,
    videosCount: 0,
    documentsCount: 0,
    otherCount: 0,
  });

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase.storage.from('uploads').list();

      if (error) throw error;

      const files = data || [];
      setFiles(files);

      // Calculate stats
      const stats = {
        totalFiles: files.length,
        totalSize: files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0),
        imagesCount: files.filter(f => f.metadata?.mimetype?.startsWith('image/')).length,
        videosCount: files.filter(f => f.metadata?.mimetype?.startsWith('video/')).length,
        documentsCount: files.filter(f =>
          f.metadata?.mimetype?.includes('pdf') ||
          f.metadata?.mimetype?.includes('document') ||
          f.metadata?.mimetype?.includes('text')
        ).length,
        otherCount: files.filter(f =>
          !f.metadata?.mimetype?.startsWith('image/') &&
          !f.metadata?.mimetype?.startsWith('video/') &&
          !f.metadata?.mimetype?.includes('pdf') &&
          !f.metadata?.mimetype?.includes('document') &&
          !f.metadata?.mimetype?.includes('text')
        ).length,
      };
      setMediaStats(stats);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch media files',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { error } = await supabase.storage
        .from('uploads')
        .upload(`${Date.now()}_${file.name}`, file);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      });
      fetchFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        const { error } = await supabase.storage
          .from('uploads')
          .upload(`${Date.now()}_${file.name}`, file);

        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error('Error uploading file:', error);
        errorCount++;
      }
    }

    toast({
      title: 'Bulk Upload Complete',
      description: `${successCount} files uploaded successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      variant: errorCount > 0 ? 'destructive' : 'default',
    });

    setUploading(false);
    event.target.value = '';
    fetchFiles();
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const { error } = await supabase.storage.from('uploads').remove([fileName]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'File deleted successfully',
      });
      fetchFiles();
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileName);
        return newSet;
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete file',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedFiles.size} files?`)) return;

    try {
      const { error } = await supabase.storage.from('uploads').remove(Array.from(selectedFiles));

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${selectedFiles.size} files deleted successfully`,
      });
      fetchFiles();
      setSelectedFiles(new Set());
    } catch (error) {
      console.error('Error deleting files:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete some files',
        variant: 'destructive',
      });
    }
  };

  const getFileUrl = (fileName: string) => {
    const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const getFileIcon = (mimetype?: string) => {
    if (!mimetype) return Image;
    if (mimetype.startsWith('image/')) return Image;
    if (mimetype.startsWith('video/')) return FileVideo;
    if (mimetype.startsWith('audio/')) return FileAudio;
    return FileText;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const getFileType = (mimetype?: string): string => {
    if (!mimetype) return 'other';
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype.includes('pdf') || mimetype.includes('document') || mimetype.includes('text')) return 'document';
    return 'other';
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || getFileType(file.metadata?.mimetype) === typeFilter;
    return matchesSearch && matchesType;
  });

  const toggleFileSelection = (fileName: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileName)) {
        newSet.delete(fileName);
      } else {
        newSet.add(fileName);
      }
      return newSet;
    });
  };

  const selectAllFiles = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.name)));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Media Management
          </h1>
          <p className="text-muted-foreground mt-2">Centralized file management system for all uploaded media</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchFiles} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <div>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button asChild disabled={uploading} variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer gap-2">
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload File'}
              </label>
            </Button>
          </div>
          <div>
            <input
              type="file"
              id="bulk-upload"
              multiple
              className="hidden"
              onChange={handleBulkUpload}
              disabled={uploading}
            />
            <Button asChild disabled={uploading} className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500">
              <label htmlFor="bulk-upload" className="cursor-pointer">
                <Upload className="w-4 h-4" />
                Bulk Upload
              </label>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HardDrive className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mediaStats.totalFiles}</p>
              <p className="text-sm text-muted-foreground">Total Files</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Image className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mediaStats.imagesCount}</p>
              <p className="text-sm text-muted-foreground">Images</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileVideo className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mediaStats.videosCount}</p>
              <p className="text-sm text-muted-foreground">Videos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mediaStats.documentsCount}</p>
              <p className="text-sm text-muted-foreground">Documents</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Storage Used</span>
              <span className="text-lg font-bold">{formatFileSize(mediaStats.totalSize)}</span>
            </div>
            <Progress value={Math.min((mediaStats.totalSize / (1024 * 1024 * 1024)) * 100, 100)} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {((mediaStats.totalSize / (1024 * 1024 * 1024)) * 100).toFixed(1)}% of 1GB limit used
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="files" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="files" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            File Library
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Filter className="w-4 h-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <HardDrive className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-6">
          {/* Filters and Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>File Library ({filteredFiles.length})</span>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={selectAllFiles}
                    disabled={filteredFiles.length === 0}
                  >
                    {selectedFiles.size === filteredFiles.length && filteredFiles.length > 0
                      ? 'Deselect All'
                      : 'Select All'
                    }
                  </Button>
                  {selectedFiles.size > 0 && (
                    <Button
                      variant="destructive"
                      onClick={handleBulkDelete}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete ({selectedFiles.size})
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Files Display */}
          <Card>
            <CardContent className="p-6">
              {isLoading ? (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[...Array(12)].map((_, i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...Array(8)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                )
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Image className="h-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No files found</h3>
                  <p className="text-sm">Upload some files to get started</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredFiles.map((file) => {
                    const FileIcon = getFileIcon(file.metadata?.mimetype);
                    const isSelected = selectedFiles.has(file.name);
                    return (
                      <Card
                        key={file.id}
                        className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                          isSelected ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => toggleFileSelection(file.name)}
                      >
                        <div className="aspect-square bg-gray-50 relative">
                          {file.metadata?.mimetype?.startsWith('image/') ? (
                            <img
                              src={getFileUrl(file.name)}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <FileIcon className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <p className="text-sm font-medium truncate" title={file.name}>
                            {file.name}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline" className="text-xs">
                              {getFileType(file.metadata?.mimetype)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(file.metadata?.size)}
                            </span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-full mt-2">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => window.open(getFileUrl(file.name), '_blank')}>
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(file.name)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFiles.map((file) => {
                    const FileIcon = getFileIcon(file.metadata?.mimetype);
                    const isSelected = selectedFiles.has(file.name);
                    return (
                      <div
                        key={file.id}
                        className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        }`}
                        onClick={() => toggleFileSelection(file.name)}
                      >
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        )}
                        <div className="flex-shrink-0">
                          <FileIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{getFileType(file.metadata?.mimetype)}</span>
                            <span>{formatFileSize(file.metadata?.size)}</span>
                            <span>Uploaded {format(new Date(file.created_at), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => window.open(getFileUrl(file.name), '_blank')}>
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(file.name)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { type: 'Images', count: mediaStats.imagesCount, icon: Image, color: 'bg-green-500' },
              { type: 'Videos', count: mediaStats.videosCount, icon: FileVideo, color: 'bg-purple-500' },
              { type: 'Documents', count: mediaStats.documentsCount, icon: FileText, color: 'bg-orange-500' },
              { type: 'Audio', count: mediaStats.otherCount, icon: FileAudio, color: 'bg-blue-500' },
              { type: 'Other', count: files.filter(f => !f.metadata?.mimetype).length, icon: HardDrive, color: 'bg-gray-500' }
            ].map((category) => (
              <Card key={category.type} className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${category.color} text-white`}>
                    <category.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{category.type}</h3>
                    <p className="text-2xl font-bold">{category.count} files</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Media Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: 'Images', count: mediaStats.imagesCount, percentage: (mediaStats.imagesCount / mediaStats.totalFiles) * 100 },
                    { type: 'Videos', count: mediaStats.videosCount, percentage: (mediaStats.videosCount / mediaStats.totalFiles) * 100 },
                    { type: 'Documents', count: mediaStats.documentsCount, percentage: (mediaStats.documentsCount / mediaStats.totalFiles) * 100 },
                    { type: 'Other', count: mediaStats.otherCount, percentage: (mediaStats.otherCount / mediaStats.totalFiles) * 100 }
                  ].filter(item => item.count > 0).map((item) => (
                    <div key={item.type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.type}</span>
                        <span>{item.count} files ({item.percentage.toFixed(1)}%)</span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Storage Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Storage Used</span>
                    <span className="font-bold">{formatFileSize(mediaStats.totalSize)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Available Storage</span>
                    <span className="font-bold">{formatFileSize(1024 * 1024 * 1024 - mediaStats.totalSize)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Storage Efficiency</span>
                    <span className="font-bold">98.5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
