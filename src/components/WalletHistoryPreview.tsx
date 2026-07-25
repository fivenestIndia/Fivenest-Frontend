import { motion } from "framer-motion";
import { Wallet, ArrowDownRight, ArrowUpRight, ShieldCheck, RefreshCw } from "lucide-react";

const ledgerItems = [
  {
    id: "tx-101",
    type: "recharge",
    title: "Wallet Recharge (Razorpay UPI)",
    date: "Today, 09:15 AM",
    amount: "+ ₹500.00",
    status: "Success",
  },
  {
    id: "tx-102",
    type: "debit",
    title: "Generated Order #412 (92 Panels)",
    date: "Today, 10:30 AM",
    amount: "- ₹276.00",
    detail: "92 Panels @ ₹3/pc (Watermark ON)",
    status: "Success",
  },
  {
    id: "tx-103",
    type: "refund",
    title: "Instant Refund (Cancelled Order #411)",
    date: "Yesterday, 04:20 PM",
    amount: "+ ₹45.00",
    status: "Refunded",
  },
  {
    id: "tx-104",
    type: "debit",
    title: "Generated Order #410 (40 Panels)",
    date: "Yesterday, 02:10 PM",
    amount: "- ₹120.00",
    detail: "40 Panels @ ₹3/pc (Watermark ON)",
    status: "Success",
  },
];

const WalletHistoryPreview = () => {
  return (
    <section className="py-20 relative overflow-hidden bg-slate-950/60 border-t border-slate-800">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-4xl mx-auto rounded-3xl bg-slate-900/80 border border-slate-800 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Wallet size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Live Wallet Transparency Ledger</h3>
                <p className="text-xs text-slate-400">Real-time ledger updates for every panel export & recharge</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold">Active Balance:</span>
              <span className="text-xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                ₹149.00
              </span>
            </div>
          </div>

          {/* Ledger History List */}
          <div className="space-y-3 font-mono text-xs md:text-sm">
            {ledgerItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                      item.type === "recharge"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : item.type === "refund"
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {item.type === "recharge" || item.type === "refund" ? (
                      <ArrowDownRight size={16} />
                    ) : (
                      <ArrowUpRight size={16} />
                    )}
                  </div>
                  <div>
                    <div className="font-sans font-bold text-white text-xs md:text-sm">{item.title}</div>
                    <div className="text-[10px] text-slate-500">{item.date} {item.detail ? `· ${item.detail}` : ""}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-black font-mono text-sm ${
                      item.type === "recharge" || item.type === "refund"
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {item.amount}
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans font-semibold">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WalletHistoryPreview;
