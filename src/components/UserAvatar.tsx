import { User, LogOut, Settings } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

export const UserAvatar = () => {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url} alt={displayName} />
              <AvatarFallback className="bg-gradient-primary text-white font-medium">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {profile?.email || user?.email}
              </p>
              <Badge variant={roleBadge.variant} className="text-xs h-4 w-fit">
                {roleBadge.label}
              </Badge>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/app/profile')}>
            <User className="mr-2 h-4 w-4" />
            Perfil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/app/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};