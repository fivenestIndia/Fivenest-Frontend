import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Search, Sparkles } from "lucide-react";

interface FAQItem {
  category: "compatibility" | "formats" | "branding" | "licensing";
  q: string;
  a: string;
}

const faqData: FAQItem[] = [
  // Compatibility & System
  {
    category: "compatibility",
    q: "Can I use CorelDraw files with FiveNest Web Studio?",
    a: "Yes! You can export your master vector patterns or graphics from CorelDraw as transparent PNGs or SVGs and upload them directly into FiveNest Web Studio for instant automatic nesting and grading.",
  },
  {
    category: "compatibility",
    q: "Which Photoshop versions are compatible with FiveNest exported assets?",
    a: "FiveNest Web Studio generates universal 300 DPI print-ready JPEG, PNG, and PDF files that are 100% compatible with all Adobe Photoshop versions (CS6, CC 2018 through CC 2026), as well as Illustrator, CorelDraw, and RIP software.",
  },
  {
    category: "compatibility",
    q: "Can I import Excel (.xlsx) and CSV (.csv) roster files?",
    a: "Yes! You can directly upload Excel (.xlsx) or CSV files, or copy-paste raw columns. You can also paste hand-written roster image notes from WhatsApp, and our AI cleaner will automatically parse names, numbers, and sizes.",
  },
  {
    category: "compatibility",
    q: "Does FiveNest work on Mac, Windows, and Laptops?",
    a: "Yes! FiveNest Web Studio runs directly inside any modern web browser (Google Chrome, Microsoft Edge, Safari, Firefox) across Mac, Windows PC, Laptops, Tablets, and Smartphones without requiring heavy desktop installations.",
  },
  {
    category: "compatibility",
    q: "Does it support DTF (Direct-to-Film) printing as well as Sublimation?",
    a: "Yes! FiveNest works seamlessly for both Sublimation roll plotters and DTF film printers. You can toggle background transparent overlays and generate 300 DPI DTF chest/back prints in seconds.",
  },
  {
    category: "compatibility",
    q: "Can I run FiveNest Web Studio in Offline mode?",
    a: "Once loaded in your browser tab, FiveNest processes raster nesting and 300 DPI canvas exports using client-side Web Workers, ensuring high-speed processing even during intermittent internet connectivity.",
  },
  {
    category: "compatibility",
    q: "What sublimation plotters are supported?",
    a: "All major commercial sublimation roll plotters including Epson SureColor, Mimaki TS300P, Roland Texart, Mutoh ValueJet, and Chinese 2-head / 4-head sublimation printers.",
  },
  {
    category: "compatibility",
    q: "Can I use custom size grading tables for kids and adults?",
    a: "Yes! You can customize chest, length, and sleeve inch dimensions in the Grading Sizes database (`/studio` -> Grading Sizes tab) for XS, S, M, L, XL, 2XL, 3XL, 4XL, as well as Kids 20 to 38 sizes.",
  },

  // File Formats & Technical Output
  {
    category: "formats",
    q: "What resolution are the exported print files?",
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
    a: "FiveNest packs 92+ printable jersey panels (Front, Back, Left Sleeve, Right Sleeve) sequentially onto a continuous sublimation paper roll width (e.g., 44\", 60\", or 64\" width) ready for instant RIP plotting.",
  },
  {
    category: "formats",
    q: "Does FiveNest support A4 back print mode for small heat presses?",
    a: "Yes! For factories using standard A4/A3 flatbed heat presses, you can enable 'A4 Back Print Mode' to lock player name and number dimensions strictly within A4/A3 print bounds.",
  },
  {
    category: "formats",
    q: "How long does it take to export 100 player jerseys?",
    a: "FiveNest generates 100 complete player panel sets (400 total printable panels) in under 3 minutes, compared to 4+ hours of manual Photoshop copying.",
  },
  {
    category: "formats",
    q: "What file size are the exported ZIP packages?",
    a: "FiveNest uses optimized canvas compression to deliver high-resolution 300 DPI files while keeping ZIP download sizes lightweight for fast plotter transfer.",
  },
  {
    category: "formats",
    q: "Can I export front-only or back-only orders?",
    a: "Yes! You can toggle individual panel exports (Front Only, Back Only, Full Kit) based on order specifications.",
  },
  {
    category: "formats",
    q: "How does sleeve style merging (Half Sleeve vs Full Sleeve) work?",
    a: "You can specify different background patterns and inch dimensions for Half Sleeves vs Full Sleeves within the same order batch.",
  },

  // Branding, Watermarks & Styling
  {
    category: "branding",
    q: "How does the 180° FiveNest Brand Watermark work?",
    a: "You can optionally enable the 180° upside-down FiveNest logo watermark at the bottom-right corner of front jersey panels. When ON, you receive a discounted rate of ₹3 / pc (vs ₹5 / pc standard).",
  },
  {
    category: "branding",
    q: "Can I add my own custom TTF / OTF fonts for player names and numbers?",
    a: "Yes! You can upload custom TTF / OTF font files directly into FiveNest Web Studio, or select from popular sports fonts (Impact, Montserrat, Jersey M54, College, etc.).",
  },
  {
    category: "branding",
    q: "How does the compact Size Tag (`40=2`) work?",
    a: "FiveNest automatically stamps compressed size tags (e.g. `40=2` for Size 40, Qty 2) in the top-left margin of every panel so your stitching team identifies sizes instantly.",
  },
  {
    category: "branding",
    q: "Can I adjust sponsor logo positioning on the chest and sleeves?",
    a: "Yes! You can independently position Left Chest, Right Chest, Center Torso, and Sleeve logos using exact pixel and inch coordinate controls.",
  },
  {
    category: "branding",
    q: "Can I generate curved or arched player name text?",
    a: "Yes! FiveNest supports straight, slightly arched, and curved player name text layouts with customizable stroke outlines.",
  },
  {
    category: "branding",
    q: "How does the 3D Jersey Preview feature work?",
    a: "In Web Studio, you can toggle the 3D Preview tab to inspect your jersey artwork on a rotatable 3D jersey mesh model before starting batch export.",
  },

  // Licensing, Billing & Security
  {
    category: "licensing",
    q: "How does the ₹3 / pc vs ₹5 / pc pricing work?",
    a: "When FiveNest 180° Watermark Logo is ON, you pay ₹3 per printable piece. When Watermark Logo is OFF, you pay ₹5 per printable piece. In Test Mode, export testing is 100% FREE.",
  },
  {
    category: "licensing",
    q: "Can I transfer my license between computers or factory staff?",
    a: "Yes! Because FiveNest Web Studio is web-based, you can log in securely using your account credentials from any computer, laptop, or tablet in your factory.",
  },
  {
    category: "licensing",
    q: "How does the Multi-User Billing & Invoice feature work?",
    a: "Web Studio automatically generates professional PDF tax invoices for your customers with itemized panel counts and integrated GPay / PhonePe UPI QR codes.",
  },
  {
    category: "licensing",
    q: "Is my customer roster data private and secure?",
    a: "Yes! All customer roster spreadsheets and artwork files are encrypted using Supabase Row-Level Security (RLS). We never share or sell customer data.",
  },
  {
    category: "licensing",
    q: "How do I upgrade or recharge my Web Studio wallet balance?",
    a: "You can recharge your balance instantly via UPI, NetBanking, Credit/Debit cards, or Razorpay directly inside the Web Studio billing tab.",
  },
  {
    category: "licensing",
    q: "Do you offer factory staff training or WhatsApp support?",
    a: "Yes! All Web Studio plans include access to video tutorials, FiveNest Academy guides, and direct 24/7 WhatsApp customer support.",
  },
  {
    category: "licensing",
    q: "Can I request custom features or ERP integrations for my factory?",
    a: "Yes! Enterprise plan subscribers can request custom size grading tables, ERP API connections, and specialized plotter export formats.",
  },
];

const FAQSection = () => {
  const [activeCategory, setActiveCategory] = useState<"all" | "compatibility" | "formats" | "branding" | "licensing">("all");
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
            ❓ Frequently Asked Questions (30+ Answered)
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            Everything You Need to Know About <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              FiveNest Web Studio Production
            </span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            Answers to all software, hardware, file format, and billing questions from factory owners.
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
              placeholder="Search 30+ questions (e.g. Corel, Photoshop, DTF, Excel, Font, Watermark)..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-xl"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12 max-w-3xl mx-auto">
          {[
            { id: "all", label: "All 30+ Questions" },
            { id: "compatibility", label: "Software & Corel/PSD" },
            { id: "formats", label: "300 DPI & RIP Plotters" },
            { id: "branding", label: "Watermarks & Size Tags" },
            { id: "licensing", label: "Billing & Security" },
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
                  transition={{ delay: (idx % 10) * 0.05 }}
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
