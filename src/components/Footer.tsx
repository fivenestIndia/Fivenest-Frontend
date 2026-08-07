const Footer = () => (
  <footer className="border-t border-border py-12">
    <div className="container mx-auto px-6 text-center">
      <div className="text-2xl font-bold mb-4">
        Fivenest<span className="text-primary">.</span>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Automating jersey printing production for manufacturers across India.
      </p>
      <div className="flex justify-center flex-wrap gap-6 text-sm text-muted-foreground">
        <a href="/#features" className="hover:text-foreground transition-colors">Features</a>
        <a href="/#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
        <a href="/#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        <a href="/design-hub" className="hover:text-primary text-primary/80 font-semibold transition-colors">Design Hub ✦</a>
      </div>
      <div className="mt-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Fivenest. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
