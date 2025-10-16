import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Ban,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Calendar,
  Star,
  Shield,
  Settings,
  BarChart3,
  UserCheck,
  UserX
} from 'lucide-react';

// Mock data for admin panel
const mockMentorApplications = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    avatar: 'SJ',
    specialty: 'Meditation & Mindfulness',
    experience: '5 years',
    appliedDate: new Date('2024-12-15'),
    status: 'pending',
    documents: ['cv.pdf', 'certification.pdf'],
    bio: 'Certified meditation instructor with experience in corporate wellness programs.',
    rating: null,
    sessionsCount: 0
  },
  {
    id: '2',
    name: 'Dr. Michael Chen',
    email: 'michael.chen@example.com',
    avatar: 'MC',
    specialty: 'Psychology & Therapy',
    experience: '8 years',
    appliedDate: new Date('2024-12-10'),
    status: 'approved',
    documents: ['license.pdf', 'cv.pdf'],
    bio: 'Licensed psychologist specializing in cognitive behavioral therapy.',
    rating: 4.8,
    sessionsCount: 45
  },
  {
    id: '3',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    avatar: 'PS',
    specialty: 'Yoga Philosophy',
    experience: '6 years',
    appliedDate: new Date('2024-12-18'),
    status: 'rejected',
    documents: ['certificate.pdf'],
    bio: 'Yoga teacher with focus on traditional Indian philosophy.',
    rating: null,
    sessionsCount: 0,
    rejectionReason: 'Insufficient documentation'
  }
];

const mockSessions = [
  {
    id: '1',
    mentorName: 'Dr. Maya Patel',
    learnerName: 'John Doe',
    date: new Date('2024-12-20T14:00:00'),
    duration: 60,
    price: 120,
    status: 'completed',
    reported: false
  },
  {
    id: '2',
    mentorName: 'Swami Ravi Shankar',
    learnerName: 'Jane Smith',
    date: new Date('2024-12-22T10:00:00'),
    duration: 90,
    price: 150,
    status: 'in_progress',
    reported: false
  },
  {
    id: '3',
    mentorName: 'Dr. Arjun Sharma',
    learnerName: 'Bob Wilson',
    date: new Date('2024-12-19T16:00:00'),
    duration: 60,
    price: 110,
    status: 'completed',
    reported: true,
    reportReason: 'Session quality concerns'
  }
];

const mockDisputes = [
  {
    id: '1',
    sessionId: '3',
    reporter: 'Bob Wilson',
    mentor: 'Dr. Arjun Sharma',
    reason: 'Mentor was late and session was cut short',
    description: 'The mentor arrived 15 minutes late and ended the session early claiming technical issues.',
    status: 'open',
    dateReported: new Date('2024-12-19'),
    priority: 'medium'
  },
  {
    id: '2',
    sessionId: '1',
    reporter: 'John Doe',
    mentor: 'Dr. Maya Patel',
    reason: 'Billing dispute',
    description: 'Charged for session that was cancelled last minute.',
    status: 'resolved',
    dateReported: new Date('2024-12-18'),
    resolution: 'Refund processed',
    priority: 'high'
  }
];

export default function AdminMentorship() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('applications');
  const [applications, setApplications] = useState(mockMentorApplications);
  const [sessions] = useState(mockSessions);
  const [disputes, setDisputes] = useState(mockDisputes);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [disputeResolution, setDisputeResolution] = useState('');

  const handleApproveApplication = (applicationId: string) => {
    setApplications(prev =>
      prev.map(app =>
        app.id === applicationId
          ? { ...app, status: 'approved' }
          : app
      )
    );
    toast({
      title: "Application Approved",
      description: "Mentor application has been approved and the user notified.",
    });
  };

  const handleRejectApplication = (applicationId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    setApplications(prev =>
      prev.map(app =>
        app.id === applicationId
          ? { ...app, status: 'rejected', rejectionReason }
          : app
      )
    );

    setRejectionReason('');
    toast({
      title: "Application Rejected",
      description: "Mentor application has been rejected with feedback provided.",
    });
  };

  const handleResolveDispute = (disputeId: string) => {
    if (!disputeResolution.trim()) {
      toast({
        title: "Resolution Required",
        description: "Please provide a resolution for this dispute.",
        variant: "destructive",
      });
      return;
    }

    setDisputes(prev =>
      prev.map(dispute =>
        dispute.id === disputeId
          ? { ...dispute, status: 'resolved', resolution: disputeResolution }
          : dispute
      )
    );

    setDisputeResolution('');
    toast({
      title: "Dispute Resolved",
      description: "The dispute has been resolved and both parties notified.",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      case 'resolved': return 'default';
      case 'open': return 'secondary';
      default: return 'secondary';
    }
  };

  const pendingApplications = applications.filter(app => app.status === 'pending');
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const totalRevenue = sessions.reduce((sum, s) => sum + s.price, 0);
  const activeMentors = applications.filter(app => app.status === 'approved').length;

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-community" />
              <h1 className="text-2xl md:text-3xl font-bold">Mentorship Admin Panel</h1>
            </div>
          </div>
          <p className="text-sm md:text-lg text-muted-foreground">
            Manage mentor applications, monitor sessions, and resolve disputes
          </p>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <UserCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{activeMentors}</div>
              <div className="text-sm text-muted-foreground">Active Mentors</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{totalSessions}</div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">
                {disputes.filter(d => d.status === 'open').length}
              </div>
              <div className="text-sm text-muted-foreground">Open Disputes</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Applications</span>
              {pendingApplications.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {pendingApplications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="disputes" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Disputes</span>
              {disputes.filter(d => d.status === 'open').length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {disputes.filter(d => d.status === 'open').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications" className="mt-6">
            <div className="space-y-6">
              {applications.map((application) => (
                <Card key={application.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-gradient-hero text-white">
                            {application.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{application.name}</h3>
                          <p className="text-sm text-muted-foreground">{application.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{application.specialty}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {application.experience} experience
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(application.status)}>
                          {application.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowApplicationDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>

                    {application.status === 'pending' && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => handleApproveApplication(application.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const reason = prompt('Reason for rejection:');
                            if (reason) {
                              setRejectionReason(reason);
                              handleRejectApplication(application.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {application.status === 'rejected' && application.rejectionReason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {application.rejectionReason}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{totalSessions}</div>
                    <div className="text-sm text-muted-foreground">Total Sessions</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{completedSessions}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round((completedSessions / totalSessions) * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Completion Rate</div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                {sessions.map((session) => (
                  <Card key={session.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{session.mentorName} ↔ {session.learnerName}</p>
                            <p className="text-sm text-muted-foreground">
                              {session.date.toLocaleDateString()} • {session.duration} min • ${session.price}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            session.status === 'completed' ? 'default' :
                            session.status === 'in_progress' ? 'secondary' : 'outline'
                          }>
                            {session.status}
                          </Badge>
                          {session.reported && (
                            <Badge variant="destructive">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Reported
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Disputes Tab */}
          <TabsContent value="disputes" className="mt-6">
            <div className="space-y-6">
              {disputes.map((dispute) => (
                <Card key={dispute.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          dispute.priority === 'high' ? 'bg-red-100' :
                          dispute.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                        }`}>
                          <AlertTriangle className={`w-5 h-5 ${
                            dispute.priority === 'high' ? 'text-red-600' :
                            dispute.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">{dispute.reason}</p>
                          <p className="text-sm text-muted-foreground">
                            {dispute.reporter} vs {dispute.mentor}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(dispute.status)}>
                          {dispute.status}
                        </Badge>
                        <Badge variant={
                          dispute.priority === 'high' ? 'destructive' :
                          dispute.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {dispute.priority} priority
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDispute(dispute);
                            setShowDisputeDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {dispute.description}
                    </p>

                    <div className="text-xs text-muted-foreground">
                      Reported on {dispute.dateReported.toLocaleDateString()}
                    </div>

                    {dispute.status === 'open' && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => {
                            const resolution = prompt('Resolution details:');
                            if (resolution) {
                              setDisputeResolution(resolution);
                              handleResolveDispute(dispute.id);
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Resolve
                        </Button>
                        <Button variant="outline">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Contact Parties
                        </Button>
                      </div>
                    )}

                    {dispute.status === 'resolved' && dispute.resolution && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Resolution:</strong> {dispute.resolution}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Platform Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Revenue</span>
                      <span className="font-semibold">${totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Mentors</span>
                      <span className="font-semibold">{activeMentors}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Session Completion Rate</span>
                      <span className="font-semibold">
                        {Math.round((completedSessions / totalSessions) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Session Price</span>
                      <span className="font-semibold">
                        ${Math.round(totalRevenue / totalSessions)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Platform Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Pending Applications</span>
                      <span className="font-semibold">{pendingApplications.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Open Disputes</span>
                      <span className="font-semibold">
                        {disputes.filter(d => d.status === 'open').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Resolved Disputes</span>
                      <span className="font-semibold">
                        {disputes.filter(d => d.status === 'resolved').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Approval Rate</span>
                      <span className="font-semibold">
                        {Math.round((applications.filter(a => a.status === 'approved').length / applications.length) * 100)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Application Review Dialog */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Mentor Application</DialogTitle>
            <DialogDescription>
              Review the application details and supporting documents
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-gradient-hero text-white text-xl">
                    {selectedApplication.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedApplication.name}</h3>
                  <p className="text-muted-foreground">{selectedApplication.email}</p>
                  <Badge variant="outline" className="mt-1">
                    {selectedApplication.specialty}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Experience</Label>
                  <p className="text-sm">{selectedApplication.experience}</p>
                </div>
                <div>
                  <Label>Applied Date</Label>
                  <p className="text-sm">{selectedApplication.appliedDate.toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <Label>Bio</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedApplication.bio}
                </p>
              </div>

              <div>
                <Label>Documents</Label>
                <div className="flex gap-2 mt-2">
                  {selectedApplication.documents.map((doc: string, index: number) => (
                    <Button key={index} variant="outline" size="sm">
                      {doc}
                    </Button>
                  ))}
                </div>
              </div>

              {selectedApplication.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      handleApproveApplication(selectedApplication.id);
                      setShowApplicationDialog(false);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Application
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const reason = prompt('Reason for rejection:');
                      if (reason) {
                        setRejectionReason(reason);
                        handleRejectApplication(selectedApplication.id);
                        setShowApplicationDialog(false);
                      }
                    }}
                    className="flex-1 text-red-600 hover:text-red-700"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Application
                  </Button>
                </div>
              )}

              {selectedApplication.status !== 'pending' && (
                <Badge variant={getStatusBadgeVariant(selectedApplication.status)} className="w-fit">
                  {selectedApplication.status}
                </Badge>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dispute Review Dialog */}
      <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Dispute</DialogTitle>
            <DialogDescription>
              Review dispute details and take appropriate action
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-6">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-900">{selectedDispute.reason}</h3>
                </div>
                <p className="text-red-800">{selectedDispute.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reporter</Label>
                  <p className="text-sm font-medium">{selectedDispute.reporter}</p>
                </div>
                <div>
                  <Label>Mentor</Label>
                  <p className="text-sm font-medium">{selectedDispute.mentor}</p>
                </div>
                <div>
                  <Label>Date Reported</Label>
                  <p className="text-sm">{selectedDispute.dateReported.toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Badge variant={
                    selectedDispute.priority === 'high' ? 'destructive' :
                    selectedDispute.priority === 'medium' ? 'default' : 'secondary'
                  }>
                    {selectedDispute.priority}
                  </Badge>
                </div>
              </div>

              {selectedDispute.status === 'open' && (
                <div className="space-y-3">
                  <Label htmlFor="resolution">Resolution</Label>
                  <Textarea
                    id="resolution"
                    placeholder="Describe how this dispute was resolved..."
                    value={disputeResolution}
                    onChange={(e) => setDisputeResolution(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        handleResolveDispute(selectedDispute.id);
                        setShowDisputeDialog(false);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Resolved
                    </Button>
                    <Button variant="outline" onClick={() => setShowDisputeDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {selectedDispute.status === 'resolved' && selectedDispute.resolution && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Resolved</h3>
                  </div>
                  <p className="text-green-800">{selectedDispute.resolution}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}