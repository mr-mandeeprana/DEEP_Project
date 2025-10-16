import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { useRealtime } from "@/hooks/useRealtime";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { AdminLayout } from "./components/AdminLayout";
import { AuthProvider } from "./hooks/useAuth";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import SacredTexts from "./pages/SacredTexts";
import SearchPage from "./pages/SearchPage";
import CommunityFeed from "./pages/CommunityFeed";
import CreatePost from "./pages/CreatePost";
import MyNotes from "./pages/MyNotes";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import DailyWisdom from "./pages/DailyWisdom";
import Explore from "./pages/Explore";
import Learning from "./pages/Learning";
import CourseDetail from "./pages/CourseDetail";
import Mentorship from "./pages/Mentorship";
import VideoCall from "./pages/VideoCall";
import Payment from "./pages/Payment";
import Feedback from "./pages/Feedback";
import MentorDashboard from "./pages/MentorDashboard";
import Stories from "./pages/Stories";
import Settings from "./pages/Settings";
import Gamification from "./pages/Gamification";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminCourses from "./pages/admin/Courses";
import AdminSacredTexts from "./pages/admin/SacredTexts";
import AdminMedia from "./pages/admin/Media";
import AdminMentorship from "./pages/AdminMentorship";
import AdminAuditLogs from "./pages/admin/AuditLogs";
import AdminSettings from "./pages/admin/Settings";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const RealtimeSetup = () => {
  const { toast } = useToast();

  useRealtime({
    onPostUpdate: (payload) => {
      console.log('Post updated:', payload);
      // Handle post updates (likes, comments count changes, etc.)
      // You could trigger refetches or optimistic updates here
    },
    onCommentUpdate: (payload) => {
      console.log('Comment updated:', payload);
      // Handle new comments, updates, deletions
    },
    onLikeUpdate: (payload) => {
      console.log('Like updated:', payload);
      // Handle like/unlike events
    },
    onFollowUpdate: (payload) => {
      console.log('Follow updated:', payload);
      // Handle follow/unfollow events
      toast({
        title: payload.eventType === 'INSERT' ? 'New follower!' : 'Unfollowed',
        description: payload.eventType === 'INSERT'
          ? 'Someone started following you'
          : 'Someone unfollowed you',
      });
    },
    onMessageUpdate: (payload) => {
      console.log('Message updated:', payload);
      // Handle new messages
      if (payload.eventType === 'INSERT') {
        toast({
          title: 'New message',
          description: 'You have a new message',
        });
      }
    },
  });

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="wisdom-theme">
      <AuthProvider>
        <RealtimeSetup />
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/sacred-texts" element={
            <ProtectedRoute>
              <Layout>
                <SacredTexts />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/search" element={
            <ProtectedRoute>
              <Layout>
                <SearchPage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/communityfeed" element={
            <ProtectedRoute>
              <Layout>
                <CommunityFeed />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/create-post" element={
            <ProtectedRoute>
              <Layout>
                <CreatePost />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/my-notes" element={
            <ProtectedRoute>
              <Layout>
                <MyNotes />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/profile/:userId" element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute>
              <Layout>
                <Messages />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Layout>
                <Notifications />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/daily-wisdom" element={
            <ProtectedRoute>
              <Layout>
                <DailyWisdom />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/learning" element={
            <ProtectedRoute>
              <Layout>
                <Learning />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/course/:courseId" element={
            <ProtectedRoute>
              <Layout>
                <CourseDetail />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/mentorship" element={
            <ProtectedRoute>
              <Layout>
                <Mentorship />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/video-call" element={
            <ProtectedRoute>
              <VideoCall sessionId="demo" mentorName="Dr. Maya Patel" mentorAvatar="MP" onEndCall={() => window.close()} />
            </ProtectedRoute>
          } />
          <Route path="/payment" element={
            <ProtectedRoute>
              <Payment
                sessionId="demo"
                mentorName="Dr. Maya Patel"
                mentorAvatar="MP"
                sessionDate={new Date()}
                duration={60}
                price={120}
                topic="Mindfulness Session"
                onPaymentSuccess={() => window.close()}
                onCancel={() => window.close()}
              />
            </ProtectedRoute>
          } />
          <Route path="/feedback" element={
            <ProtectedRoute>
              <Feedback
                sessionId="demo"
                mentorId="1"
                mentorName="Dr. Maya Patel"
                mentorAvatar="MP"
                sessionDate={new Date()}
                sessionTopic="Mindfulness Session"
                onFeedbackSubmitted={(rating, feedback) => {
                  console.log('Feedback submitted:', { rating, feedback });
                  window.close();
                }}
                onCancel={() => window.close()}
              />
            </ProtectedRoute>
          } />
          <Route path="/mentor-dashboard" element={
            <ProtectedRoute>
              <MentorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/explore" element={
            <ProtectedRoute>
              <Layout>
                <Explore />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/stories" element={
            <ProtectedRoute>
              <Layout>
                <Stories />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/gamification" element={
            <ProtectedRoute>
              <Layout>
                <Gamification />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute requiredRole="viewer">
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute requiredRole="admin">
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/courses" element={
            <AdminRoute requiredRole="admin">
              <AdminLayout>
                <AdminCourses />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/texts" element={
            <AdminRoute requiredRole="admin">
              <AdminLayout>
                <AdminSacredTexts />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/media" element={
            <AdminRoute requiredRole="admin">
              <AdminLayout>
                <AdminMedia />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/mentorship" element={
            <AdminRoute requiredRole="admin">
              <AdminLayout>
                <AdminMentorship />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/logs" element={
            <AdminRoute requiredRole="viewer">
              <AdminLayout>
                <AdminAuditLogs />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/settings" element={
            <AdminRoute requiredRole="superadmin">
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </ThemeProvider>
</QueryClientProvider>
);

export default App;
