import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMentorship } from '@/hooks/useMentorship';
import { useRealtime } from '@/hooks/useRealtime';
import {
  Users,
  Calendar as CalendarIcon,
  Clock,
  Star,
  MessageCircle,
  Video,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  BarChart3,
  Settings,
  Award,
  Receipt
} from 'lucide-react';
import { format } from 'date-fns';


const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

export default function Mentorship() {
  const { user } = useAuth();
  const { mentors, sessions, bookings, isLoading, getMentorAvailability, createBooking, manageSession, confirmBooking } = useMentorship();
  const { toast } = useToast();

  // Diagnostic logs
  console.log('Mentorship Page Debug:');
  console.log('User:', user);
  console.log('Mentors from hook:', mentors?.length || 0, 'items');
  console.log('Sessions from hook:', sessions?.length || 0, 'items');
  console.log('Bookings from hook:', bookings?.length || 0, 'items');
  console.log('IsLoading:', isLoading);
  console.log('First mentor sample:', mentors?.[0]);
  console.log('First session sample:', sessions?.[0]);

  // Set up real-time updates
  useRealtime({
    onSessionUpdate: (payload) => {
      console.log('Session update:', payload);
      // Refetch sessions when there are changes
      // The useMentorship hook will handle this via its useEffect
    },
    onBookingUpdate: (payload) => {
      console.log('Booking update:', payload);
      // Refetch bookings when there are changes
    }
  });
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookingTopic, setBookingTopic] = useState('');
  const [bookingDuration, setBookingDuration] = useState('60');
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  // Load available times when mentor and date are selected
  useEffect(() => {
    const loadAvailableTimes = async () => {
      if (selectedMentor && selectedDate) {
        const dateString = selectedDate.toISOString().split('T')[0];
        const result = await getMentorAvailability(selectedMentor.id, dateString);
        setAvailableTimes(result.availableTimes || []);
      } else {
        setAvailableTimes([]);
      }
    };

    loadAvailableTimes();
  }, [selectedMentor, selectedDate, getMentorAvailability]);

  const getMentorStats = (mentorId: string) => {
    const mentorSessions = sessions.filter(s => s.mentor_id === mentorId && s.status === 'completed');
    console.log('Mentor stats for', mentorId, ':', mentorSessions);
    const avgRating = mentorSessions.length > 0
      ? mentorSessions.reduce((sum, s) => sum + (s.rating || 0), 0) / mentorSessions.length
      : 0;
    return {
      totalSessions: mentorSessions.length,
      avgRating: avgRating.toFixed(1),
      totalEarned: mentorSessions.reduce((sum, s) => sum + s.price, 0)
    };
  };

  const upcomingSessions = sessions.filter(s => s.status === 'scheduled' && new Date(s.date) > new Date());
  const completedSessions = sessions.filter(s => s.status === 'completed');

  console.log('Filtered sessions - Upcoming:', upcomingSessions.length, 'Completed:', completedSessions.length);

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 md:w-8 md:h-8 text-community" />
              <h1 className="text-2xl md:text-3xl font-bold">Mentorship Platform</h1>
            </div>
          </div>
          <p className="text-sm md:text-lg text-muted-foreground">
            Connect with spiritual guides and experts for personalized growth and learning experiences
          </p>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Browse Mentors</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden sm:inline">My Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="become-mentor" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Become Mentor</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Browse Mentors Tab */}
          <TabsContent value="browse" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map((mentor) => (
                <Card key={mentor.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="w-16 h-16">
                          <AvatarFallback className="bg-gradient-hero text-white text-lg">
                            {mentor.avatar}
                          </AvatarFallback>
                        </Avatar>
                        {mentor.is_online && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{mentor.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{mentor.title}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{mentor.rating}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                              ({mentor.total_sessions} sessions)
                            </span>
                          {mentor.verified && (
                            <Badge variant="secondary" className="text-xs">
                              <Award className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {mentor.bio}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {mentor.specialties.slice(0, 3).map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-lg font-semibold">${mentor.hourly_rate}/hr</p>
                        <p className="text-xs text-muted-foreground">{mentor.experience} experience</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Languages</p>
                        <p className="text-sm">{mentor.languages.join(', ')}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          const handleBookSession = (mentor: any) => {
                            console.log('Booking session with mentor:', mentor);
                            setSelectedMentor(mentor);
                            setShowBookingDialog(true);
                          };
                          handleBookSession(mentor);
                        }}
                        className="flex-1 bg-gradient-hero hover:opacity-90"
                      >
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Book Session
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* My Sessions Tab */}
          <TabsContent value="sessions" className="mt-6">
            <div className="space-y-6">
              {/* Upcoming Sessions */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Upcoming Sessions</h3>
                {upcomingSessions.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingSessions.map((session) => (
                      <Card key={session.id}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="w-12 h-12">
                                <AvatarFallback>
                                  {mentors.find(m => m.id === session.mentor_id)?.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold">{session.mentor_name}</h4>
                                <p className="text-sm text-muted-foreground">{session.topic}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center gap-1">
                                    <CalendarIcon className="w-4 h-4" />
                                    <span className="text-sm">{format(session.date, 'PPP')}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm">{format(session.date, 'p')}</span>
                                  </div>
                                  <Badge variant="secondary">{session.duration} min</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right mr-4">
                                <p className="font-semibold">${session.price}</p>
                                <Badge variant="default" className="mt-1">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Scheduled
                                </Badge>
                              </div>
                              <Button
                                onClick={async () => {
                                  // Start the session
                                  await manageSession({
                                    action: 'start',
                                    sessionId: session.id
                                  });
                                  // Open video call with session data
                                  const videoCallUrl = `/video-call?session=${session.id}&mentor=${session.mentor_id}&topic=${encodeURIComponent(session.topic)}`;
                                  window.open(videoCallUrl, '_blank');
                                }}
                                disabled={new Date(session.date) > new Date()}
                              >
                                <Video className="w-4 h-4 mr-2" />
                                {new Date(session.date) > new Date() ? 'Waiting' : 'Join Call'}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <CalendarIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No upcoming sessions</h3>
                      <p className="text-muted-foreground mb-4">
                        Book your first mentorship session to start your journey
                      </p>
                      <Button onClick={() => setActiveTab('browse')}>
                        Browse Mentors
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Session History */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Session History</h3>
                {completedSessions.length > 0 ? (
                  <div className="space-y-4">
                    {completedSessions.map((session) => (
                      <Card key={session.id}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="w-12 h-12">
                                <AvatarFallback>
                                  {mentors.find(m => m.id === session.mentor_id)?.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold">{session.mentor_name}</h4>
                                <p className="text-sm text-muted-foreground">{session.topic}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center gap-1">
                                    <CalendarIcon className="w-4 h-4" />
                                    <span className="text-sm">{format(session.date, 'PPP')}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm">Completed</span>
                                  </div>
                                  {session.rating && (
                                    <div className="flex items-center gap-1">
                                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                      <span className="text-sm">{session.rating}/5</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right mr-4">
                                <p className="font-semibold">${session.price}</p>
                                <Badge variant="secondary" className="mt-1">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Paid
                                </Badge>
                              </div>
                              {!session.rating && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Open feedback dialog with session data
                                    const feedbackUrl = `/feedback?session=${session.id}&mentor=${session.mentor_id}&topic=${encodeURIComponent(session.topic)}`;
                                    window.open(feedbackUrl, '_blank');
                                  }}
                                >
                                  Leave Review
                                </Button>
                              )}
                            </div>
                          </div>
                          {session.feedback && (
                            <div className="mt-4 p-3 bg-muted rounded-lg">
                              <p className="text-sm">{session.feedback}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No completed sessions yet</h3>
                      <p className="text-muted-foreground">
                        Complete your first session to see it here
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Become Mentor Tab */}
          <TabsContent value="become-mentor" className="mt-6">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-6 h-6" />
                    Become a Mentor
                  </CardTitle>
                  <CardDescription>
                    Share your wisdom and help others on their spiritual journey
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                    <UserPlus className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Join Our Mentor Community</h3>
                    <p className="text-muted-foreground mb-4">
                      Apply to become a verified mentor and share your expertise with seekers worldwide
                    </p>
                    <Badge variant="secondary" className="mb-4">
                      Application Process: Profile Review → Verification → Approval
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" placeholder="Enter your full name" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="your.email@example.com" />
                    </div>
                    <div>
                      <Label htmlFor="specialties">Areas of Expertise</Label>
                      <Input id="specialties" placeholder="e.g., Mindfulness, Yoga, Bhagavad Gita" />
                    </div>
                    <div>
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-2">1-2 years</SelectItem>
                          <SelectItem value="3-5">3-5 years</SelectItem>
                          <SelectItem value="6-10">6-10 years</SelectItem>
                          <SelectItem value="10+">10+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="bio">Professional Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us about your background, expertise, and what you can offer to mentees..."
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                      <Input id="hourlyRate" type="number" placeholder="100" />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1 bg-gradient-hero hover:opacity-90">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Submit Application
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Save Draft
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-2">What happens next?</p>
                    <ul className="space-y-1 ml-4">
                      <li>• We'll review your application within 2-3 business days</li>
                      <li>• If approved, you'll undergo a verification process</li>
                      <li>• Once verified, you'll be able to set your availability and start mentoring</li>
                      <li>• You'll have access to mentor analytics and earnings dashboard</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 gap-6 mb-8">
              {/* Main Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BarChart3 className="w-5 h-5" />
                      Total Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600 mb-1">{sessions.length}</div>
                    <p className="text-sm text-muted-foreground">All time</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Completed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {sessions.filter(s => s.status === 'completed').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Sessions finished</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CreditCard className="w-5 h-5 text-green-600" />
                      Total Spent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      ${sessions.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.price, 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">On mentorship</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Upcoming
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {sessions.filter(s => s.status === 'scheduled').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Sessions booked</p>
                  </CardContent>
                </Card>
              </div>

              {/* Completion Rate */}
              <Card>
                <CardHeader>
                  <CardTitle>Session Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium">Overall Progress</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {Math.round((sessions.filter(s => s.status === 'completed').length / sessions.length) * 100) || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${(sessions.filter(s => s.status === 'completed').length / sessions.length) * 100 || 0}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {sessions.filter(s => s.status === 'completed').length}
                        </div>
                        <div className="text-sm text-muted-foreground">Completed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {sessions.filter(s => s.status === 'scheduled').length}
                        </div>
                        <div className="text-sm text-muted-foreground">Scheduled</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {sessions.filter(s => s.status === 'in_progress').length}
                        </div>
                        <div className="text-sm text-muted-foreground">In Progress</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>



            {/* Top Rated Mentors */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Top Rated Mentors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mentors
                    .sort((a, b) => b.rating - a.rating)
                    .slice(0, 5)
                    .map((mentor) => (
                      <div key={mentor.id} className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-gradient-hero text-white font-semibold">
                              {mentor.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{mentor.name}</p>
                            <p className="text-sm text-muted-foreground">{mentor.title}</p>
                            <p className="text-xs text-muted-foreground">{mentor.specialties?.[0] || 'General'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 mb-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{mentor.rating}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {mentor.total_sessions} sessions
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions.filter(s => s.status === 'completed').length > 0 ? (
                    <div className="grid gap-4">
                      {sessions.filter(s => s.status === 'completed').slice(0, 6).map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                              <Receipt className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">{session.topic}</p>
                              <p className="text-sm text-muted-foreground">
                                {session.mentor_name} • {format(session.date, 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-green-600">${session.price}</p>
                            <Badge variant="secondary" className="mt-1">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Paid
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No payment history yet</h3>
                      <p className="text-sm">Complete your first session to see payment history here.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Book Session with {selectedMentor?.name}</DialogTitle>
            <DialogDescription>
              Select your preferred date and time for the mentorship session
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-base font-medium mb-3 block">Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                  className="rounded-md border"
                />
              </div>

              <div>
                <Label className="text-base font-medium mb-3 block">Available Times</Label>
                {selectedDate ? (
                  <div className="grid grid-cols-2 gap-2">
                    {availableTimes.map((time: string) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        onClick={() => setSelectedTime(time)}
                        className="text-sm"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Please select a date first</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="topic">Session Topic</Label>
                <Input
                  id="topic"
                  placeholder="What would you like to discuss?"
                  value={bookingTopic}
                  onChange={(e) => setBookingTopic(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="duration">Session Duration</Label>
                <Select value={bookingDuration} onValueChange={setBookingDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes - ${Math.round(selectedMentor?.hourly_rate * 0.5)}</SelectItem>
                    <SelectItem value="60">60 minutes - ${selectedMentor?.hourly_rate}</SelectItem>
                    <SelectItem value="90">90 minutes - ${Math.round(selectedMentor?.hourly_rate * 1.5)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Cost:</span>
                <span className="text-xl font-bold">
                  ${selectedMentor ? Math.round(selectedMentor.hourly_rate * (parseInt(bookingDuration) / 60)) : 0}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  const handleConfirmBooking = async () => {
                    if (!selectedMentor || !selectedDate || !selectedTime || !bookingTopic) {
                      toast({
                        title: "Missing Information",
                        description: "Please fill in all required fields",
                        variant: "destructive",
                      });
                      return;
                    }

                    try {
                      const bookingData = {
                        mentorId: selectedMentor.id,
                        date: selectedDate.toISOString().split('T')[0] + 'T' + selectedTime + ':00',
                        duration: parseInt(bookingDuration),
                        topic: bookingTopic,
                      };

                      console.log('Creating booking with data:', bookingData);
                      const result = await createBooking(bookingData);

                      if (result) {
                        toast({
                          title: "Success",
                          description: "Session booked successfully!",
                        });
                        setShowBookingDialog(false);
                        setSelectedDate(undefined);
                        setSelectedTime('');
                        setBookingTopic('');
                      }
                    } catch (error) {
                      console.error('Booking error:', error);
                      toast({
                        title: "Booking Failed",
                        description: "Unable to book session. Please try again.",
                        variant: "destructive",
                      });
                    }
                  };
                  handleConfirmBooking();
                }}
                className="flex-1 bg-gradient-hero hover:opacity-90"
                disabled={!selectedDate || !selectedTime || !bookingTopic}
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Confirm Booking
              </Button>
              <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}