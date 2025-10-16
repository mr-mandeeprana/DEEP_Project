import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Clock,
  Target,
  Award,
  BookOpen,
  Calendar,
  Trophy,
  Star
} from 'lucide-react';

interface LearningAnalyticsProps {
  userId: string;
}

export const LearningAnalytics = ({ userId }: LearningAnalyticsProps) => {
  // Mock data - in real app, this would come from the database
  const weeklyProgress = [
    { day: 'Mon', lessons: 2, time: 45 },
    { day: 'Tue', lessons: 1, time: 30 },
    { day: 'Wed', lessons: 3, time: 75 },
    { day: 'Thu', lessons: 2, time: 60 },
    { day: 'Fri', lessons: 1, time: 25 },
    { day: 'Sat', lessons: 4, time: 120 },
    { day: 'Sun', lessons: 2, time: 50 },
  ];

  const courseProgressData = [
    { name: 'Mindfulness', completed: 85, total: 100, color: '#3B82F6' },
    { name: 'Psychology', completed: 60, total: 100, color: '#10B981' },
    { name: 'Yoga', completed: 30, total: 100, color: '#F59E0B' },
  ];

  const quizPerformanceData = [
    { name: 'Excellent (90-100%)', value: 3, color: '#10B981' },
    { name: 'Good (80-89%)', value: 5, color: '#3B82F6' },
    { name: 'Fair (70-79%)', value: 2, color: '#F59E0B' },
    { name: 'Needs Improvement (<70%)', value: 1, color: '#EF4444' },
  ];

  const achievements = [
    { name: 'First Lesson', date: '2024-01-15', icon: '🎓' },
    { name: 'Week Warrior', date: '2024-01-20', icon: '🔥' },
    { name: 'Mindful Master', date: '2024-01-25', icon: '🧘' },
    { name: 'Knowledge Seeker', date: '2024-02-01', icon: '📚' },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                <p className="text-3xl font-bold">8</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lessons Completed</p>
                <p className="text-3xl font-bold">156</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hours Learned</p>
                <p className="text-3xl font-bold">42.5</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Certificates Earned</p>
                <p className="text-3xl font-bold">3</p>
              </div>
              <Award className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Weekly Learning Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  name === 'lessons' ? `${value} lessons` : `${value} minutes`,
                  name === 'lessons' ? 'Lessons' : 'Time'
                ]}
              />
              <Bar dataKey="lessons" fill="#3B82F6" name="lessons" />
              <Bar dataKey="time" fill="#10B981" name="time" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Course Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {courseProgressData.map((course) => (
              <div key={course.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{course.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {course.completed}/{course.total} lessons
                  </span>
                </div>
                <Progress value={(course.completed / course.total) * 100} className="h-2" />
                <div className="text-right text-sm text-muted-foreground">
                  {Math.round((course.completed / course.total) * 100)}% complete
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quiz Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Quiz Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={quizPerformanceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${value}`}
                >
                  {quizPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {quizPerformanceData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Streaks and Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Learning Streaks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">12</div>
                <p className="text-muted-foreground">Current Streak (days)</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">28</div>
                <p className="text-muted-foreground">Longest Streak</p>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Last 30 days</p>
                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: 30 }, (_, i) => (
                    <div
                      key={i}
                      className={`aspect-square rounded ${
                        i < 12 ? 'bg-orange-400' : 'bg-gray-200'
                      }`}
                      title={i < 12 ? 'Active learning day' : 'Inactive'}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <p className="font-medium">{achievement.name}</p>
                    <p className="text-sm text-muted-foreground">Earned on {achievement.date}</p>
                  </div>
                  <Star className="w-5 h-5 text-yellow-500" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Study Time Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Study Time Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} minutes`, 'Study Time']} />
              <Line
                type="monotone"
                dataKey="time"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};