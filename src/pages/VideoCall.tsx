import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MessageCircle,
  Phone,
  PhoneOff,
  Settings,
  Users,
  Share,
  Maximize,
  Minimize,
  Volume2,
  VolumeX
} from 'lucide-react';

interface VideoCallProps {
  sessionId?: string;
  mentorName?: string;
  mentorAvatar?: string;
  mentorId?: string;
  topic?: string;
  onEndCall?: () => void;
}

export default function VideoCall({ sessionId, mentorName, mentorAvatar, mentorId, topic, onEndCall }: VideoCallProps) {
  console.log('VideoCall Debug:', { sessionId, mentorName, mentorAvatar, mentorId, topic });
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { id: '1', sender: 'mentor', message: 'Welcome! How are you feeling today?', timestamp: new Date() },
    { id: '2', sender: 'learner', message: 'Thank you! I\'m ready to begin our session.', timestamp: new Date() }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast({
      title: isMuted ? "Microphone On" : "Microphone Off",
      description: isMuted ? "Your microphone is now active" : "Your microphone is muted",
    });
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    toast({
      title: isVideoOn ? "Camera Off" : "Camera On",
      description: isVideoOn ? "Your camera is turned off" : "Your camera is now active",
    });
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    toast({
      title: isScreenSharing ? "Screen Sharing Stopped" : "Screen Sharing Started",
      description: isScreenSharing ? "Screen sharing has been stopped" : "You are now sharing your screen",
    });
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now().toString(),
        sender: 'learner',
        message: newMessage.trim(),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  const endCall = () => {
    toast({
      title: "Call Ended",
      description: `Session with ${mentorName || 'Mentor'} has ended. Duration: ${formatTime(sessionTime)}`,
    });
    onEndCall?.();
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>{mentorAvatar}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{mentorName}</p>
                  <p className="text-xs text-muted-foreground">{formatTime(sessionTime)}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={toggleMute}>
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsMinimized(false)}>
                  <Maximize className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={endCall}>
                  <PhoneOff className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <div className="flex flex-col h-full bg-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gray-800 text-white">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-hero text-white">
                  {mentorAvatar}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{mentorName || 'Mentor'}</h3>
                <p className="text-sm text-gray-300">{topic || 'Spiritual Mentorship Session'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-green-600">
                <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                Connected
              </Badge>
              <div className="text-lg font-mono font-bold">
                {formatTime(sessionTime)}
              </div>
              {isRecording && (
                <Badge variant="destructive">
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                  Recording
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Main Video Area */}
            <div className="flex-1 relative">
              {/* Remote Video (Mentor) */}
              <div className="w-full h-full bg-gray-800 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Avatar className="w-32 h-32 mx-auto mb-4">
                      <AvatarFallback className="bg-gradient-hero text-white text-4xl">
                        {mentorAvatar}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-2xl font-semibold mb-2">{mentorName || 'Mentor'}</h2>
                    <p className="text-gray-300">{topic || 'Spiritual Guide & Mentor'}</p>
                  </div>
                </div>

                {/* Local Video (Self) */}
                <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden border-2 border-white">
                  <div className="w-full h-full flex items-center justify-center text-white">
                    {isVideoOn ? (
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-xl font-bold">JD</span>
                        </div>
                        <p className="text-sm">You</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <VideoOff className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Camera Off</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Sidebar */}
            {showChat && (
              <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-semibold">Session Chat</h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowChat(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      ×
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'learner' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs p-3 rounded-lg ${
                          msg.sender === 'learner'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-white'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    />
                    <Button onClick={sendMessage} size="sm">
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 bg-gray-800">
            <div className="flex items-center justify-center gap-4">
              {/* Audio Control */}
              <Button
                onClick={toggleMute}
                variant={isMuted ? "destructive" : "secondary"}
                size="lg"
                className="rounded-full w-12 h-12 p-0"
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>

              {/* Video Control */}
              <Button
                onClick={toggleVideo}
                variant={!isVideoOn ? "destructive" : "secondary"}
                size="lg"
                className="rounded-full w-12 h-12 p-0"
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>

              {/* Screen Share */}
              <Button
                onClick={toggleScreenShare}
                variant={isScreenSharing ? "default" : "secondary"}
                size="lg"
                className="rounded-full w-12 h-12 p-0"
              >
                <Monitor className="w-5 h-5" />
              </Button>

              {/* Chat Toggle */}
              <Button
                onClick={() => setShowChat(!showChat)}
                variant="secondary"
                size="lg"
                className="rounded-full w-12 h-12 p-0"
              >
                <MessageCircle className="w-5 h-5" />
              </Button>

              {/* Settings */}
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full w-12 h-12 p-0"
              >
                <Settings className="w-5 h-5" />
              </Button>

              {/* Minimize */}
              <Button
                onClick={() => setIsMinimized(true)}
                variant="secondary"
                size="lg"
                className="rounded-full w-12 h-12 p-0"
              >
                <Minimize className="w-5 h-5" />
              </Button>

              {/* End Call */}
              <Button
                onClick={endCall}
                variant="destructive"
                size="lg"
                className="rounded-full w-16 h-12 px-4 ml-4"
              >
                <PhoneOff className="w-5 h-5 mr-2" />
                End Call
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}