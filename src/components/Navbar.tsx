import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isDesignHub = location.pathname === "/design-hub";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass py-3" : "py-5 bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-6">
        <a href="/" className="text-2xl font-bold tracking-tight z-50">
          Fivenest<span className="text-primary">.</span>
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}

          {/* Design Hub link — highlighted */}
          <a
            href="/design-hub"
            className={`relative flex items-center gap-1.5 text-sm font-semibold transition-colors ${
              isDesignHub ? "text-primary" : "text-foreground hover:text-primary"
            }`}
          >
            Design Hub
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30 animate-pulse">
              New
            </span>
          </a>

          <a
            href="/#pricing"
            className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity glow-sm"
          >
            Start Free Trial
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden z-50 relative w-8 h-8 flex flex-col justify-center items-center gap-1.5"
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-foreground transition-all duration-300 ${open ? "rotate-45 translate-y-[4px]" : ""}`} />
          <span className={`block w-6 h-0.5 bg-foreground transition-all duration-300 ${open ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-foreground transition-all duration-300 ${open ? "-rotate-45 -translate-y-[4px]" : ""}`} />
        </button>

        {/* Mobile menu */}
        <div
          className={`fixed inset-0 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 transition-all duration-300 md:hidden ${
            open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-2xl font-semibold text-foreground hover:text-primary transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a
            href="/design-hub"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-2xl font-semibold text-primary"
          >
            Design Hub
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30">New</span>
          </a>
          <a
            href="/#pricing"
            onClick={() => setOpen(false)}
            className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-lg glow-sm"
          >
            Start Free Trial
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
