import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  GitBranch, 
  CheckSquare, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  Plug,
  Shield,
  UserCheck,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useApprovalCount } from '@/hooks/useApprovalCount';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  dynamicBadge?: boolean;
  adminOnly?: boolean;
  submenu?: Array<{
    name: string;
    href: string;
    adminOnly?: boolean;
  }>;
}

const navigation: NavItem[] = [
  {
    name: 'Overview',
    href: '/app/overview',
    icon: LayoutDashboard,
  },
  {
    name: 'Projetos',
    href: '/app/projects',
    icon: FolderKanban,
  },
  {
    name: 'Clientes',
    href: '/app/clients',
    icon: UserCheck,
  },
  {
    name: 'Calendário',
    href: '/app/calendar',
    icon: Calendar,
  },
  {
    name: 'Aprovações',
    href: '/app/approvals',
    icon: CheckSquare,
    dynamicBadge: true,
  },
  {
    name: 'Workflows',
    href: '/app/workflows',
    icon: GitBranch,
    submenu: [
      { name: 'Templates', href: '/app/workflows/templates', adminOnly: true },
      { name: 'Execuções', href: '/app/workflows/instances' },
    ]
  },
  {
    name: 'Equipe',
    href: '/app/team',
    icon: Users,
    adminOnly: true,
    submenu: [
      { name: 'Papéis & Membros', href: '/app/team' },
      { name: 'Usuários', href: '/app/user-management', adminOnly: true },
      { name: 'Clientes', href: '/app/team?tab=clients', adminOnly: true },
    ]
  },
  {
    name: 'Relatórios',
    href: '/app/reports',
    icon: BarChart3,
    adminOnly: true,
  },
  {
    name: 'Integrações',
    href: '/app/integrations',
    icon: Plug,
    adminOnly: true,
  },
  {
    name: 'Configurações',
    href: '/app/settings',
    icon: Settings,
    adminOnly: true,
  },
  {
    name: 'Log de Auditoria',
    href: '/app/audit-log',
    icon: Shield,
    adminOnly: true,
  },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { profile } = useAuth();
  const { count: approvalCount } = useApprovalCount();

  const userRole = profile?.role || 'user';
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  const isActive = (href: string) => {
    if (href === '/app/overview') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const filteredNavigation = navigation.filter(item => !item.adminOnly || isAdmin);

  return (
    <div
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-gradient-subtle border-r border-border transition-all duration-300',
        'hidden md:block', // Hide on mobile, show on desktop
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MC</span>
            </div>
            <span className="font-tomorrow font-bold text-lg bg-gradient-brand bg-clip-text text-transparent">
              Mission Control
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="px-2 py-4 space-y-1">
        {filteredNavigation.map((item) => (
          <div key={item.name}>
            <NavLink
              to={item.href}
              className={({ isActive: navActive }) =>
                cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  'hover:bg-muted/50 hover:text-foreground',
                  (navActive || isActive(item.href))
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground',
                  collapsed ? 'justify-center' : 'justify-start'
                )
              }
            >
              <item.icon className={cn('h-5 w-5', !collapsed && 'mr-3')} />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.name}</span>
                  {item.adminOnly && (
                    <Badge variant="outline" className="text-xs ml-1">
                      Admin
                    </Badge>
                  )}
                  {item.badge && !item.adminOnly && (
                    <Badge variant="secondary" className="text-xs ml-1">
                      {item.badge}
                    </Badge>
                  )}
                  {item.dynamicBadge && approvalCount > 0 && !item.adminOnly && (
                    <Badge variant="secondary" className="text-xs ml-1">
                      {approvalCount}
                    </Badge>
                  )}
                </>
              )}
            </NavLink>
            
            {/* Submenu */}
            {item.submenu && !collapsed && isActive(item.href) && (
              <div className="ml-6 mt-1 space-y-1">
                {item.submenu
                  .filter(subItem => !subItem.adminOnly || isAdmin)
                  .map((subItem) => (
                  <NavLink
                    key={subItem.name}
                    to={subItem.href}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center px-3 py-1 text-xs font-medium rounded-md transition-colors',
                        'hover:bg-muted/50',
                        isActive
                          ? 'text-primary bg-primary/5'
                          : 'text-muted-foreground'
                      )
                    }
                  >
                    <span className="flex-1">{subItem.name}</span>
                    {subItem.adminOnly && (
                      <Badge variant="outline" className="text-xs ml-1">
                        Admin
                      </Badge>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};