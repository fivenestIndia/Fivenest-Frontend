import React, { useEffect } from 'react';
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

function AppLayout() {
  const { pathname } = useLocation();
  const isStudio = pathname.startsWith('/production') || pathname.startsWith('/studio');

  // Studio page: render full-viewport without any wrapper
  if (isStudio) {
    return <WebStudio />;
  }

  // Normal pages: warm bg wrapper
  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#171717] selection:bg-[#E4572E]/20 selection:text-[#171717]">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/order-management" element={<OrderManagement />} />
        <Route path="/orders" element={<OrderManagement />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/production" element={<WebStudio />} />
        <Route path="/production/*" element={<WebStudio />} />
        <Route path="/studio" element={<WebStudio />} />
        <Route path="/studio/*" element={<WebStudio />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Studio — standalone full viewport, no global nav wrapper */}
        <Route path="/production" element={<AppLayout />} />
        <Route path="/production/*" element={<AppLayout />} />
        <Route path="/studio" element={<AppLayout />} />
        <Route path="/studio/*" element={<AppLayout />} />
        {/* All other pages */}
        <Route path="*" element={<AppLayout />} />
      </Routes>
    </Router>
  );
}
