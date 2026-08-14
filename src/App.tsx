import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import DesignHub from "./pages/DesignHub.tsx";
import OrderManagement from "./pages/OrderManagement.tsx";
import Production from "./pages/Production.tsx";
import WebStudio from "./pages/WebStudio.tsx";
import Plugins from "./pages/Plugins.tsx";
import Academy from "./pages/Academy.tsx";
import Success from "./pages/Success.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/design-hub" element={<DesignHub />} />
          <Route path="/orders" element={<OrderManagement />} />
          <Route path="/orders/*" element={<OrderManagement />} />
          <Route path="/production" element={<Production />} />
          <Route path="/production/*" element={<Production />} />
          <Route path="/studio" element={<WebStudio />} />
          <Route path="/studio/*" element={<WebStudio />} />
          <Route path="/production-studio" element={<WebStudio />} />
          <Route path="/production-studio/*" element={<WebStudio />} />
          <Route path="/plugin" element={<Plugins />} />
          <Route path="/plugins" element={<Plugins />} />
          <Route path="/plugins/*" element={<Plugins />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/success" element={<Success />} />
          <Route path="/success/*" element={<Success />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
