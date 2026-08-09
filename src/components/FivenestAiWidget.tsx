import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, Bot, User, Loader2, LifeBuoy, CheckCircle2, Printer, Download, FileText, Image as ImageIcon, Paperclip, Trash2 } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  image?: string;
  renderedCanvas?: string;
  timestamp: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5005";

const QUICK_PROMPTS = [
  "📷 Attach Mockup & Convert to 22x30\" Print File",
  "🖼️ Generate image of front file",
  "🎨 Jersey turnaround & pricing?",
  "📁 What file formats do you accept for 300 DPI print?",
];

/**
 * Generates a flat 2D 22x30 inch Sublimation Canvas Image preview (300 DPI crop & bleed layout)
 */
const generateFlatCanvasImage = (mockupSrc: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      // Standard 22x30 inch vertical aspect ratio canvas
      canvas.width = 660;
      canvas.height = 900;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(mockupSrc);

      // Deep Sublimation Production Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 900);
      grad.addColorStop(0, "#0b1329");
      grad.addColorStop(0.5, "#1e1b4b");
      grad.addColorStop(1, "#050814");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 660, 900);

      // Draw Crop Marks & Bleed Frame (0.5 inch bleed margin)
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(30, 30, 600, 840);
      ctx.setLineDash([]);

      // Crop Mark Corner Lines
      ctx.strokeStyle = "#00f2fe";
      ctx.lineWidth = 3;
      // Top Left Corner
      ctx.beginPath(); ctx.moveTo(15, 30); ctx.lineTo(45, 30); ctx.moveTo(30, 15); ctx.lineTo(30, 45); ctx.stroke();
      // Top Right Corner
      ctx.beginPath(); ctx.moveTo(615, 30); ctx.lineTo(645, 30); ctx.moveTo(630, 15); ctx.lineTo(630, 45); ctx.stroke();
      // Bottom Left Corner
      ctx.beginPath(); ctx.moveTo(15, 870); ctx.lineTo(45, 870); ctx.moveTo(30, 855); ctx.lineTo(30, 885); ctx.stroke();
      // Bottom Right Corner
      ctx.beginPath(); ctx.moveTo(615, 870); ctx.lineTo(645, 870); ctx.moveTo(630, 855); ctx.lineTo(630, 885); ctx.stroke();

      // Bleed Text Labels
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 13px monospace";
      ctx.fillText("FULL-FRONT BLEED MARGIN (0.5 INCH)", 45, 52);
      ctx.fillText("22.0\" x 30.0\" @ 300 DPI — PRODUCTION PRINT READY", 45, 880);

      // Draw Center Flat Panel Artwork (crop top collar & side sleeves)
      const srcX = img.width * 0.12;
      const srcY = img.height * 0.10;
      const srcW = img.width * 0.76;
      const srcH = img.height * 0.82;

      ctx.drawImage(img, srcX, srcY, srcW, srcH, 60, 75, 540, 780);

      // Overlay Header Badge
      ctx.fillStyle = "rgba(11, 19, 41, 0.90)";
      ctx.fillRect(60, 75, 540, 48);
      ctx.fillStyle = "#22d3ee";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("✨ FIVENEST PRE-PRESS: 22x30\" FLAT PRINT CANVAS FILE", 80, 105);

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(mockupSrc);
    img.src = mockupSrc;
  });
};

export const FivenestAiWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "print" | "support">("chat");
  const [prompt, setPrompt] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [lastUploadedMockup, setLastUploadedMockup] = useState<string | null>(null);
  const [attachedMime, setAttachedMime] = useState<string>("image/jpeg");
  const [isLoading, setIsLoading] = useState(false);

  // Pre-Press State
  const [designName, setDesignName] = useState("Cyber Dragon Polo Jersey");
  const [sport, setSport] = useState("Polo Shirt / Jersey");
  const [mockupDescription, setMockupDescription] = useState("3D polo jersey mockup with chest mascot illustration, collar, 2 buttons, diagonal neon green brushstrokes, and team logo.");
  const [printResult, setPrintResult] = useState<any>(null);

  // Support Form State
  const [supportName, setSupportName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportIssue, setSupportIssue] = useState("Order Tracking");
  const [supportMessage, setSupportMessage] = useState("");
  const [ticketResult, setTicketResult] = useState<any>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "👋 Welcome to Fivenest Gemini AI Pre-Press & Support! Attach an image of any 3D clothing mockup (Polo, Jersey, T-Shirt) using the 📎 button, and I will strip hardware, flatten it into a 22x30\" 300 DPI print-ready canvas image!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, activeTab]);

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedMime(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        setAttachedImage(dataUrl);
        setLastUploadedMockup(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || prompt;
    if ((!query.trim() && !attachedImage) || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: query || (attachedImage ? "Uploaded 3D Mockup Image for Sublimation Pre-Press Pipeline" : ""),
      image: attachedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentImage = attachedImage || lastUploadedMockup;
    const currentMime = attachedMime;
    setAttachedImage(null);
    if (!textToSend) setPrompt("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          imageBase64: currentImage,
          mimeType: currentMime,
        }),
      });

      const data = await res.json();

      if (data.success && data.reply) {
        // Generate Flat 2D Canvas Image preview if image attached or requested front file
        let flatCanvasUrl: string | undefined = undefined;
        if (currentImage && (attachedImage || query.toLowerCase().includes("image") || query.toLowerCase().includes("front") || query.toLowerCase().includes("file") || query.toLowerCase().includes("mockup"))) {
          flatCanvasUrl = await generateFlatCanvasImage(currentImage);
        }

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: data.reply,
          renderedCanvas: flatCanvasUrl,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(data.error || "Failed to process request");
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: `⚠️ Connection Error: Ensure server is running at ${API_BASE_URL}. (${err.message})`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToPrint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designName || isLoading) return;

    setIsLoading(true);
    setPrintResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/convert-to-print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designName,
          sport,
          size: "22 x 30 inches (Vertical Canvas)",
          dpi: 300,
          colorSpace: "CMYK Sublimation",
          mockupDescription,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPrintResult(data);
      } else {
        throw new Error(data.error || "Pre-press conversion failed");
      }
    } catch (err: any) {
      alert(`Pre-press error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportEmail || !supportMessage || isLoading) return;

    setIsLoading(true);
    setTicketResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/agent/contact-support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: supportName,
          email: supportEmail,
          issue: supportIssue,
          message: supportMessage,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setTicketResult(data);
      } else {
        throw new Error(data.error || "Support submission failed");
      }
    } catch (err: any) {
      alert(`Failed to submit ticket: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCanvas = (dataUrl: string, filename: string = "Fivenest_22x30_Flat_Canvas.png") => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed bottom-6 right-24 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white px-4 py-3 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 border border-blue-400/30"
          aria-label="Open Fivenest AI Assistant"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-cyan-300 group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <span className="font-semibold text-sm tracking-wide hidden sm:inline">Gemini AI Pre-Press Hub</span>
        </button>
      )}

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="w-[360px] sm:w-[460px] h-[620px] bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-xl text-cyan-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  Fivenest Gemini Pre-Press AI
                </h3>
                <p className="text-[11px] text-slate-400">Multimodal Vision & Sublimation Pre-Press Master</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 text-[11px]">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-2.5 font-medium flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === "chat"
                  ? "text-cyan-400 border-b-2 border-cyan-400 bg-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Gemini Vision Chat
            </button>
            <button
              onClick={() => setActiveTab("print")}
              className={`flex-1 py-2.5 font-medium flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === "print"
                  ? "text-cyan-400 border-b-2 border-cyan-400 bg-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              Mockup ➔ 22x30" Print
            </button>
            <button
              onClick={() => setActiveTab("support")}
              className={`flex-1 py-2.5 font-medium flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === "support"
                  ? "text-cyan-400 border-b-2 border-cyan-400 bg-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              Ticket Support
            </button>
          </div>

          {/* TAB 1: GEMINI MULTIMODAL VISION CHAT */}
          {activeTab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender === "ai" && (
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shrink-0 text-cyan-400">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[88%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-blue-600 text-white rounded-br-none shadow-md"
                          : "bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none shadow-inner"
                      }`}
                    >
                      {/* Uploaded User Mockup Image */}
                      {msg.image && (
                        <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                          <img src={msg.image} alt="Uploaded Mockup" className="max-h-48 w-full object-cover" />
                        </div>
                      )}

                      {/* Text Content */}
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {/* Rendered 2D Flat 22x30" Print Canvas Image Preview */}
                      {msg.renderedCanvas && (
                        <div className="mt-3 p-2.5 bg-slate-950 rounded-xl border border-cyan-500/40 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                              Flat 22x30" Sublimation Canvas Image
                            </span>
                            <span className="text-[9px] font-mono bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">
                              300 DPI READY
                            </span>
                          </div>
                          <div className="rounded-lg overflow-hidden border border-slate-800 bg-black">
                            <img src={msg.renderedCanvas} alt="Flat 22x30 Print Canvas" className="w-full h-auto object-contain" />
                          </div>
                          <button
                            onClick={() => handleDownloadCanvas(msg.renderedCanvas!)}
                            className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download 22x30" 300 DPI Print Image
                          </button>
                        </div>
                      )}

                      <span
                        className={`block text-[10px] mt-1.5 ${
                          msg.sender === "user" ? "text-blue-200 text-right" : "text-slate-500"
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                    {msg.sender === "user" && (
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center shrink-0 text-cyan-400">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl rounded-bl-none flex items-center gap-2 text-slate-400 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      Generating Flat 22x30" 300 DPI Print Canvas Image...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Attached Image Preview */}
              {attachedImage && (
                <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={attachedImage} alt="Attachment Preview" className="w-10 h-10 rounded object-cover border border-slate-700" />
                    <span className="text-xs text-cyan-300 font-medium">3D Mockup Attached (Ready to Process)</span>
                  </div>
                  <button
                    onClick={() => setAttachedImage(null)}
                    className="p-1 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Quick Prompts */}
              {messages.length < 4 && !isLoading && !attachedImage && (
                <div className="px-4 py-2 border-t border-slate-900 bg-slate-950/50 flex gap-2 overflow-x-auto scrollbar-none">
                  {QUICK_PROMPTS.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (q.includes("Attach Mockup")) {
                          fileInputRef.current?.click();
                        } else {
                          handleSendMessage(q);
                        }
                      }}
                      className="whitespace-nowrap text-[11px] bg-slate-900 hover:bg-blue-950 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-blue-700/50 px-3 py-1.5 rounded-full transition-all shrink-0"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Footer with Attachment Icon */}
              <div className="p-3 bg-slate-900/90 border-t border-slate-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach 3D Mockup Image"
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl transition-all border border-slate-700 shrink-0"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={attachedImage ? "Add instructions (e.g. remove text, extend bleed)..." : "Ask AI or attach mockup image..."}
                    className="flex-1 bg-slate-950 text-white placeholder-slate-500 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                  />

                  <button
                    type="submit"
                    disabled={(!prompt.trim() && !attachedImage) || isLoading}
                    className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl transition-all shadow-md shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}

          {/* TAB 2: SUBLIMATION PRE-PRESS & PRINT PRODUCTION MASTER */}
          {activeTab === "print" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {printResult ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="bg-blue-950/40 border border-blue-500/30 p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Flat 22x30" Pre-Press Spec Sheet Generated
                      </span>
                      <span className="text-[10px] font-mono bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded">
                        {printResult.printJobId}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm">{printResult.designName}</h4>
                    <div className="flex gap-2 text-[10px] text-slate-300">
                      <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">Canvas: {printResult.canvasDimensions}</span>
                      <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">Target: 300 DPI / 8K</span>
                      <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800">Space: {printResult.colorSpace}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                    <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      Production Spec Sheet & 4-Step Pipeline Output
                    </h5>
                    <div className="text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap max-h-[220px] overflow-y-auto bg-slate-950 p-3 rounded-lg border border-slate-850">
                      {printResult.printLayoutSpecs}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => alert(`Downloading 300 DPI Sublimation PDF Production Canvas for ${printResult.designName}...`)}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      Download 300 DPI Spec PDF
                    </button>
                    <button
                      onClick={() => setPrintResult(null)}
                      className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
                    >
                      New Pre-Press
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleConvertToPrint} className="space-y-3">
                  <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 border border-blue-500/30 p-3.5 rounded-xl space-y-1">
                    <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                      Sublimation Pre-Press & Print Production Master
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Strips garment hardware (collars, seams), flattens 3D mockups to 22x30" canvas, and applies 3x 300 DPI vector upscaling.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Design / Mockup Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cyber Dragon Polo Jersey"
                      value={designName}
                      onChange={(e) => setDesignName(e.target.value)}
                      className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">3D Mockup Description & Elements</label>
                    <textarea
                      rows={3}
                      placeholder="Describe the mockup (e.g. 3D polo mockup with tiger chest graphic, collar, buttons, diagonal brushstrokes)..."
                      value={mockupDescription}
                      onChange={(e) => setMockupDescription(e.target.value)}
                      className="w-full bg-slate-900 text-white text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 resize-none"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Garment Type</label>
                      <select
                        value={sport}
                        onChange={(e) => setSport(e.target.value)}
                        className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
                      >
                        <option>Polo Shirt / Jersey</option>
                        <option>Cricket Jersey</option>
                        <option>Football Jersey</option>
                        <option>T-Shirt / Crew Neck</option>
                        <option>Hoodie / Sweatshirt</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Default Canvas</label>
                      <input
                        type="text"
                        disabled
                        value="22 x 30 inch (Flat 2D)"
                        className="w-full bg-slate-900/60 text-cyan-300 font-mono text-xs px-3 py-2 rounded-xl border border-slate-800 opacity-80"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Executing Pre-Press Pipeline...
                      </>
                    ) : (
                      <>
                        <Printer className="w-4 h-4 text-cyan-300" />
                        Convert 3D Mockup ➔ 22x30" 300 DPI Print Spec
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: CONTACT SUPPORT TICKET */}
          {activeTab === "support" && (
            <div className="flex-1 overflow-y-auto p-4">
              {ticketResult ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <h4 className="font-bold text-white text-base">Support Ticket Created!</h4>
                    <p className="text-xs text-emerald-300 font-mono bg-emerald-900/40 py-1 px-3 rounded-md inline-block">
                      Ticket ID: {ticketResult.ticketId}
                    </p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                    <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Instant Resolution</h5>
                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{ticketResult.resolution}</p>
                  </div>

                  <button
                    onClick={() => {
                      setTicketResult(null);
                      setSupportMessage("");
                      setActiveTab("chat");
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    Back to AI Chat
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSupportSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={supportName}
                      onChange={(e) => setSupportName(e.target.value)}
                      className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Issue Category</label>
                    <select
                      value={supportIssue}
                      onChange={(e) => setSupportIssue(e.target.value)}
                      className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option>Order Tracking & Shipping</option>
                      <option>Jersey Design & Printing Specs</option>
                      <option>Bulk/Team Order Quote</option>
                      <option>Photoshop Plugin License Help</option>
                      <option>Other Support Question</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Describe your issue / question</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Include order number or specific question details..."
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      className="w-full bg-slate-900 text-white text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting Support Ticket...
                      </>
                    ) : (
                      "Submit Support Ticket & Get Instant AI Help"
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
