import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Search, Wallet } from "lucide-react";

interface FAQItem {
  category: "wallet" | "compatibility" | "formats" | "branding" | "security";
  q: string;
  a: string;
}

const faqData: FAQItem[] = [
  // Wallet & Payments
  {
    category: "wallet",
    q: "When am I charged from my wallet balance?",
    a: "You are charged ONLY when 300 DPI print-ready files are successfully generated. Uploading Excel files, editing roster text, adjusting size tables, and viewing 3D jersey previews are 100% FREE.",
  },
  {
    category: "wallet",
    q: "Do wallet credits ever expire?",
    a: "No! Your wallet credits never expire. You can recharge any amount today and use it whenever production orders arrive—whether tomorrow or 6 months later.",
  },
  {
    category: "wallet",
    q: "Can I get a GST Tax Invoice for wallet recharges?",
    a: "Yes! Every wallet recharge automatically generates a GST-compliant tax invoice complete with your factory's GSTIN number for tax input credit claims.",
  },
  {
    category: "wallet",
    q: "Is Razorpay secure for wallet top-ups?",
    a: "Yes! Razorpay uses 256-bit bank-level SSL encryption. We support all Indian payment methods including GPay, PhonePe, Paytm, UPI, NetBanking, and major Debit/Credit cards.",
  },
  {
    category: "wallet",
    q: "Can I recharge any amount into my wallet?",
    a: "Yes! You can top up any custom amount starting from ₹100 onwards according to your factory's daily or weekly production volume.",
  },
  {
    category: "wallet",
    q: "What happens if file generation fails or is cancelled?",
    a: "If file generation is cancelled or encounters an error, FiveNest automatically issues an instant 100% credit refund back to your wallet balance immediately.",
  },
  {
    category: "wallet",
    q: "Are unused wallet credits refundable?",
    a: "Yes! If you ever wish to withdraw your unused wallet balance, simply contact our support team and unused funds will be refunded back to your original payment method.",
  },
  {
    category: "wallet",
    q: "Can multiple factory operators share one wallet?",
    a: "Yes! Multiple team members (Designers, Plotter Operators, Factory Managers) logged into your factory account can seamlessly share one central wallet balance.",
  },

  // Compatibility & Cloud
  {
    category: "compatibility",
    q: "Does FiveNest require any desktop software installation?",
    a: "No! FiveNest Web Studio is a 100% cloud-based web application that runs inside any modern browser (Chrome, Edge, Safari, Firefox) across Mac, Windows PC, Laptops, and Smartphones.",
  },
  {
    category: "compatibility",
    q: "Can I import vector files from CorelDraw?",
    a: "Yes! You can export your master vector patterns or graphics from CorelDraw as transparent PNGs or SVGs and upload them directly into FiveNest Web Studio for instant automatic nesting.",
  },
  {
    category: "compatibility",
    q: "Can I import Excel (.xlsx) and CSV (.csv) roster sheets?",
    a: "Yes! You can directly upload Excel (.xlsx) or CSV files, or copy-paste hand-written WhatsApp order photos, and our AI reader parses names, numbers, and sizes with zero typos.",
  },
  {
    category: "compatibility",
    q: "Does FiveNest support DTF (Direct-to-Film) printing as well as Sublimation?",
    a: "Yes! FiveNest works seamlessly for both Sublimation roll plotters and DTF film printers. You can toggle background transparent overlays and generate 300 DPI DTF chest/back prints in seconds.",
  },

  // File Formats & Output
  {
    category: "formats",
    q: "What resolution are exported print files?",
    a: "FiveNest exports at true commercial print resolution: 300 DPI (Dots Per Inch) at exact physical inch measurements, ensuring razor-sharp player text and vector graphics.",
  },
  {
    category: "formats",
    q: "Can I generate PNG files with transparent backgrounds?",
    a: "Yes! You can toggle between solid background patterns, transparent PNG overlays, and JPEG continuous roll layouts depending on your plotter or DTF film specs.",
  },
  {
    category: "formats",
    q: "How does continuous roll export work?",
    a: "FiveNest packs 92+ printable jersey panels (Front, Back, Left Sleeve, Right Sleeve) sequentially onto continuous sublimation paper roll widths (44\", 60\", or 64\") ready for instant RIP plotting.",
  },

  // Branding & Watermarking
  {
    category: "branding",
    q: "How does the 180° FiveNest Brand Watermark discount work?",
    a: "When the 180° upside-down FiveNest logo watermark is enabled at the bottom-right corner of front jersey panels, you receive a discounted rate of ₹3 / pc (vs ₹5 / pc standard).",
  },
  {
    category: "branding",
    q: "Can I use custom TTF / OTF sports fonts?",
    a: "Yes! You can upload custom TTF / OTF font files directly into FiveNest Web Studio, or select from built-in popular sports fonts (Impact, Montserrat, Jersey M54, College, etc.).",
  },
  {
    category: "branding",
    q: "How does the compact Size Tag (`40=2`) work?",
    a: "FiveNest automatically stamps compressed size tags (e.g. `40=2` for Size 40, Qty 2) in the top-left margin of every panel so your stitching team identifies sizes instantly.",
  },

  // Security & Artwork Privacy
  {
    category: "security",
    q: "Are my customer artwork files kept private and secure?",
    a: "Yes! All customer roster spreadsheets and uploaded vector artwork are encrypted using Supabase Row-Level Security (RLS). We never share, sell, or reuse customer files.",
  },
  {
    category: "security",
    q: "Is context-menu inspect element protection active on canvas renders?",
    a: "Yes! FiveNest disables right-click context menu inspection and image drag-and-drop on production canvas renders, protecting your custom patterns from unauthorized copying.",
  },
];

const FAQSection = () => {
  const [activeCategory, setActiveCategory] = useState<"all" | "wallet" | "compatibility" | "formats" | "branding" | "security">("all");
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqData.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch =
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="faq" className="py-24 md:py-36 relative overflow-hidden bg-slate-950/40">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 max-w-3xl mx-auto"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4 inline-block shadow-lg shadow-cyan-500/10">
            ❓ Frequently Asked Questions (Wallet & Production)
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Everything You Need to Know About <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              FiveNest Cloud Production & Wallet Billing
            </span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            Upfront answers regarding wallet recharges, GST invoices, Razorpay security, and plotter file generation.
          </p>
        </motion.div>

        {/* Search Input Bar */}
        <div className="max-w-2xl mx-auto mb-8 relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g. Wallet, GST, Razorpay, Refund, Corel, Excel, DTF)..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-xl"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12 max-w-3xl mx-auto">
          {[
            { id: "all", label: "All Questions" },
            { id: "wallet", label: "Wallet & Payments" },
            { id: "compatibility", label: "Cloud & Formats" },
            { id: "formats", label: "300 DPI Plotting" },
            { id: "branding", label: "Watermarks & Tags" },
            { id: "security", label: "Security & Privacy" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                activeCategory === cat.id
                  ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
                  : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No questions found matching "{searchQuery}". Try searching another keyword or contact us on WhatsApp!
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (idx % 10) * 0.04 }}
                  key={faq.q}
                  className={`rounded-2xl border transition-all duration-300 ${
                    isOpen
                      ? "bg-slate-900/90 border-cyan-500/40 shadow-lg shadow-cyan-500/5"
                      : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-sm md:text-base font-bold text-white flex items-center gap-3">
                      <HelpCircle size={18} className="text-cyan-400 flex-shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 transition-transform duration-300 flex-shrink-0 ${
                        isOpen ? "rotate-180 text-cyan-400" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="px-5 pb-5 pt-1 text-xs md:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
