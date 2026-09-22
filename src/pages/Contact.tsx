import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Phone, MapPin, Send, MessageSquare, ArrowRight,
  Clock, CheckCircle, ChevronDown, Zap, Building2, User, FileText
} from 'lucide-react';

const cn = (...classes: (string | undefined | boolean)[]) => classes.filter(Boolean).join(' ');

// ─── Contact Info Card ────────────────────────────────────────────────────────
function InfoCard({ icon, label, value, href, delay = 0 }: {
  icon: React.ReactNode; label: string; value: string; href?: string; delay?: number;
}) {
  const inner = (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-[#E4572E]/10 border border-[#E4572E]/20 flex items-center justify-center text-[#E4572E] flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[#71717A] text-xs font-semibold uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-[#171717] font-bold text-sm">{value}</p>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="card-clean p-5"
    >
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="block hover:text-[#E4572E] transition-colors">
          {inner}
        </a>
      ) : inner}
    </motion.div>
  );
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#E8E4DE] rounded-xl overflow-hidden bg-white shadow-soft">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#FAF8F5] transition-colors"
      >
        <span className="text-[#171717] font-bold text-base">{q}</span>
        <ChevronDown
          size={18}
          className={`text-[#71717A] transition-transform duration-300 flex-shrink-0 ml-4 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-[#52525B] text-sm leading-relaxed border-t border-[#E8E4DE] pt-4">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Contact() {
  const [formData, setFormData] = useState({
    name: '', email: '', company: '', phone: '', subject: 'general', message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitted(true);
  };

  const subjects = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'demo', label: 'Schedule a Live Demo' },
    { value: 'subscription', label: 'Subscription & Token Pricing' },
    { value: 'technical', label: 'Technical Integration' },
  ];

  const faqs = [
    {
      q: 'How fast can our print shop get started with Fivenest?',
      a: 'Instant onboarding. Your account and dedicated order management portal are activated immediately upon subscription. We can also assist you in importing your existing customer list.',
    },
    {
      q: 'Do our designers need specialized training?',
      a: 'No special skills required. If your team can upload files to Google Drive or WhatsApp, they can use Fivenest. It replaces manual Photoshop layer adjustments with 1-click batch runs.',
    },
    {
      q: 'Can we test Fivenest with our actual jersey artwork files?',
      a: 'Yes! Reach out to us directly on WhatsApp and we will run a live demonstration using your own team squad roster and PSD artwork so you can see the 300 DPI output firsthand.',
    },
    {
      q: 'What file formats are supported for output?',
      a: 'We accept PSD, AI, PNG, TIFF, and PDF. Production files are exported as print-ready 300 DPI CMYK TIFF or PDF files organized neatly by player name and garment size.',
    },
  ];

  return (
    <div className="relative bg-[#F5F3EF]">
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-60 pointer-events-none" />
        <div className="absolute inset-0 hero-radial pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <span className="badge-pill mb-6 inline-flex items-center gap-2">
              <MessageSquare size={13} /> Direct Support &amp; Onboarding
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-hero mb-4"
          >
            Let's talk about <br />
            <span className="text-[#E4572E]">automating your print shop</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-section-subtitle mx-auto mb-6"
          >
            Have questions about subscription tiers, token wallets, or file formats? Our team is based in Mumbai and answers within a few hours.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-bold"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <Clock size={13} />
            Average WhatsApp response time: under 1 hour
          </motion.div>
        </div>
      </section>

      {/* ── CONTACT GRID ─────────────────────────────────────────── */}
      <section className="py-12 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* ── LEFT: Quick Contact Cards ── */}
            <div className="space-y-5">
              <h2 className="text-[#171717] font-extrabold text-xl">Reach Us Directly</h2>
              <div className="space-y-3.5">
                <InfoCard
                  icon={<Mail size={20} />}
                  label="Official Email"
                  value="fivenest.india@gmail.com"
                  href="mailto:fivenest.india@gmail.com"
                  delay={0}
                />
                <InfoCard
                  icon={<Phone size={20} />}
                  label="WhatsApp &amp; Phone"
                  value="+91 88792 28710"
                  href="https://wa.me/918879228710"
                  delay={0.1}
                />
                <InfoCard
                  icon={<MapPin size={20} />}
                  label="Location"
                  value="Mahim, Mumbai, Maharashtra"
                  delay={0.2}
                />
              </div>

              {/* Direct WhatsApp Callout */}
              <motion.a
                href="https://wa.me/918879228710?text=Hi%2C%20I%27m%20interested%20in%20Fivenest%20for%20my%20jersey%20printing%20business."
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25 }}
                className="flex items-center gap-4 p-5 rounded-2xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100/70 transition-all shadow-soft group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0 text-white shadow-sm">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-emerald-800 font-extrabold text-sm">Chat on WhatsApp</p>
                  <p className="text-emerald-700 text-xs">Fastest reply for live queries</p>
                </div>
                <ArrowRight size={16} className="text-emerald-700 ml-auto group-hover:translate-x-1 transition-transform" />
              </motion.a>

              {/* Operating Hours */}
              <div className="card-clean p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <Clock size={16} className="text-[#E4572E]" />
                  <p className="text-[#171717] font-bold text-sm">Operating Hours</p>
                </div>
                <div className="space-y-1.5 text-xs text-[#52525B]">
                  <div className="flex justify-between">
                    <span>Monday – Saturday</span>
                    <span className="font-bold text-[#171717]">9:00 AM – 8:00 PM IST</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span className="font-bold text-[#71717A]">10:00 AM – 4:00 PM IST</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Contact Form ── */}
            <div className="lg:col-span-2">
              <div className="card-clean p-8 sm:p-10 shadow-soft-lg">
                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-5 text-emerald-700">
                        <CheckCircle size={36} />
                      </div>
                      <h3 className="text-2xl font-black text-[#171717] mb-2">Message Sent Successfully!</h3>
                      <p className="text-[#52525B] text-sm max-w-sm mx-auto mb-6">
                        Thank you for reaching out. A Fivenest team member will contact you shortly.
                      </p>
                      <a
                        href="https://wa.me/918879228710"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary inline-flex"
                      >
                        Message on WhatsApp Directly <ArrowRight size={15} />
                      </a>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div>
                        <h2 className="text-[#171717] font-extrabold text-2xl mb-1.5">Send Us a Message</h2>
                        <p className="text-[#71717A] text-xs">Fill out the details below and we will get back to your print shop promptly.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-[#52525B] uppercase tracking-wider mb-1.5 block">Your Name *</label>
                          <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Rajesh Sharma"
                            className="w-full px-4 py-3 rounded-xl bg-[#F5F3EF] border border-[#E2DED7] text-[#171717] text-sm focus:outline-none focus:border-[#E4572E] focus:bg-white transition-all font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#52525B] uppercase tracking-wider mb-1.5 block">Email Address *</label>
                          <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="rajesh@printstudio.com"
                            className="w-full px-4 py-3 rounded-xl bg-[#F5F3EF] border border-[#E2DED7] text-[#171717] text-sm focus:outline-none focus:border-[#E4572E] focus:bg-white transition-all font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-[#52525B] uppercase tracking-wider mb-1.5 block">Print Shop / Business Name</label>
                          <input
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            placeholder="e.g. Sharma Sports Prints"
                            className="w-full px-4 py-3 rounded-xl bg-[#F5F3EF] border border-[#E2DED7] text-[#171717] text-sm focus:outline-none focus:border-[#E4572E] focus:bg-white transition-all font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#52525B] uppercase tracking-wider mb-1.5 block">WhatsApp / Phone Number</label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            className="w-full px-4 py-3 rounded-xl bg-[#F5F3EF] border border-[#E2DED7] text-[#171717] text-sm focus:outline-none focus:border-[#E4572E] focus:bg-white transition-all font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#52525B] uppercase tracking-wider mb-1.5 block">Topic of Interest *</label>
                        <select
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl bg-[#F5F3EF] border border-[#E2DED7] text-[#171717] text-sm focus:outline-none focus:border-[#E4572E] focus:bg-white transition-all font-medium"
                        >
                          {subjects.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#52525B] uppercase tracking-wider mb-1.5 block">Message / Production Details *</label>
                        <textarea
                          name="message"
                          required
                          rows={4}
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Tell us about how many jerseys you produce each month, your current software workflow, or any questions..."
                          className="w-full px-4 py-3 rounded-xl bg-[#F5F3EF] border border-[#E2DED7] text-[#171717] text-sm focus:outline-none focus:border-[#E4572E] focus:bg-white transition-all resize-none font-medium"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary w-full py-4 text-sm"
                      >
                        {submitting ? 'Sending Request...' : 'Send Message'} <Send size={16} />
                      </button>
                    </form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ACCORDION ────────────────────────────────────────── */}
      <section className="py-24 relative bg-[#EFECE6]/40 border-t border-[#E8E4DE]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="badge-pill mb-4 inline-block">Common Inquiries</span>
            <h2 className="text-section-title mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f) => <FAQItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>
    </div>
  );
}
