import React, { useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import OrderManagement from './pages/OrderManagement';
import WebStudio from './pages/WebStudio';
import Contact from './pages/Contact';

// Scroll to top on route change (for non-studio pages)
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!pathname.startsWith('/production') && !pathname.startsWith('/studio')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pathname]);
  return null;
}

// Global Error Boundary to prevent blank white screens
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('FiveNest caught application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center p-6 text-center font-sans">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md border border-[#E8E4DE]">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 mx-auto flex items-center justify-center font-black text-xl mb-3">
              !
            </div>
            <h2 className="text-xl font-black text-[#171717] mb-2">Something went wrong</h2>
            <p className="text-sm text-[#71717A] mb-4">An error occurred while loading this page.</p>
            <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg mb-6 font-mono text-left overflow-auto max-h-32">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-[#E4572E] text-white rounded-xl font-bold hover:bg-[#D4431B] transition-colors cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Studio routes — standalone full viewport */}
          <Route path="/production" element={<WebStudio />} />
          <Route path="/production/*" element={<WebStudio />} />
          <Route path="/studio" element={<WebStudio />} />
          <Route path="/studio/*" element={<WebStudio />} />

          {/* Orders & Bills Management */}
          <Route path="/order-management" element={<OrderManagement />} />
          <Route path="/order-management/*" element={<OrderManagement />} />
          <Route path="/orders" element={<OrderManagement />} />
          <Route path="/orders/*" element={<OrderManagement />} />

          {/* Contact */}
          <Route path="/contact" element={<Contact />} />

          {/* Home */}
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
