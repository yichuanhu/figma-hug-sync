import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import Routers from "@/router/Routers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routers />
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
