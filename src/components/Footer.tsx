const Footer = () => (
  <footer className="border-t border-border py-12">
    <div className="container mx-auto px-6 text-center">
      <div className="flex items-center justify-center gap-1.5 text-2xl font-bold mb-4">
        <img src="/logo.svg" alt="Fivenest Logo" className="h-8 w-auto object-contain -mr-2.5" />
        <span>Fivenest<span className="text-primary">.</span></span>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Automating jersey printing production for manufacturers across India.
      </p>
      <div className="flex justify-center gap-6 text-sm text-muted-foreground">
        <a href="#features" className="hover:text-foreground transition-colors">Features</a>
        <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
        <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
      </div>
      <div className="mt-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Fivenest. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
