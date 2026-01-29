import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
// Development
import DevelopmentWorkbench from "@/pages/Development/DevelopmentWorkbench";
import ProcessDevelopment from "@/pages/Development/ProcessDevelopment";
import CredentialManagementPage from "@/pages/Development/CredentialManagement/CredentialManagementPage";
import ParameterManagementPage from "@/pages/Development/ParameterManagement/ParameterManagementPage";
import DevQueueManagementPage from "@/pages/Development/QueueManagement/QueueManagementPage";
// Operations
import OperationsWorkbench from "@/pages/Operations/OperationsWorkbench";
// Scheduling - Worker Management
import WorkerManagementPage from "@/pages/Scheduling/WorkerManagement/WorkerManagementPage";
// Scheduling - Credential Management
import SchedulingCredentialManagementPage from "@/pages/Scheduling/CredentialManagement/CredentialManagementPage";
// Scheduling - Process Management
import SchedulingProcessManagementPage from "@/pages/Scheduling/ProcessManagement/ProcessManagementPage";
// Scheduling - Parameter Management
import SchedulingParameterManagementPage from "@/pages/Scheduling/ParameterManagement/ParameterManagementPage";
// Scheduling - Queue Management
import SchedulingQueueManagementPage from "@/pages/Scheduling/QueueManagement/QueueManagementPage";
// Maintenance
import MaintenanceWorkbench from "@/pages/Maintenance/MaintenanceWorkbench";
// Requirements
import RequirementsWorkbench from "@/pages/Requirements/RequirementsWorkbench";
// Scheduling
import SchedulingWorkbench from "@/pages/Scheduling/SchedulingWorkbench";
// Personal Center
import PersonalCenter from "@/pages/PersonalCenter";
// Dev Preview
import EmptyStatePreview from "@/pages/DevPreview/EmptyStatePreview";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/process-development" element={<ProcessDevelopment />} />
        
        <Route path="/scheduling-center/resource-monitoring/worker-management" element={<WorkerManagementPage />} />
        <Route path="/development-workbench" element={<DevelopmentWorkbench />} />
        <Route path="/scheduling-workbench" element={<SchedulingWorkbench />} />
        <Route path="/operations-workbench" element={<OperationsWorkbench />} />
        <Route path="/requirements-workbench" element={<RequirementsWorkbench />} />
        <Route path="/maintenance-workbench" element={<MaintenanceWorkbench />} />
        
        {/* 凭据管理 - 开发中心入口 */}
        <Route path="/dev-center/business-assets/credentials" element={<CredentialManagementPage />} />
        {/* 凭据管理 - 调度中心入口 */}
        <Route path="/scheduling-center/business-assets/credentials" element={<SchedulingCredentialManagementPage />} />
        
        {/* 参数管理 - 开发中心入口 */}
        <Route path="/dev-center/business-assets/parameters" element={<ParameterManagementPage />} />
        {/* 参数管理 - 调度中心入口 */}
        <Route path="/scheduling-center/business-assets/parameters" element={<SchedulingParameterManagementPage />} />
        
        {/* 队列管理 - 开发中心入口 */}
        <Route path="/dev-center/business-assets/queues" element={<DevQueueManagementPage />} />
        {/* 队列管理 - 调度中心入口 */}
        <Route path="/scheduling-center/business-assets/queues" element={<SchedulingQueueManagementPage />} />
        
        {/* 自动化流程 - 调度中心入口 */}
        <Route path="/scheduling-center/execution-assets/automation-process" element={<SchedulingProcessManagementPage />} />
        
        {/* 个人中心 */}
        <Route path="/personal-center" element={<PersonalCenter />} />
        <Route path="/personal-center/personal-credentials" element={<PersonalCenter />} />
        <Route path="/personal-center/settings" element={<PersonalCenter />} />
        
        {/* 开发预览页面 */}
        <Route path="/dev-preview/empty-state" element={<EmptyStatePreview />} />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
