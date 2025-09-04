import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Mail, Calendar, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Profile = () => {
  const { profile, user } = useAuth();
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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
          <p className="text-muted-foreground">Visualize e gerencie suas informações pessoais</p>
        </div>
        <Button onClick={() => navigate('/app/profile/edit')}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Perfil
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url} alt={displayName} />
                <AvatarFallback className="bg-gradient-primary text-white text-lg font-medium">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl">{displayName}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2">
              <Badge variant={roleBadge.variant}>
                <Shield className="mr-1 h-3 w-3" />
                {roleBadge.label}
              </Badge>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Seus dados de perfil e configurações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Nome de Exibição</label>
                <p className="text-sm">{displayName}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="text-sm">{profile?.email || user?.email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Função
                </label>
                <Badge variant={roleBadge.variant} className="w-fit">
                  {roleBadge.label}
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Membro desde
                </label>
                <p className="text-sm">
                  {user?.created_at 
                    ? format(new Date(user.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : 'Data não disponível'
                  }
                </p>
              </div>
            </div>

            {profile?.bio && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Bio</label>
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
          <CardDescription>Detalhes técnicos da sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">ID do Usuário</label>
              <p className="text-xs font-mono bg-muted p-2 rounded">{user.id}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Último Login</label>
              <p className="text-sm">
                {user.last_sign_in_at 
                  ? format(new Date(user.last_sign_in_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                  : 'Nunca'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};