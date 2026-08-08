import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const workflowLinks = [
  { href: "/design-hub", label: "Design Hub",   step: "01", emoji: "🎨" },
  { href: "/orders",     label: "Orders",        step: "02", emoji: "📋" },
  { href: "/production", label: "Production",    step: "03", emoji: "⚙️" },
  { href: "/plugin",     label: "Plugin",        step: "04", emoji: "🔌" },
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

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const isActive = (href: string) => location.pathname === href;
  const isHome = location.pathname === "/";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isHome ? "glass py-3" : "py-5 bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="text-xl font-black tracking-tight z-50 flex items-center gap-1">
          Fivenest<span className="text-primary">.</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {workflowLinks.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive(l.href)
                  ? "text-primary bg-primary/10 border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
              }`}
            >
              <span className="text-xs opacity-50 font-mono">{l.step}</span>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://designs.fivenest.in"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity glow-sm"
          >
            Browse Designs →
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden z-50 relative w-9 h-9 flex flex-col justify-center items-center gap-1.5 rounded-lg glass border border-border/40"
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-foreground transition-all duration-300 ${open ? "rotate-45 translate-y-[7px]" : ""}`} />
          <span className={`block w-5 h-0.5 bg-foreground transition-all duration-300 ${open ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-foreground transition-all duration-300 ${open ? "-rotate-45 -translate-y-[7px]" : ""}`} />
        </button>

        {/* Mobile full-screen menu */}
        <div
          className={`fixed inset-0 bg-background/97 backdrop-blur-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 md:hidden ${
            open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Mobile logo */}
          <div className="absolute top-5 left-6 text-xl font-black">
            Fivenest<span className="text-primary">.</span>
          </div>

          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Workflow</p>

          {workflowLinks.map((l, i) => (
            <Link
              key={l.href}
              to={l.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl w-64 transition-all duration-200 ${
                isActive(l.href)
                  ? "bg-primary/15 border border-primary/30 text-primary"
                  : "glass-card border border-border/30 text-foreground hover:border-primary/30"
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="text-2xl">{l.emoji}</span>
              <div>
                <div className="text-[10px] text-muted-foreground font-mono">Step {l.step}</div>
                <div className="font-bold">{l.label}</div>
              </div>
            </Link>
          ))}

          <a
            href="https://designs.fivenest.in"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-base glow-sm"
          >
            Browse Designs →
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
