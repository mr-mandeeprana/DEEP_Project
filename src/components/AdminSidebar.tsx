import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Image,
  Settings,
  FileText,
  GraduationCap,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAdminRole } from '@/hooks/useAdminRole';

const menuItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard, minRole: 'viewer' as const },
  { title: 'Users', url: '/admin/users', icon: Users, minRole: 'admin' as const },
  { title: 'Courses', url: '/admin/courses', icon: GraduationCap, minRole: 'admin' as const },
  { title: 'Sacred Texts', url: '/admin/texts', icon: BookOpen, minRole: 'admin' as const },
  { title: 'Media', url: '/admin/media', icon: Image, minRole: 'admin' as const },
  { title: 'Audit Logs', url: '/admin/logs', icon: FileText, minRole: 'viewer' as const },
  { title: 'Settings', url: '/admin/settings', icon: Settings, minRole: 'superadmin' as const },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const { hasRole } = useAdminRole();

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50';

  const filteredItems = menuItems.filter(item => hasRole(item.minRole));
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={isCollapsed ? 'w-14' : 'w-60'}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
