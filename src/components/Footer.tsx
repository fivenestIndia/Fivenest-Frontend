import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border/30 py-10">
    <div className="container mx-auto px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <div className="text-xl font-black mb-1">
            Fivenest<span className="text-primary">.</span>
          </div>
          <p className="text-sm text-muted-foreground">
            The complete jersey printing workflow — from design to print-ready files.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link to="/design-hub" className="hover:text-primary transition-colors">Design Hub</Link>
          <Link to="/orders" className="hover:text-foreground transition-colors">Orders</Link>
          <Link to="/production" className="hover:text-foreground transition-colors">Production</Link>
          <Link to="/plugin" className="hover:text-foreground transition-colors">Plugin</Link>
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-border/20 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Fivenest. All rights reserved. · Made for jersey printing manufacturers across India.
      </div>
    </div>
  </footer>
);

export default Footer;
