import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Mic, Video, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface MediaComposerProps {
  conversationId: string;
  onMediaSent: (mediaUrl: string, mediaType: 'image' | 'audio' | 'video', altText?: string) => void;
  abilityProfile: string;
}

export const MediaComposer = ({ conversationId, onMediaSent, abilityProfile }: MediaComposerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mediaType, setMediaType] = useState<'image' | 'audio' | 'video'>('image');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview for images and videos
      if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const bucket = `message-${mediaType}s`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      setUploadProgress(100);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      onMediaSent(urlData.publicUrl, mediaType, altText || undefined);
      
      toast.success(`${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} uploaded successfully`);
      handleClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload media');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFile(null);
    setPreview(null);
    setAltText('');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openMediaDialog = (type: 'image' | 'audio' | 'video') => {
    setMediaType(type);
    setIsOpen(true);
  };

  const acceptTypes = {
    image: 'image/jpeg,image/png,image/gif,image/webp',
    audio: 'audio/mpeg,audio/wav,audio/ogg,audio/webm',
    video: 'video/mp4,video/webm,video/quicktime'
  };

  return (
    <>
      <div className="flex gap-2">
        {/* Image button - always visible */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => openMediaDialog('image')}
          className="touch-target"
          aria-label="Attach image"
        >
          <Camera className="h-5 w-5" />
        </Button>

        {/* Audio button - for users who can speak */}
        {!abilityProfile.includes('MUTE') && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => openMediaDialog('audio')}
            className="touch-target"
            aria-label="Record audio"
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}

        {/* Video button - for sign language */}
        {abilityProfile.includes('DEAF_MUTE') && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => openMediaDialog('video')}
            className="touch-target"
            aria-label="Record video"
          >
            <Video className="h-5 w-5" />
          </Button>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Upload {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Input
                ref={fileInputRef}
                type="file"
                accept={acceptTypes[mediaType]}
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
            </div>

            {preview && mediaType === 'image' && (
              <div className="relative">
                <img src={preview} alt="Preview" className="w-full rounded-lg" />
              </div>
            )}

            {preview && mediaType === 'video' && (
              <div className="relative">
                <video src={preview} controls className="w-full rounded-lg" />
              </div>
            )}

            {file && mediaType === 'audio' && (
              <div className="p-4 bg-muted rounded-lg text-center">
                <Mic className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm">{file.name}</p>
              </div>
            )}

            {/* Alt text for images (accessibility) */}
            {mediaType === 'image' && file && (
              <div className="space-y-2">
                <Label htmlFor="alt-text">
                  Image Description (for screen readers)
                </Label>
                <Input
                  id="alt-text"
                  placeholder="Describe the image..."
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Help visually impaired users understand the image content
                </p>
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-xs text-center text-muted-foreground">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!file || uploading}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
