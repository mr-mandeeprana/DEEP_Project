import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, File, Image, Video, FileText, Music } from "lucide-react";

interface FileUploadProps {
  onFileUploaded?: (fileUrl: string, fileName: string) => void;
  acceptedFileTypes?: string[];
  maxFiles?: number;
  className?: string;
}

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return Image;
  if (fileType.startsWith('video/')) return Video;
  if (fileType.startsWith('audio/')) return Music;
  if (fileType.includes('pdf') || fileType.includes('document')) return FileText;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function FileUpload({ 
  onFileUploaded, 
  acceptedFileTypes = [], 
  maxFiles = 5,
  className = ""
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      const uploadedFile: UploadedFile = {
        name: file.name,
        url: urlData.publicUrl,
        type: file.type,
        size: file.size
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);
      onFileUploaded?.(urlData.publicUrl, file.name);

      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been uploaded.`,
      });

      setUploadProgress(100);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles.slice(0, maxFiles - uploadedFiles.length)) {
      await uploadFile(file);
    }
  }, [uploadedFiles.length, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.length > 0 ? 
      acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}) : 
      undefined,
    disabled: uploading || uploadedFiles.length >= maxFiles,
    maxSize: 20 * 1024 * 1024 // 20MB
  });

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${uploading || uploadedFiles.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        
        {uploading ? (
          <div className="space-y-2">
            <div className="text-primary font-medium">Uploading...</div>
            <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
          </div>
        ) : (
          <div>
            <div className="text-primary font-medium mb-2">
              {isDragActive ? 'Drop files here' : 'Upload files'}
            </div>
            <div className="text-sm text-muted-foreground">
              Drag & drop files here, or click to browse
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Supports: PDF, DOC, PPT, Images, Videos, Audio (Max 20MB each)
            </div>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => {
              const FileIcon = getFileIcon(file.type);
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileIcon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{file.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {uploadedFiles.length >= maxFiles && (
        <Badge variant="secondary" className="w-fit">
          Maximum {maxFiles} files reached
        </Badge>
      )}
    </div>
  );
}