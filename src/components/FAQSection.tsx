import { useState } from "react";

const faqs = [
  {
    q: "What is Fivenest and how does it work?",
    a: "Fivenest is a Photoshop plugin that automates jersey printing production. You upload a CSV with order details, and it automatically resizes, renames, and exports all files in minutes — replacing hours of manual work.",
  },
  {
    q: "Do I need Photoshop to use Fivenest?",
    a: "Yes, Fivenest runs as a plugin inside Adobe Photoshop. It works with Photoshop CC 2020 and above.",
  },
  {
    q: "How does the 7-day free trial work?",
    a: "You get full access to all features for 7 days. No credit card required. If you love it, choose a plan that fits your production volume.",
  },
  {
    q: "Can I upgrade or downgrade my plan later?",
    a: "Absolutely! You can switch plans anytime. Your new plan takes effect immediately and billing is adjusted accordingly.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major payment methods through Razorpay — UPI, credit/debit cards, net banking, and wallets.",
  },
  {
    q: "What if I need help setting it up?",
    a: "We provide WhatsApp support for all plans. Premium and Enterprise plans include priority and dedicated support with on-site training options.",
  },
  {
    q: "Is my license tied to one computer?",
    a: "Starter and Pro plans are single-device licenses. Premium supports multi-device, and Enterprise offers unlimited devices.",
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="glass-card rounded-xl overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full text-left px-6 py-4 flex items-center justify-between gap-4"
              >
                <span className="font-semibold text-sm sm:text-base">{faq.q}</span>
                <span
                  className={`text-primary text-xl shrink-0 transition-transform duration-300 ${
                    openIndex === i ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === i ? "max-h-40 pb-4" : "max-h-0"
                }`}
              >
                <p className="px-6 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
