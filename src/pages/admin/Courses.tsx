import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Star,
  Clock,
  Search,
  Filter
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  short_description: string;
  instructor_id?: string;
  instructor_name: string;
  category: string;
  tags: string[];
  thumbnail_url?: string;
  duration_hours: number;
  total_lessons: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  review_count: number;
  enrollment_count: number;
  is_free: boolean;
  price_cents: number;
  status: string;
  created_at: string;
  prerequisites?: string[];
  learning_objectives?: string[];
}

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    instructor_name: '',
    category: '',
    tags: '',
    duration_hours: 0,
    total_lessons: 0,
    difficulty_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    is_free: true,
    price_cents: 0,
    status: 'draft',
    prerequisites: '',
    learning_objectives: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || course.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating course with formData:', formData);

    try {
      const courseData = {
        title: formData.title,
        description: formData.description,
        short_description: formData.short_description,
        instructor_name: formData.instructor_name,
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        duration_hours: formData.duration_hours,
        total_lessons: formData.total_lessons,
        difficulty_level: formData.difficulty_level,
        is_free: formData.is_free,
        price_cents: formData.price_cents,
        status: formData.status,
        rating: 0,
        review_count: 0,
        enrollment_count: 0,
        prerequisites: formData.prerequisites.split(',').map(p => p.trim()).filter(p => p.length > 0),
        learning_objectives: formData.learning_objectives.split(',').map(o => o.trim()).filter(o => o.length > 0),
      };

      console.log('Submitting courseData to Supabase:', courseData);

      const { data, error } = await supabase
        .from('courses')
        .insert([courseData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('Course created successfully:', data);

      setCourses(prev => [data, ...prev]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Course created successfully',
      });
    } catch (error: any) {
      console.error('Error creating course:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast({
        title: 'Error',
        description: error.message || 'Failed to create course',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        short_description: formData.short_description,
        instructor_name: formData.instructor_name,
        category: formData.category,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        duration_hours: formData.duration_hours,
        total_lessons: formData.total_lessons,
        difficulty_level: formData.difficulty_level,
        is_free: formData.is_free,
        price_cents: formData.price_cents,
        status: formData.status,
        prerequisites: formData.prerequisites.split(',').map(p => p.trim()).filter(p => p.length > 0),
        learning_objectives: formData.learning_objectives.split(',').map(o => o.trim()).filter(o => o.length > 0),
      };

      const { data, error } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', selectedCourse.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      setCourses(prev => prev.map(course =>
        course.id === selectedCourse.id ? data : course
      ));
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Course updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating course:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast({
        title: 'Error',
        description: error.message || 'Failed to update course',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      setCourses(prev => prev.filter(course => course.id !== courseId));
      toast({
        title: 'Success',
        description: 'Course deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete course',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (courseId: string, newStatus: string) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .update({ status: newStatus })
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;

      setCourses(prev => prev.map(course =>
        course.id === courseId ? data : course
      ));
      toast({
        title: 'Success',
        description: `Course ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`,
      });
    } catch (error: any) {
      console.error('Error updating course status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update course status',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      short_description: '',
      instructor_name: '',
      category: '',
      tags: '',
      duration_hours: 0,
      total_lessons: 0,
      difficulty_level: 'beginner',
      is_free: true,
      price_cents: 0,
      status: 'draft',
      prerequisites: '',
      learning_objectives: ''
    });
  };

  const openEditDialog = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      short_description: course.short_description,
      instructor_name: course.instructor_name,
      category: course.category,
      tags: course.tags?.join(', ') || '',
      duration_hours: course.duration_hours,
      total_lessons: course.total_lessons,
      difficulty_level: course.difficulty_level,
      is_free: course.is_free,
      price_cents: course.price_cents,
      status: course.status,
      prerequisites: course.prerequisites?.join(', ') || '',
      learning_objectives: course.learning_objectives?.join(', ') || ''
    });
    setIsEditDialogOpen(true);
  };

  const stats = {
    total: courses.length,
    published: courses.filter(c => c.status === 'published').length,
    draft: courses.filter(c => c.status === 'draft').length,
    totalEnrollments: courses.reduce((sum, c) => sum + c.enrollment_count, 0),
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Course Management</h1>
            <p className="text-muted-foreground">Manage and monitor all learning courses</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
              </DialogHeader>
              <CourseForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleCreateCourse}
                onCancel={() => setIsCreateDialogOpen(false)}
                submitLabel="Create Course"
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.published}</p>
                  <p className="text-sm text-muted-foreground">Published</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Edit className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.draft}</p>
                  <p className="text-sm text-muted-foreground">Drafts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalEnrollments}</p>
                  <p className="text-sm text-muted-foreground">Total Enrollments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Courses Table */}
        <Card>
          <CardHeader>
            <CardTitle>Courses ({filteredCourses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCourses.map((course) => (
                  <div key={course.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{course.title}</h3>
                          <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                            {course.status}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {course.difficulty_level}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{course.short_description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {course.duration_hours}h
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {course.total_lessons} lessons
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {course.enrollment_count} enrolled
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {course.rating.toFixed(1)} ({course.review_count})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {course.status === 'draft' ? (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(course.id, 'published')}
                          >
                            Publish
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(course.id, 'draft')}
                          >
                            Unpublish
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(course)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
            </DialogHeader>
            <CourseForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleUpdateCourse}
              onCancel={() => setIsEditDialogOpen(false)}
              submitLabel="Update Course"
            />
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

interface CourseFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  onCancel: () => void;
}

function CourseForm({ formData, setFormData, onSubmit, submitLabel, onCancel }: CourseFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="instructor_name">Instructor Name</Label>
          <Input
            id="instructor_name"
            value={formData.instructor_name}
            onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="short_description">Short Description</Label>
        <Textarea
          id="short_description"
          value={formData.short_description}
          onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Full Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prerequisites">Prerequisites (comma-separated)</Label>
        <Textarea
          id="prerequisites"
          value={formData.prerequisites}
          onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
          placeholder="Basic knowledge of HTML, Understanding of JavaScript fundamentals"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="learning_objectives">Learning Objectives (comma-separated)</Label>
        <Textarea
          id="learning_objectives"
          value={formData.learning_objectives}
          onChange={(e) => setFormData({ ...formData, learning_objectives: e.target.value })}
          placeholder="Master advanced React patterns, Build scalable web applications"
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration_hours">Duration (hours)</Label>
          <Input
            id="duration_hours"
            type="number"
            value={formData.duration_hours}
            onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="total_lessons">Total Lessons</Label>
          <Input
            id="total_lessons"
            type="number"
            value={formData.total_lessons}
            onChange={(e) => setFormData({ ...formData, total_lessons: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="difficulty_level">Difficulty</Label>
          <Select
            value={formData.difficulty_level}
            onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_free"
          checked={formData.is_free}
          onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
        />
        <Label htmlFor="is_free">Free Course</Label>
      </div>

      {!formData.is_free && (
        <div className="space-y-2">
          <Label htmlFor="price_cents">Price (cents)</Label>
          <Input
            id="price_cents"
            type="number"
            value={formData.price_cents}
            onChange={(e) => setFormData({ ...formData, price_cents: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}