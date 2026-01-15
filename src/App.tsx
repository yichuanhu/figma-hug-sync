import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProcessDetail from "./pages/ProcessDetail";
import WorkerManagementPage from "./pages/WorkerManagementPage";
import WorkerCreate from "./pages/WorkerCreate";
import WorkerEdit from "./pages/WorkerEdit";

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
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
