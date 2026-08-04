import React, { Component, ErrorInfo, ReactNode } from "react";
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
import Plugins from "./pages/Plugins.tsx";
import OrderManagement from "./pages/OrderManagement.tsx";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class StudioErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in Studio:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", background: "#05070a", color: "#fff", minHeight: "100vh", fontFamily: "sans-serif" }}>
          <h2>⚠️ Production Studio Error Detected</h2>
          <p style={{ color: "#ff1744", marginTop: "10px" }}>{this.state.error?.toString()}</p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{ marginTop: "20px", padding: "10px 20px", background: "#00f0ff", color: "#000", fontWeight: "bold", border: "none", borderRadius: "6px", cursor: "pointer" }}
          >
            Clear Cache & Reload Studio
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient();

const App = () => (
  <StudioErrorBoundary>
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
            <Route path="/plugins" element={<Plugins />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </StudioErrorBoundary>
);

export default App;
