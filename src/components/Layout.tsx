import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useLocation } from 'react-router-dom';

const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    '/app/overview': 'Overview',
    '/app/projects': 'Projetos',
    '/app/workflows': 'Workflows',
    '/app/workflows/templates': 'Templates de Workflow',
    '/app/workflows/executions': 'Execuções de Workflow',
    '/app/approvals': 'Aprovações',
    '/app/reports': 'Relatórios',
    '/app/settings': 'Configurações',
  };

  // Handle dynamic routes like /app/projects/:id/board
  if (pathname.includes('/projects/') && pathname.includes('/board')) {
    const projectId = pathname.split('/')[3];
    return `Board do Projeto ${projectId}`;
  }
  
  // Handle workflow instance board routes like /app/workflows/instances/:id/board
  if (pathname.includes('/workflows/instances/') && pathname.includes('/board')) {
    const instanceId = pathname.split('/')[4];
    return `Board da Instância`;
  }

  return routes[pathname] || 'Mission Control';
};

export const Layout = () => {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar title={title} />
        <main className="pt-16 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};