import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

/* Original home page anchor links */
const homeLinks = [
  { href: "/#features",     label: "Features" },
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/#pricing",      label: "Pricing" },
  { href: "/#faq",          label: "FAQ" },
];

/* Workflow tool pages */
const toolLinks = [
  { href: "/design-hub", label: "Design Hub", emoji: "🎨" },
  { href: "/orders",     label: "Orders",     emoji: "📋" },
  { href: "/production", label: "Production", emoji: "⚙️" },
  { href: "/plugin",     label: "Plugin",     emoji: "🔌" },
];

const Navbar = () => {
  const [scrolled, setScrolled]   = useState(false);
  const [open, setOpen]           = useState(false);
  const location                  = useLocation();
  const isHome                    = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* Close mobile menu on navigation */
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const isActive = (href: string) => location.pathname === href;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isHome ? "glass py-3" : "py-5 bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="text-2xl font-black tracking-tight z-50 shrink-0">
          Fivenest<span className="text-primary">.</span>
        </Link>

        {/* ── Desktop nav ──────────────────────────────── */}
        <div className="hidden lg:flex items-center gap-1">
          {/* Original anchor links (only shown on home page) */}
          {isHome && homeLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface/60 transition-all"
            >
              {l.label}
            </a>
          ))}

          {/* Divider */}
          {isHome && (
            <div className="w-px h-4 bg-border/60 mx-2" />
          )}

          {/* Workflow tool pages */}
          {toolLinks.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive(l.href)
                  ? "text-primary bg-primary/10 border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <a
            href="/#pricing"
            className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity glow-sm"
          >
            Start Free Trial
          </a>
        </div>

        {/* ── Mobile hamburger ──────────────────────────── */}
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden z-50 w-9 h-9 flex flex-col justify-center items-center gap-1.5 rounded-lg glass border border-border/40"
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-foreground transition-all duration-300 ${open ? "rotate-45 translate-y-[7px]" : ""}`} />
          <span className={`block w-5 h-0.5 bg-foreground transition-all duration-300 ${open ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-foreground transition-all duration-300 ${open ? "-rotate-45 -translate-y-[7px]" : ""}`} />
        </button>

        {/* ── Mobile full-screen menu ───────────────────── */}
        <div
          className={`fixed inset-0 bg-background/97 backdrop-blur-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 lg:hidden ${
            open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Website sections */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Website</p>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {homeLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl glass-card border border-border/30 text-sm font-semibold text-foreground hover:border-primary/30 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Workflow tools */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Workflow Tools</p>
          {toolLinks.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl w-64 transition-all ${
                isActive(l.href)
                  ? "bg-primary/15 border border-primary/30 text-primary"
                  : "glass-card border border-border/30 text-foreground hover:border-primary/30"
              }`}
            >
              <span className="text-xl">{l.emoji}</span>
              <span className="font-bold">{l.label}</span>
            </Link>
          ))}

          <a
            href="/#pricing"
            onClick={() => setOpen(false)}
            className="mt-4 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold glow-sm"
          >
            Start Free Trial
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
