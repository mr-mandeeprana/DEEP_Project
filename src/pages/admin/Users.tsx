import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Search,
  Shield,
  UserCog,
  Download,
  Filter,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Ban,
  Unlock,
  Eye,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminRole } from '@/hooks/useAdminRole';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  credits: number;
  created_at: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
  is_suspended?: boolean;
  last_seen?: string;
  role?: 'admin' | 'mentor' | 'learner';
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'superadmin' | 'admin' | 'moderator' | 'viewer';
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  mentorsCount: number;
  learnersCount: number;
}

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    mentorsCount: 0,
    learnersCount: 0,
  });
  const [newUser, setNewUser] = useState({
    email: '',
    display_name: '',
    role: 'learner' as 'admin' | 'mentor' | 'learner',
    credits: 100,
  });
  const { isSuperAdmin } = useAdminRole();

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, []);

  const fetchUsers = async () => {
    try {
      const [profilesResult, rolesResult] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('*'),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (rolesResult.error) throw rolesResult.error;

      // Get emails from auth.users for each profile
      const profilesWithEmails = (profilesResult.data || []).map((profile) => ({
        ...profile,
        email: profile.email || 'No email available',
      }));

      setProfiles(profilesWithEmails);
      setUserRoles(rolesResult.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const profiles = await supabase.from('profiles').select('*');
      if (profiles.error) throw profiles.error;

      const data = profiles.data || [];
      const stats = {
        totalUsers: data.length,
        activeUsers: data.filter(p => p.last_seen && new Date(p.last_seen) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
        suspendedUsers: data.filter(p => p.is_suspended).length,
        mentorsCount: data.filter(p => p.role === 'mentor').length,
        learnersCount: data.filter(p => p.role === 'learner').length,
      };
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const getUserRole = (userId: string) => {
    return userRoles.find((r) => r.user_id === userId)?.role;
  };

  const getUserRoleType = (profile: Profile) => {
    const adminRole = getUserRole(profile.user_id);
    if (adminRole) return adminRole;
    return profile.role || 'learner';
  };

  const handleOpenRoleDialog = (profile: Profile) => {
    setSelectedUser(profile);
    setSelectedRole(getUserRole(profile.user_id) || '');
    setIsRoleDialogOpen(true);
  };

  const handleOpenUserDialog = (profile: Profile) => {
    setSelectedUser(profile);
    setIsUserDialogOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !isSuperAdmin) return;

    try {
      const existingRole = userRoles.find((r) => r.user_id === selectedUser.user_id);

      if (selectedRole === '') {
        // Remove role
        if (existingRole) {
          const { error } = await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', selectedUser.user_id);

          if (error) throw error;
        }
      } else {
        // Update or insert role
        if (existingRole) {
          const { error } = await supabase
            .from('user_roles')
            .update({ role: selectedRole as 'superadmin' | 'admin' | 'moderator' | 'viewer' })
            .eq('user_id', selectedUser.user_id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('user_roles')
            .insert([{ user_id: selectedUser.user_id, role: selectedRole as 'superadmin' | 'admin' | 'moderator' | 'viewer' }]);

          if (error) throw error;
        }
      }

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });

      fetchUsers();
      setIsRoleDialogOpen(false);
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const handleSuspendUser = async (profile: Profile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: !profile.is_suspended })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `User ${profile.is_suspended ? 'unsuspended' : 'suspended'} successfully`,
      });

      fetchUsers();
      fetchUserStats();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (profile: Profile) => {
    if (!confirm(`Are you sure you want to delete user ${profile.display_name}? This action cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });

      fetchUsers();
      fetchUserStats();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleCreateUser = async () => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: 'TempPass123!',
      });

      if (authError) throw authError;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          user_id: authData.user?.id,
          display_name: newUser.display_name,
          credits: newUser.credits,
          role: newUser.role,
        }]);

      if (profileError) throw profileError;

      toast({
        title: 'Success',
        description: 'User created successfully',
      });

      fetchUsers();
      fetchUserStats();
      setIsCreateUserDialogOpen(false);
      setNewUser({ email: '', display_name: '', role: 'learner', credits: 100 });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to create user',
        variant: 'destructive',
      });
    }
  };

  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch = profile.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || getUserRoleType(profile) === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && !profile.is_suspended) ||
                         (statusFilter === 'suspended' && profile.is_suspended);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role?: string) => {
    if (!role) return null;

    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      superadmin: 'destructive',
      admin: 'destructive',
      moderator: 'default',
      viewer: 'secondary',
      mentor: 'default',
      learner: 'outline',
    };

    const icons: Record<string, any> = {
      superadmin: Shield,
      admin: Shield,
      moderator: UserCog,
      viewer: Eye,
      mentor: UserCheck,
      learner: UserPlus,
    };

    const IconComponent = icons[role] || Shield;

    return (
      <Badge variant={variants[role] || 'secondary'}>
        <IconComponent className="h-3 w-3 mr-1" />
        {role}
      </Badge>
    );
  };

  const exportUsers = () => {
    const csvData = filteredProfiles.map(profile => ({
      Name: profile.display_name,
      Email: profile.email,
      Role: getUserRoleType(profile),
      Credits: profile.credits,
      Status: profile.is_suspended ? 'Suspended' : 'Active',
      Joined: format(new Date(profile.created_at), 'yyyy-MM-dd'),
      LastSeen: profile.last_seen ? format(new Date(profile.last_seen), 'yyyy-MM-dd') : 'Never'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-muted-foreground mt-2">Complete user lifecycle management and role-based access control</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchUsers} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          {isSuperAdmin && (
            <Button onClick={() => setIsCreateUserDialogOpen(true)} className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500">
              <UserPlus className="w-4 h-4" />
              Create User
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{userStats.totalUsers}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{userStats.activeUsers}</p>
              <p className="text-sm text-muted-foreground">Active (7d)</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <UserX className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{userStats.suspendedUsers}</p>
              <p className="text-sm text-muted-foreground">Suspended</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{userStats.mentorsCount}</p>
              <p className="text-sm text-muted-foreground">Mentors</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <UserPlus className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{userStats.learnersCount}</p>
              <p className="text-sm text-muted-foreground">Learners</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="gap-2">
            <UserCheck className="w-4 h-4" />
            User List
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <Shield className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="bulk-actions" className="gap-2">
            <Filter className="w-4 h-4" />
            Bulk Actions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                    <SelectItem value="learner">Learner</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={exportUsers} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Users ({filteredProfiles.length})</span>
                <Badge variant="outline">{filteredProfiles.length} of {profiles.length} shown</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                {profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{profile.display_name || 'Unknown User'}</p>
                              <p className="text-sm text-muted-foreground">{profile.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(getUserRoleType(profile))}</TableCell>
                        <TableCell>
                          <Badge variant={profile.is_suspended ? 'destructive' : 'default'}>
                            {profile.is_suspended ? 'Suspended' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-green-600" />
                            {profile.credits}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(profile.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {profile.last_seen
                            ? format(new Date(profile.last_seen), 'MMM dd, yyyy')
                            : <span className="text-muted-foreground">Never</span>
                          }
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleOpenUserDialog(profile)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {isSuperAdmin && (
                                <DropdownMenuItem onClick={() => handleOpenRoleDialog(profile)}>
                                  <UserCog className="w-4 h-4 mr-2" />
                                  Manage Role
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleSuspendUser(profile)}>
                                {profile.is_suspended ? (
                                  <>
                                    <Unlock className="w-4 h-4 mr-2" />
                                    Unsuspend
                                  </>
                                ) : (
                                  <>
                                    <Ban className="w-4 h-4 mr-2" />
                                    Suspend
                                  </>
                                )}
                              </DropdownMenuItem>
                              {isSuperAdmin && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteUser(profile)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Role Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { role: 'Learners', count: userStats.learnersCount, color: 'bg-blue-500' },
                    { role: 'Mentors', count: userStats.mentorsCount, color: 'bg-green-500' },
                    { role: 'Admins', count: userRoles.filter(r => r.role.includes('admin')).length, color: 'bg-purple-500' },
                  ].map((item) => (
                    <div key={item.role} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded ${item.color}`}></div>
                        <span>{item.role}</span>
                      </div>
                      <span className="font-semibold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Activity Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Active Users (Last 7 days)</span>
                    <span className="font-bold text-green-600">{userStats.activeUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Suspended Users</span>
                    <span className="font-bold text-red-600">{userStats.suspendedUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>User Retention Rate</span>
                    <span className="font-bold text-blue-600">
                      {userStats.totalUsers > 0 ? Math.round((userStats.activeUsers / userStats.totalUsers) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bulk-actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk User Operations</CardTitle>
              <CardDescription>
                Perform actions on multiple users at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Button variant="outline" className="gap-2">
                    <UserX className="w-4 h-4" />
                    Bulk Suspend Users
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Unlock className="w-4 h-4" />
                    Bulk Unsuspend Users
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Bulk Export
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Select users from the table above to perform bulk operations.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Management Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User Role</DialogTitle>
            <DialogDescription>
              Update the admin role for {selectedUser?.display_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Admin Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Admin Role</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedUser?.display_name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl">
                    {selectedUser.display_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.display_name}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-2">
                    {getRoleBadge(getUserRoleType(selectedUser))}
                    <Badge variant={selectedUser.is_suspended ? 'destructive' : 'default'}>
                      {selectedUser.is_suspended ? 'Suspended' : 'Active'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Credits</Label>
                    <p className="text-lg font-semibold">{selectedUser.credits}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Joined</Label>
                    <p>{format(new Date(selectedUser.created_at), 'PPP')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Seen</Label>
                    <p>{selectedUser.last_seen ? format(new Date(selectedUser.last_seen), 'PPP') : 'Never'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedUser.bio && (
                    <div>
                      <Label className="text-sm font-medium">Bio</Label>
                      <p className="text-sm">{selectedUser.bio}</p>
                    </div>
                  )}
                  {selectedUser.phone && (
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <p>{selectedUser.phone}</p>
                    </div>
                  )}
                  {selectedUser.location && (
                    <div>
                      <Label className="text-sm font-medium">Location</Label>
                      <p>{selectedUser.location}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={newUser.display_name}
                onChange={(e) => setNewUser(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={newUser.role} onValueChange={(value: 'admin' | 'mentor' | 'learner') => setNewUser(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="learner">Learner</SelectItem>
                  <SelectItem value="mentor">Mentor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="credits">Initial Credits</Label>
              <Input
                id="credits"
                type="number"
                value={newUser.credits}
                onChange={(e) => setNewUser(prev => ({ ...prev, credits: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
