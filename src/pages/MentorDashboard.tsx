import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart3,
  Calendar,
  DollarSign,
  Users,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  MessageSquare,
  Video,
  Award
} from 'lucide-react';
import { format } from 'date-fns';

// Mock data for mentor dashboard
const mockMentorProfile = {
  id: '1',
  name: 'Dr. Maya Patel',
  title: 'Clinical Psychologist & Mindfulness Expert',
  avatar: 'MP',
  rating: 4.9,
  totalSessions: 156,
  totalEarnings: 18720,
  completionRate: 98,
  responseTime: '2 hours',
  specialties: ['Mindfulness', 'Anxiety', 'Meditation', 'Therapy'],
  hourlyRate: 120,
  bio: 'Specializing in mindfulness-based therapy and helping individuals achieve mental wellness through ancient wisdom and modern psychology.'
};

const mockSessions = [
  {
    id: '1',
    learnerName: 'John Doe',
    learnerAvatar: 'JD',
    date: new Date('2024-12-20T14:00:00'),
    duration: 60,
    topic: 'Mindfulness for Stress Management',
    status: 'completed',
    price: 120,
    rating: 5,
    feedback: 'Excellent session! Very insightful and practical.'
  },
  {
    id: '2',
    learnerName: 'Sarah Wilson',
    learnerAvatar: 'SW',
    date: new Date('2024-12-22T10:00:00'),
    duration: 90,
    topic: 'Anxiety Management Techniques',
    status: 'scheduled',
    price: 180,
    rating: null,
    feedback: null
  },
  {
    id: '3',
    learnerName: 'Mike Johnson',
    learnerAvatar: 'MJ',
    date: new Date('2024-12-18T15:00:00'),
    duration: 60,
    topic: 'Meditation Basics',
    status: 'completed',
    price: 120,
    rating: 4,
    feedback: 'Great introduction to meditation practices.'
  }
];

const mockEarnings = [
  { month: 'Oct', amount: 2400, sessions: 20 },
  { month: 'Nov', amount: 2880, sessions: 24 },
  { month: 'Dec', amount: 3120, sessions: 26 }
];

const mockReviews = [
  {
    id: '1',
    learnerName: 'John Doe',
    learnerAvatar: 'JD',
    rating: 5,
    feedback: 'Dr. Maya is incredibly knowledgeable and creates a safe space for open discussion. Her mindfulness techniques have been life-changing.',
    date: new Date('2024-12-20'),
    sessionTopic: 'Mindfulness for Stress Management'
  },
  {
    id: '2',
    learnerName: 'Sarah Wilson',
    learnerAvatar: 'SW',
    rating: 5,
    feedback: 'The anxiety management techniques she taught me are practical and effective. Highly recommend!',
    date: new Date('2024-12-18'),
    sessionTopic: 'Anxiety Management Techniques'
  },
  {
    id: '3',
    learnerName: 'Mike Johnson',
    learnerAvatar: 'MJ',
    rating: 4,
    feedback: 'Great introduction to meditation. Looking forward to more sessions.',
    date: new Date('2024-12-15'),
    sessionTopic: 'Meditation Basics'
  }
];

export default function MentorDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(mockMentorProfile);
  const [sessions, setSessions] = useState(mockSessions);
  const [earnings] = useState(mockEarnings);
  const [reviews] = useState(mockReviews);

  const upcomingSessions = sessions.filter(s => s.status === 'scheduled');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
  const totalSessions = earnings.reduce((sum, e) => sum + e.sessions, 0);
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-gradient-hero text-white text-lg">
                  {profile.avatar}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{profile.name}</h1>
                <p className="text-sm md:text-lg text-muted-foreground">{profile.title}</p>
              </div>
            </div>
          </div>
          <p className="text-sm md:text-lg text-muted-foreground">
            Welcome back! Here's an overview of your mentorship activities and performance.
          </p>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">${totalEarnings.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Earnings</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{totalSessions}</div>
              <div className="text-sm text-muted-foreground">Sessions Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600">{averageRating.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{profile.completionRate}%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="earnings" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Earnings</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Reviews</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sessions.slice(0, 5).map((session) => (
                      <div key={session.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>{session.learnerAvatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{session.learnerName}</p>
                          <p className="text-xs text-muted-foreground">{session.topic}</p>
                        </div>
                        <Badge variant={
                          session.status === 'completed' ? 'default' :
                          session.status === 'scheduled' ? 'secondary' : 'destructive'
                        }>
                          {session.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Earnings Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Monthly Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {earnings.map((month, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-hero rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {month.month}
                          </div>
                          <div>
                            <p className="text-sm font-medium">${month.amount}</p>
                            <p className="text-xs text-muted-foreground">{month.sessions} sessions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Avg: ${(month.amount / month.sessions).toFixed(0)}/session</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Profile Completion</span>
                      <span>95%</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Response Time</span>
                      <span>{profile.responseTime}</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Client Satisfaction</span>
                      <span>{averageRating.toFixed(1)}/5</span>
                    </div>
                    <Progress value={(averageRating / 5) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Update Availability
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Set Pricing
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message Support
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sessions Tab */}
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
                                <AvatarFallback>{session.learnerAvatar}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold">{session.learnerName}</h4>
                                <p className="text-sm text-muted-foreground">{session.topic}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
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
                                <Badge variant="secondary" className="mt-1">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Scheduled
                                </Badge>
                              </div>
                              <Button>
                                <Video className="w-4 h-4 mr-2" />
                                Start Call
                              </Button>
                              <Button variant="outline" size="sm">
                                Reschedule
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
                      <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No upcoming sessions</h3>
                      <p className="text-muted-foreground">
                        Your schedule is clear. Sessions will appear here when learners book with you.
                      </p>
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
                                <AvatarFallback>{session.learnerAvatar}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-semibold">{session.learnerName}</h4>
                                <p className="text-sm text-muted-foreground">{session.topic}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
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
                              {session.feedback && (
                                <div className="max-w-xs">
                                  <p className="text-xs text-muted-foreground mb-1">Feedback:</p>
                                  <p className="text-xs">"{session.feedback}"</p>
                                </div>
                              )}
                            </div>
                          </div>
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
                        Your completed sessions will appear here.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Earnings Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      ${totalEarnings.toLocaleString()}
                    </div>
                    <p className="text-muted-foreground">Total Earnings</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-xl font-bold">{totalSessions}</div>
                      <div className="text-sm text-muted-foreground">Total Sessions</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-xl font-bold">${(totalEarnings / totalSessions).toFixed(0)}</div>
                      <div className="text-sm text-muted-foreground">Avg per Session</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Monthly Breakdown</h4>
                    <div className="space-y-3">
                      {earnings.map((month, index) => (
                        <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{month.month} 2024</p>
                            <p className="text-sm text-muted-foreground">{month.sessions} sessions</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${month.amount}</p>
                            <p className="text-xs text-muted-foreground">${(month.amount / month.sessions).toFixed(0)}/session</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Earnings Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Revenue Growth</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>This Month</span>
                        <span className="font-medium">${earnings[earnings.length - 1]?.amount || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Last Month</span>
                        <span className="font-medium">${earnings[earnings.length - 2]?.amount || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Growth</span>
                        <span className="font-medium">
                          +{earnings.length >= 2 ?
                            Math.round(((earnings[earnings.length - 1].amount - earnings[earnings.length - 2].amount) / earnings[earnings.length - 2].amount) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Payout Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Next Payout</span>
                        <span className="text-sm font-medium">Dec 31, 2024</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Pending Amount</span>
                        <span className="text-sm font-medium">$240</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Payment Method</span>
                        <span className="text-sm font-medium">Bank Transfer</span>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full" variant="outline">
                    <DollarSign className="w-4 h-4 mr-2" />
                    View Detailed Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <Star className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold mb-1">{averageRating.toFixed(1)}</div>
                  <div className="text-muted-foreground mb-3">Overall Rating</div>
                  <div className="flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.floor(averageRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Based on {reviews.length} reviews
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <MessageSquare className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold mb-1">{reviews.length}</div>
                  <div className="text-muted-foreground mb-3">Total Reviews</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>5 Stars</span>
                      <span>{reviews.filter(r => r.rating === 5).length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>4 Stars</span>
                      <span>{reviews.filter(r => r.rating === 4).length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>3 Stars</span>
                      <span>{reviews.filter(r => r.rating === 3).length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Award className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold mb-1">98%</div>
                  <div className="text-muted-foreground mb-3">Satisfaction Rate</div>
                  <p className="text-sm text-muted-foreground">
                    Learners who would recommend you
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b last:border-b-0 pb-6 last:pb-0">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>{review.learnerAvatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium">{review.learnerName}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(review.date, 'MMM dd, yyyy')} • {review.sessionTopic}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="text-sm font-medium ml-1">{review.rating}</span>
                            </div>
                          </div>
                          <p className="text-muted-foreground">"{review.feedback}"</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}