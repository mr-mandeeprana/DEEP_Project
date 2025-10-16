import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  BookOpen
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string;
  lesson_type: 'video' | 'audio' | 'text' | 'quiz';
  content?: string;
  video_url?: string;
  audio_url?: string;
  duration_minutes: number;
  is_preview: boolean;
  resources?: any[];
}

interface LessonProgress {
  status: 'not_started' | 'in_progress' | 'completed';
  time_spent_minutes: number;
  completed_at?: string;
}

interface LessonViewerProps {
  lesson: Lesson;
  progress: LessonProgress;
  onComplete: (lessonId: string) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export const LessonViewer = ({
  lesson,
  progress,
  onComplete,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false
}: LessonViewerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showResources, setShowResources] = useState(false);

  const handleComplete = () => {
    onComplete(lesson.id);
  };

  const renderLessonContent = () => {
    switch (lesson.lesson_type) {
      case 'video':
        return (
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center relative">
            {lesson.video_url ? (
              <video
                src={lesson.video_url}
                className="w-full h-full rounded-lg"
                controls
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
              />
            ) : (
              <div className="text-white text-center">
                <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Video content not available</p>
              </div>
            )}
          </div>
        );

      case 'audio':
        return (
          <Card className="p-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Volume2 className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{lesson.title}</h3>
              <p className="text-muted-foreground mb-6">{lesson.description}</p>

              {lesson.audio_url ? (
                <audio
                  src={lesson.audio_url}
                  controls
                  className="w-full"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              ) : (
                <p className="text-muted-foreground">Audio content not available</p>
              )}
            </div>
          </Card>
        );

      case 'text':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {lesson.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {lesson.content ? (
                  <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                ) : (
                  <p className="text-muted-foreground">Lesson content not available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'quiz':
        return (
          <Card className="p-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Quiz Time!</h3>
              <p className="text-muted-foreground mb-6">{lesson.description}</p>
              <Button onClick={() => {/* Navigate to quiz */}}>
                Start Quiz
              </Button>
            </div>
          </Card>
        );

      default:
        return (
          <Card className="p-6">
            <div className="text-center text-muted-foreground">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Lesson content type not supported.</p>
            </div>
          </Card>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Lesson Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{lesson.title}</h1>
                {lesson.is_preview && (
                  <Badge variant="secondary">Preview</Badge>
                )}
              </div>
              <p className="text-muted-foreground">{lesson.description}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{lesson.duration_minutes} min</span>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Lesson Progress</span>
              <span>
                {progress.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600 inline mr-1" />}
                {progress.status}
              </span>
            </div>
            <Progress
              value={progress.status === 'completed' ? 100 : progress.status === 'in_progress' ? 50 : 0}
              className="h-2"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Lesson Content */}
      <div className="min-h-[400px]">
        {renderLessonContent()}
      </div>

      {/* Resources Section */}
      {lesson.resources && lesson.resources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Lesson Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {lesson.resources.map((resource: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{resource.name}</p>
                    <p className="text-sm text-muted-foreground">{resource.type}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation & Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onPrevious}
                disabled={!hasPrevious}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <Button
                variant="outline"
                onClick={onNext}
                disabled={!hasNext}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="flex gap-2">
              {progress.status !== 'completed' && (
                <Button onClick={handleComplete} className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Mark as Complete
                </Button>
              )}

              {progress.status === 'completed' && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Completed</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};