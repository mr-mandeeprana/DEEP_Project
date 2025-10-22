import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  BookOpen,
  FileText,
  MessageSquare,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Shield,
  Activity,
  UserCheck,
  UserX,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  Award,
  Video,
  Star,
  CreditCard,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Search
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Stats {
  totalUsers: number;
  totalTexts: number;
  totalPosts: number;
  totalComments: number;
  totalMentors: number;
  totalLearners: number;
  totalSessions: number;
  totalRevenue: number;
  activeUsers: number;
  pendingMentors: number;
  totalCourses: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}

interface UserEngagement {
  date: string;
  users: number;
  sessions: number;
  revenue: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  short_description: string;
  instructor_name: string;
  category: string;
  tags: string[];
  duration_hours: number;
  total_lessons: number;
  difficulty_level: string;
  status: string;
  created_at: string;
  enrollment_count: number;
  rating: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalTexts: 0,
    totalPosts: 0,
    totalComments: 0,
    totalMentors: 0,
    totalLearners: 0,
    totalSessions: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingMentors: 0,
    totalCourses: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [engagementData, setEngagementData] = useState<UserEngagement[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
    fetchEngagementData();
    fetchCourses();
  }, []);

  const fetchStats = async () => {
    try {
      const [
        usersResult,
        textsResult,
        postsResult,
        commentsResult,
        mentorsResult,
        sessionsResult,
        revenueResult,
        activeUsersResult,
        pendingMentorsResult,
        coursesResult
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('sacred_texts').select('*', { count: 'exact', head: true }),
        supabase.from('community_posts').select('*', { count: 'exact', head: true }),
        supabase.from('post_comments').select('*', { count: 'exact', head: true }),
        supabase.from('mentors').select('*', { count: 'exact', head: true }),
        supabase.from('sessions').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount'),
        supabase.from('profiles').select('*').gt('last_seen', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('mentor_applications').select('*').eq('status', 'pending'),
        supabase.from('courses').select('*', { count: 'exact', head: true })
      ]);

      const totalRevenue = revenueResult.data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      const totalLearners = (usersResult.count || 0) - (mentorsResult.count || 0);

      setStats({
        totalUsers: usersResult.count || 0,
        totalTexts: textsResult.count || 0,
        totalPosts: postsResult.count || 0,
        totalComments: commentsResult.count || 0,
        totalMentors: mentorsResult.count || 0,
        totalLearners: totalLearners > 0 ? totalLearners : 0,
        totalSessions: sessionsResult.count || 0,
        totalRevenue,
        activeUsers: activeUsersResult.data?.length || 0,
        pendingMentors: pendingMentorsResult.data?.length || 0,
        totalCourses: coursesResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchRecentActivity = async () => {
    // Mock recent activity data - in real app, this would come from audit logs
    const mockActivity: RecentActivity[] = [
      {
        id: '1',
        type: 'user_registration',
        description: 'New user registered: John Doe',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        user: 'John Doe'
      },
      {
        id: '2',
        type: 'session_booked',
        description: 'Session booked: Mindfulness with Dr. Maya Patel',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        user: 'Jane Smith'
      },
      {
        id: '3',
        type: 'mentor_approved',
        description: 'Mentor application approved: Swami Ravi Shankar',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        user: 'Swami Ravi Shankar'
      }
    ];
    setRecentActivity(mockActivity);
  };

  const fetchEngagementData = async () => {
    // Mock engagement data for the last 7 days
    const mockData: UserEngagement[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      mockData.push({
        date: format(date, 'MMM dd'),
        users: Math.floor(Math.random() * 50) + 20,
        sessions: Math.floor(Math.random() * 20) + 5,
        revenue: Math.floor(Math.random() * 500) + 100
      });
    }
    setEngagementData(mockData);
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: '+12%'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: '+8%'
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      trend: '+15%'
    },
    {
      title: 'Sessions Booked',
      value: stats.totalSessions,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: '+22%'
    },
    {
      title: 'Verified Mentors',
      value: stats.totalMentors,
      icon: Award,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      trend: '+5%'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingMentors,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: null
    },
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      trend: '+12%'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration': return UserCheck;
      case 'session_booked': return Video;
      case 'mentor_approved': return Award;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_registration': return 'text-blue-600 bg-blue-50';
      case 'session_booked': return 'text-green-600 bg-green-50';
      case 'mentor_approved': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Comprehensive platform analytics and management overview</p>
        </div>
        <Button onClick={fetchStats} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  {stat.title}
                </CardTitle>
                {stat.trend && (
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">{stat.trend}</span>
                  </div>
                )}
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor} shadow-sm`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <PieChart className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="courses" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="w-4 h-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="moderation" className="gap-2">
            <Shield className="w-4 h-4" />
            Moderation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500" onClick={() => navigate('/admin/users')}>
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-semibold">User Management</p>
                  <p className="text-sm text-muted-foreground">Manage users & roles</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500" onClick={() => navigate('/admin/texts')}>
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-semibold">Content Moderation</p>
                  <p className="text-sm text-muted-foreground">Review & approve content</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500" onClick={() => navigate('/admin/mentorship')}>
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="font-semibold">Mentor Verification</p>
                  <p className="text-sm text-muted-foreground">Approve mentor applications</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500" onClick={() => navigate('/admin/courses')}>
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="font-semibold">Course Management</p>
                  <p className="text-sm text-muted-foreground">Manage learning courses</p>
                </div>
              </div>
            </Card>
          </div>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Server Uptime</span>
                    <span className="font-medium">99.9%</span>
                  </div>
                  <Progress value={99.9} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Database Health</span>
                    <span className="font-medium">98.5%</span>
                  </div>
                  <Progress value={98.5} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>API Response Time</span>
                    <span className="font-medium">245ms</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const IconComponent = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(activity.timestamp), 'MMM dd, yyyy • h:mm a')}
                        </p>
                      </div>
                      {activity.user && (
                        <Badge variant="secondary">{activity.user}</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Engagement Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                User Engagement (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {engagementData.map((day, index) => (
                  <div key={day.date} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium w-16">{day.date}</div>
                      <div className="flex gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span>{day.users} users</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-green-500" />
                          <span>{day.sessions} sessions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-500" />
                          <span>${day.revenue}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-20 bg-blue-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{width: `${(day.users / 70) * 100}%`}}></div>
                      </div>
                      <div className="w-20 bg-green-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{width: `${(day.sessions / 25) * 100}%`}}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Revenue Breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Sessions</span>
                    </div>
                    <span className="font-medium">$2,450</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Premium Content</span>
                    </div>
                    <span className="font-medium">$890</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span>Subscriptions</span>
                    </div>
                    <span className="font-medium">$1,200</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Growth Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>User Acquisition</span>
                      <span>+24%</span>
                    </div>
                    <Progress value={24} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Session Bookings</span>
                      <span>+18%</span>
                    </div>
                    <Progress value={18} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Revenue Growth</span>
                      <span>+31%</span>
                    </div>
                    <Progress value={31} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          {/* Course Management Quick Access */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Course Management Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/courses')}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Total Courses</p>
                      <p className="text-2xl font-bold">{courses.length}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Eye className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Published</p>
                      <p className="text-2xl font-bold text-green-600">
                        {courses.filter(c => c.status === 'published').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Edit className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Drafts</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {courses.filter(c => c.status === 'draft').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Enrollments</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {courses.reduce((sum, c) => sum + c.enrollment_count, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <Button className="gap-2" onClick={() => navigate('/admin/courses')}>
                  <Plus className="w-4 h-4" />
                  Create New Course
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => navigate('/admin/courses')}>
                  <BookOpen className="w-4 h-4" />
                  Manage Courses
                </Button>
                <Button variant="outline" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Course Analytics
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {courses.slice(0, 5).map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <p className="text-sm text-muted-foreground">by {course.instructor_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                        {course.status}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/courses`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {courses.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No courses created yet</p>
                    <Button className="mt-4 gap-2" onClick={() => navigate('/admin/courses')}>
                      <Plus className="w-4 h-4" />
                      Create Your First Course
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          {/* Audit Logs Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Audit Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { action: 'User Login', user: 'john.doe@example.com', timestamp: '2 minutes ago', ip: '192.168.1.1' },
                  { action: 'Session Booked', user: 'jane.smith@example.com', timestamp: '15 minutes ago', ip: '192.168.1.2' },
                  { action: 'Content Approved', user: 'admin@wisdom.com', timestamp: '1 hour ago', ip: '192.168.1.3' },
                  { action: 'Mentor Verified', user: 'admin@wisdom.com', timestamp: '2 hours ago', ip: '192.168.1.3' },
                  { action: 'Payment Processed', user: 'system@wisdom.com', timestamp: '3 hours ago', ip: '192.168.1.4' },
                  { action: 'Course Created', user: 'admin@wisdom.com', timestamp: '4 hours ago', ip: '192.168.1.3' }
                ].map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-muted-foreground">{log.user}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{log.timestamp}</p>
                      <p className="text-xs text-muted-foreground">{log.ip}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Full Audit Log
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-6">
          {/* Moderation Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Moderation Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: 'Post', content: 'Inappropriate content reported', author: 'user123', priority: 'High' },
                  { type: 'Comment', content: 'Spam comment detected', author: 'user456', priority: 'Medium' },
                  { type: 'Profile', content: 'Suspicious profile activity', author: 'user789', priority: 'Low' },
                  { type: 'Course', content: 'Course content review needed', author: 'instructor001', priority: 'Medium' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`w-5 h-5 ${item.priority === 'High' ? 'text-red-500' : item.priority === 'Medium' ? 'text-yellow-500' : 'text-blue-500'}`} />
                      <div>
                        <p className="font-medium">{item.type}: {item.content}</p>
                        <p className="text-sm text-muted-foreground">by {item.author}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={item.priority === 'High' ? 'destructive' : item.priority === 'Medium' ? 'default' : 'secondary'}>
                        {item.priority}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">12</div>
              <p className="text-sm text-muted-foreground">Pending Reviews</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">89</div>
              <p className="text-sm text-muted-foreground">Approved Today</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">5</div>
              <p className="text-sm text-muted-foreground">Rejected Today</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">96%</div>
              <p className="text-sm text-muted-foreground">Approval Rate</p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
