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
import { WorkflowExecutions } from "./pages/WorkflowExecutions";
import { Approvals } from "./pages/Approvals";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Components
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";

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
            <Route path="overview" element={<Overview />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id/board" element={<ProjectBoard />} />
            <Route path="workflows" element={<Workflows />} />
            <Route path="workflows/templates" element={<WorkflowTemplates />} />
            <Route path="workflows/executions" element={<WorkflowExecutions />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
