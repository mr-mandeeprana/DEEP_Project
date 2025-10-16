import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Home,
  BookOpen,
  Search,
  Users,
  Edit3,
  Notebook,
  Trophy,
  Settings,
  Sparkles,
  LogOut,
  Menu,
  MessageCircle as MessageCircleIcon,
  Sun,
  Compass,
  Bell,
  User,
  Camera,
  GraduationCap,
  Rss,
  Shield
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import SearchUsers from "@/components/SearchUsers";
import { ThemeToggle } from "@/components/ThemeToggle";

interface LayoutProps {
  children: ReactNode;
}

const navigationItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/sacred-texts", icon: BookOpen, label: "Sacred Texts" },
  { href: "/learning", icon: GraduationCap, label: "Learning" },
  { href: "/mentorship", icon: Users, label: "Mentorship" },
  { href: "/daily-wisdom", icon: Sun, label: "Daily Wisdom" },
  { href: "/stories", icon: Camera, label: "Stories" },
  { href: "/explore", icon: Compass, label: "Explore" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/communityfeed", icon: Rss, label: "Community Feed" },
  { href: "/messages", icon: MessageCircleIcon, label: "Messages" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/create-post", icon: Edit3, label: "Create Post" },
  { href: "/my-notes", icon: Notebook, label: "My Notes" },
  { href: "/gamification", icon: Trophy, label: "Gamification" },
  { href: "/settings", icon: User, label: "Settings" },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin, isSuperAdmin } = useAdminRole();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setUserProfile(data);
    };
    
    fetchUserProfile();
  }, [user]);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-4 md:p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-hero rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base md:text-lg text-sidebar-foreground">Deep</h1>
            <p className="text-xs md:text-sm text-muted-foreground hidden md:block">Spiritual Wisdom Platform</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 md:p-4 border-b border-sidebar-border">
        <SearchUsers />
      </div>

      {/* Navigation */}
      <div className="flex-1 p-3 md:p-4 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
            NAVIGATION
          </h2>
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 md:w-4 md:h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Progress Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
            YOUR PROGRESS
          </h2>
          <div className="space-y-3">
            <Link to="/gamification" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors">
              <Trophy className="w-5 h-5 md:w-4 md:h-4 text-yellow-500" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{userProfile?.credits || 0} Credits</span>
                  {isSuperAdmin && (
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">View gamification</p>
              </div>
            </Link>

            {/* Admin Panel Link */}
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors border border-primary/20 bg-primary/5">
                <Shield className="w-5 h-5 md:w-4 md:h-4 text-primary" />
                <div className="flex-1">
                  <span className="text-sm font-medium">Admin Panel</span>
                  <p className="text-xs text-muted-foreground">Manage platform</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-3 md:p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${user?.id}`} onClick={() => setMobileMenuOpen(false)}>
            <Avatar className="w-10 h-10 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarFallback className="bg-gradient-hero text-white font-semibold">
                {userProfile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/profile/${user?.id}`} onClick={() => setMobileMenuOpen(false)}>
              <p className="text-sm font-medium text-sidebar-foreground truncate hover:underline cursor-pointer">
                {userProfile?.display_name || user?.email || "User"}
              </p>
            </Link>
          </div>
          <div className="flex gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-sidebar-border bg-sidebar sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-hero rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-base text-sidebar-foreground">Deep</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 bg-sidebar">
              <div className="flex flex-col h-full">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-sidebar border-r border-sidebar-border flex-col">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}