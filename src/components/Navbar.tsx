import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface NavbarProps {
  title: string;
}

export const Navbar = ({ title }: NavbarProps) => {
  const { profile, user, signOut } = useAuth();

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Usuário';
  const userRole = profile?.role || 'user';

  const getRoleBadge = (role: string) => {
    const roleMap = {
      superadmin: { label: 'Super Admin', variant: 'destructive' as const },
      admin: { label: 'Admin', variant: 'secondary' as const },
      manager: { label: 'Manager', variant: 'outline' as const },
      user: { label: 'Usuário', variant: 'outline' as const },
    };
    
    return roleMap[role as keyof typeof roleMap] || roleMap.user;
  };

  const roleBadge = getRoleBadge(userRole);

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 z-30 h-16 bg-background/80 backdrop-blur-glass border-b border-border">
      <div className="flex h-full items-center justify-between px-6">
        {/* Title */}
        <div>
          <h1 className="text-xl font-tomorrow font-semibold text-foreground">
            {title}
          </h1>
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 h-9">
                  <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{displayName}</span>
                    <Badge variant={roleBadge.variant} className="text-xs h-4">
                      {roleBadge.label}
                    </Badge>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile?.email || user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};