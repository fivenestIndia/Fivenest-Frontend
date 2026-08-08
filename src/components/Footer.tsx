import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border py-12">
    <div className="container mx-auto px-6 text-center">
      <div className="text-2xl font-bold mb-4">
        Fivenest<span className="text-primary">.</span>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Automating jersey printing production for manufacturers across India.
      </p>

      {/* Main website links */}
      <div className="flex justify-center flex-wrap gap-6 text-sm text-muted-foreground mb-4">
        <a href="/#features"     className="hover:text-foreground transition-colors">Features</a>
        <a href="/#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
        <a href="/#pricing"      className="hover:text-foreground transition-colors">Pricing</a>
        <a href="/#faq"          className="hover:text-foreground transition-colors">FAQ</a>
      </div>

      {/* Workflow tool links */}
      <div className="flex justify-center flex-wrap gap-6 text-sm mb-8">
        <Link to="/design-hub"  className="text-primary/80 hover:text-primary font-semibold transition-colors">🎨 Design Hub</Link>
        <Link to="/orders"      className="text-primary/80 hover:text-primary font-semibold transition-colors">📋 Orders</Link>
        <Link to="/production"  className="text-primary/80 hover:text-primary font-semibold transition-colors">⚙️ Production</Link>
        <Link to="/plugin"      className="text-primary/80 hover:text-primary font-semibold transition-colors">🔌 Plugin</Link>
      </div>

      <div className="text-xs text-muted-foreground">
        © {new Date().getFullYear()} Fivenest. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
