const TrustBadges = () => (
  <section className="py-16 border-t border-b border-border/50">
    <div className="container mx-auto px-6">
      <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
        {[
          { icon: "🔒", text: "Secure Payments via Razorpay" },
          { icon: "🏭", text: "1000+ Manufacturing Units" },
          { icon: "🇮🇳", text: "Made in India" },
          { icon: "⚡", text: "7-Day Free Trial" },
          { icon: "💬", text: "WhatsApp Support" },
        ].map((badge) => (
          <div key={badge.text} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-xl">{badge.icon}</span>
            <span className="font-medium">{badge.text}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustBadges;
