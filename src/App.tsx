import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Success from "./pages/Success.tsx";
import NotFound from "./pages/NotFound.tsx";
import WebStudio from "./pages/WebStudio.tsx";
import Academy from "./pages/Academy.tsx";
import OrderManagement from "./pages/OrderManagement.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/success" element={<Success />} />
          <Route path="/studio" element={<WebStudio />} />
          <Route path="/studio/*" element={<WebStudio />} />
          <Route path="/orders" element={<OrderManagement />} />
          <Route path="/orders/*" element={<OrderManagement />} />
          <Route path="/academy" element={<Academy />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
