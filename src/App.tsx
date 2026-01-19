import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
// Development
import { DevelopmentWorkbench, ProcessDetail } from "./pages/Development";
// Operations
import { OperationsWorkbench, WorkerManagementPage, WorkerCreate, WorkerEdit } from "./pages/Operations";
// Maintenance
import { MaintenanceWorkbench } from "./pages/Maintenance";
// Requirements
import { RequirementsWorkbench } from "./pages/Requirements";
// Scheduling
import { SchedulingWorkbench } from "./pages/Scheduling";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/process-development" element={<Index />} />
        <Route path="/process-detail/:id" element={<ProcessDetail />} />
        <Route path="/worker-management" element={<WorkerManagementPage />} />
        <Route path="/worker-management/create" element={<WorkerCreate />} />
        <Route path="/worker-management/edit/:id" element={<WorkerEdit />} />
        <Route path="/development-workbench" element={<DevelopmentWorkbench />} />
        <Route path="/scheduling-workbench" element={<SchedulingWorkbench />} />
        <Route path="/operations-workbench" element={<OperationsWorkbench />} />
        <Route path="/requirements-workbench" element={<RequirementsWorkbench />} />
        <Route path="/maintenance-workbench" element={<MaintenanceWorkbench />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
