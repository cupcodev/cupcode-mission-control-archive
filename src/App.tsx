import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import { Login } from "./pages/Login";
import { Overview } from "./pages/Overview";
import { Projects } from "./pages/Projects";
import { ProjectBoard } from "./pages/ProjectBoard";
import { Workflows } from "./pages/Workflows";
import { WorkflowTemplates } from "./pages/WorkflowTemplates";
import { WorkflowTemplateNew } from "./pages/WorkflowTemplateNew";
import { WorkflowExecutions } from "./pages/WorkflowExecutions";
import { WorkflowInstanceBoard } from "./pages/WorkflowInstanceBoard";
import { TaskDetail } from "./components/workflows/TaskDetail";
import { Approvals } from "./pages/Approvals";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { Team } from "./pages/Team";
import { UserManagement } from "./pages/UserManagement";
import { ClientManagement } from "./pages/ClientManagement";
import { Integrations } from "./pages/Integrations";
import { AuditLog } from "./pages/AuditLog";
import { Clients } from "./pages/Clients";
import { Profile } from "./pages/Profile";
import { EditProfile } from "./pages/EditProfile";
import { Calendar } from "./pages/Calendar";
import NotFound from "./pages/NotFound";

// Components
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RequireRole } from "./components/RequireRole";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Redirect root to overview */}
          <Route path="/" element={<Navigate to="/app/overview" replace />} />
          
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected app routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Routes accessible to all authenticated users */}
            <Route path="overview" element={<Overview />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id/board" element={<ProjectBoard />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="workflows/instances" element={<WorkflowExecutions />} />
            <Route path="workflows/instances/:id/board" element={<WorkflowInstanceBoard />} />
            <Route path="tasks/:id" element={<TaskDetail />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/:clientId" element={<Clients />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/edit" element={<EditProfile />} />
            
            {/* Admin+ restricted routes */}
            <Route 
              path="workflows/templates" 
              element={
                <RequireRole minRole="admin">
                  <WorkflowTemplates />
                </RequireRole>
              } 
            />
            <Route 
              path="workflows/templates/new" 
              element={
                <RequireRole minRole="admin">
                  <WorkflowTemplateNew />
                </RequireRole>
              } 
            />
            <Route 
              path="team" 
              element={
                <RequireRole minRole="admin">
                  <Team />
                </RequireRole>
              } 
            />
            <Route 
              path="user-management" 
              element={
                <RequireRole minRole="admin">
                  <UserManagement />
                </RequireRole>
              } 
            />
            <Route 
              path="client-management" 
              element={
                <RequireRole minRole="admin">
                  <ClientManagement />
                </RequireRole>
              } 
            />
            <Route 
              path="reports" 
              element={
                <RequireRole minRole="admin">
                  <Reports />
                </RequireRole>
              } 
            />
            <Route 
              path="settings" 
              element={
                <RequireRole minRole="admin">
                  <Settings />
                </RequireRole>
              } 
            />
            <Route 
              path="integrations" 
              element={
                <RequireRole minRole="admin">
                  <Integrations />
                </RequireRole>
              } 
            />
            <Route 
              path="audit-log" 
              element={
                <RequireRole minRole="admin">
                  <AuditLog />
                </RequireRole>
              } 
            />
            
            {/* Legacy route for backwards compatibility */}
            <Route path="workflows" element={<Workflows />} />
          </Route>
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
