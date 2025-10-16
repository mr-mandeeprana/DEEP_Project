import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Download,
  RefreshCw,
  Eye,
  Filter,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserCheck,
  FileText,
  Video,
  CreditCard,
  Trash2,
  Settings,
  BarChart3,
  Calendar,
  Clock
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_data?: any;
  new_data?: any;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

interface LogStats {
  totalLogs: number;
  todayLogs: number;
  errorLogs: number;
  userActions: number;
  systemActions: number;
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [logStats, setLogStats] = useState<LogStats>({
    totalLogs: 0,
    todayLogs: 0,
    errorLogs: 0,
    userActions: 0,
    systemActions: 0,
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      const auditLogs = data || [];

      // Calculate stats
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);

      const stats = {
        totalLogs: auditLogs.length,
        todayLogs: auditLogs.filter(log =>
          new Date(log.created_at) >= todayStart && new Date(log.created_at) <= todayEnd
        ).length,
        errorLogs: auditLogs.filter(log => log.action === 'ERROR' || log.action === 'DELETE').length,
        userActions: auditLogs.filter(log => !log.user_id.startsWith('system')).length,
        systemActions: auditLogs.filter(log => log.user_id.startsWith('system')).length,
      };

      setLogs(auditLogs);
      setLogStats(stats);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch audit logs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      INSERT: 'default',
      UPDATE: 'secondary',
      DELETE: 'destructive',
      LOGIN: 'default',
      LOGOUT: 'secondary',
      ERROR: 'destructive',
      APPROVE: 'default',
      REJECT: 'destructive',
      SUSPEND: 'destructive',
      UNSUSPEND: 'default',
    };

    const icons: Record<string, any> = {
      INSERT: CheckCircle,
      UPDATE: Settings,
      DELETE: Trash2,
      LOGIN: UserCheck,
      LOGOUT: XCircle,
      ERROR: AlertTriangle,
      APPROVE: CheckCircle,
      REJECT: XCircle,
      SUSPEND: AlertTriangle,
      UNSUSPEND: CheckCircle,
    };

    const IconComponent = icons[action] || Activity;

    return (
      <Badge variant={variants[action] || 'outline'} className="gap-1">
        <IconComponent className="w-3 h-3" />
        {action}
      </Badge>
    );
  };

  const getTableIcon = (tableName?: string) => {
    if (!tableName) return FileText;

    const icons: Record<string, any> = {
      profiles: UserCheck,
      community_posts: FileText,
      mentorship_sessions: Video,
      payments: CreditCard,
      user_roles: Shield,
      audit_logs: Activity,
    };

    return icons[tableName] || FileText;
  };

  const getFilteredLogs = () => {
    return logs.filter((log) => {
      const matchesSearch = searchTerm === '' ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.table_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.record_id?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesTable = tableFilter === 'all' || log.table_name === tableFilter;

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const logDate = new Date(log.created_at);
        const today = new Date();

        switch (dateFilter) {
          case 'today':
            matchesDate = logDate.toDateString() === today.toDateString();
            break;
          case 'yesterday':
            const yesterday = subDays(today, 1);
            matchesDate = logDate.toDateString() === yesterday.toDateString();
            break;
          case 'week':
            const weekAgo = subDays(today, 7);
            matchesDate = logDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = subDays(today, 30);
            matchesDate = logDate >= monthAgo;
            break;
        }
      }

      return matchesSearch && matchesAction && matchesTable && matchesDate;
    });
  };

  const filteredLogs = getFilteredLogs();

  const exportLogs = () => {
    const csvData = filteredLogs.map(log => ({
      Timestamp: format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      Action: log.action,
      Table: log.table_name || 'N/A',
      UserID: log.user_id,
      RecordID: log.record_id || 'N/A',
      IP: log.ip_address || 'N/A',
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getUniqueTables = () => {
    const tables = logs.map(log => log.table_name).filter(Boolean);
    return [...new Set(tables)];
  };

  const getUniqueActions = () => {
    const actions = logs.map(log => log.action);
    return [...new Set(actions)];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Audit Logs
          </h1>
          <p className="text-muted-foreground mt-2">Complete audit trail of all admin activities and system events</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchLogs} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button onClick={exportLogs} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{logStats.totalLogs}</p>
              <p className="text-sm text-muted-foreground">Total Logs</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{logStats.todayLogs}</p>
              <p className="text-sm text-muted-foreground">Today</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{logStats.errorLogs}</p>
              <p className="text-sm text-muted-foreground">Errors</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{logStats.userActions}</p>
              <p className="text-sm text-muted-foreground">User Actions</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Settings className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{logStats.systemActions}</p>
              <p className="text-sm text-muted-foreground">System Actions</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs" className="gap-2">
            <Activity className="w-4 h-4" />
            Activity Logs
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Advanced Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {getUniqueActions().map(action => (
                      <SelectItem key={action} value={action}>{action}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={tableFilter} onValueChange={setTableFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by table" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tables</SelectItem>
                    {getUniqueTables().map(table => (
                      <SelectItem key={table} value={table}>{table}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Activity Logs ({filteredLogs.length})</span>
                <Badge variant="outline">{filteredLogs.length} of {logs.length} shown</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No logs found</h3>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Record ID</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.slice(0, 50).map((log) => {
                      const TableIcon = getTableIcon(log.table_name);
                      return (
                        <TableRow key={log.id} className="hover:bg-gray-50">
                          <TableCell>{getActionBadge(log.action)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TableIcon className="w-4 h-4 text-muted-foreground" />
                              <span>{log.table_name || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              {log.user_id.substring(0, 8)}...
                            </span>
                          </TableCell>
                          <TableCell>
                            {log.record_id ? (
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {log.record_id.substring(0, 8)}...
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">
                                {format(new Date(log.created_at), 'MMM dd, yyyy')}
                              </div>
                              <div className="text-muted-foreground">
                                {format(new Date(log.created_at), 'HH:mm:ss')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedLog(log);
                                setIsDetailsDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
                <CardTitle>Activity Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Most Active Hour</span>
                    <span className="font-bold">2:00 PM - 3:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Peak Day</span>
                    <span className="font-bold">Wednesday</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Daily Logs</span>
                    <span className="font-bold">{Math.round(logStats.totalLogs / 30)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: 'UPDATE', count: logs.filter(l => l.action === 'UPDATE').length },
                    { action: 'INSERT', count: logs.filter(l => l.action === 'INSERT').length },
                    { action: 'LOGIN', count: logs.filter(l => l.action === 'LOGIN').length },
                    { action: 'DELETE', count: logs.filter(l => l.action === 'DELETE').length },
                  ].filter(item => item.count > 0).map((item) => (
                    <div key={item.action} className="flex justify-between">
                      <span>{item.action}</span>
                      <span className="font-bold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Security Alerts</h3>
              <p className="text-3xl font-bold text-red-600">0</p>
              <p className="text-sm text-muted-foreground">Active alerts</p>
            </Card>
            <Card className="p-6 text-center">
              <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed Logins</h3>
              <p className="text-3xl font-bold text-green-600">12</p>
              <p className="text-sm text-muted-foreground">Last 24 hours</p>
            </Card>
            <Card className="p-6 text-center">
              <UserCheck className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">IP Blocks</h3>
              <p className="text-3xl font-bold text-blue-600">2</p>
              <p className="text-sm text-muted-foreground">Active blocks</p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Log Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log Details</DialogTitle>
            <DialogDescription>
              Complete information for this audit log entry
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Action</Label>
                    <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Table</Label>
                    <p className="mt-1">{selectedLog.table_name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">User ID</Label>
                    <p className="mt-1 font-mono text-sm bg-gray-100 p-2 rounded">
                      {selectedLog.user_id}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Record ID</Label>
                    <p className="mt-1 font-mono text-sm bg-gray-100 p-2 rounded">
                      {selectedLog.record_id || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Timestamp</Label>
                    <p className="mt-1">{format(new Date(selectedLog.created_at), 'PPP p')}</p>
                  </div>
                  {selectedLog.ip_address && (
                    <div>
                      <Label className="text-sm font-medium">IP Address</Label>
                      <p className="mt-1 font-mono text-sm">{selectedLog.ip_address}</p>
                    </div>
                  )}
                  {selectedLog.user_agent && (
                    <div>
                      <Label className="text-sm font-medium">User Agent</Label>
                      <p className="mt-1 text-sm">{selectedLog.user_agent.substring(0, 100)}...</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedLog.old_data && (
                <div>
                  <Label className="text-sm font-medium">Previous Data</Label>
                  <pre className="mt-1 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_data && (
                <div>
                  <Label className="text-sm font-medium">New Data</Label>
                  <pre className="mt-1 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
