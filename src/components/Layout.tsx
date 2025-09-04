import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { UserAvatar } from './UserAvatar';

export const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Sidebar />
      <div className="md:ml-64">
        <UserAvatar />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};