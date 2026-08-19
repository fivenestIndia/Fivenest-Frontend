import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, Check, Copy, RefreshCw, Sparkles, ExternalLink, Camera, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import type { PlayerRecord } from './orderEntry';

interface HelpCenterProps {
  onImportRecords?: (records: PlayerRecord[]) => void;
}

interface Message {
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ManualItem {
  title: string;
  keywords: string[];
  summary: string;
  details: string;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ onImportRecords }) => {
  const [activeSubTab, setActiveSubTab] = useState<'manual' | 'refiner'>('manual');
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hi! I'm your Teedex offline assistant. Ask me about any feature (e.g., Blank Kit, Half-Sleeve Merge, Quick Size Entry, Nesting) or select a suggestion below!",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Text Refiner state
  const [unstructuredText, setUnstructuredText] = useState<string>(
    "Hi Vilesh, please print these jerseys:\n" +
    "- size 38, number 7, name RONALDO\n" +
    "- size 40, number 10, name MESSI\n" +
    "- size 40, number 9, name SMITH\n" +
    "- size 44, number 23, name JORDAN (qty 2)\n" +
    "Let me know when it is done."
  );
  const [refinedCSV, setRefinedCSV] = useState<string>("");
  const [refinedRecords, setRefinedRecords] = useState<PlayerRecord[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  // OCR Image Reader state
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [scannedImagePreview, setScannedImagePreview] = useState<string | null>(null);

  // Manual items database
  const helpManual: ManualItem[] = [
    {
      title: "Blank Kit",
      keywords: ["blank", "kit", "no name", "no number", "name", "number"],
      summary: "Blank Kit exports designs without player names or numbers.",
      details: "When Blank Kit is active, the rendering engine ignores the name and number overlay parameters. This is ideal for generating stock team wear or generic template prints."
    },
    {
      title: "A4-Back Print",
      keywords: ["a4", "back", "print", "only name", "only number"],
      summary: "A4-Back Print exports ONLY name & number details.",
      details: "When checked, the system renders standalone sheets matching the Name/Number dimensions (defined in the database) containing ONLY the player text. These can be printed onto transfer sheets or scaled for quick application."
    },
    {
      title: "Half-Sleeve Merge",
      keywords: ["half sleeve", "merge", "join", "sleeve merge", "padding", "white padding"],
      summary: "Half-Sleeve Merge joins left and right sleeves vertically with 0.2\" white padding.",
      details: "To conserve layout space on rolls, checking Half-Sleeve Merge takes Left and Right half sleeves and stitches them vertically onto a single rectangular canvas with 0.2 inches of solid white padding. The nesting engine then treats this as one item."
    },
    {
      title: "Raglan Style",
      keywords: ["raglan", "sleeves", "style"],
      summary: "Raglan Style exports sleeves optimized for raglan-cut jerseys.",
      details: "When active, the grading engine uses the 'Raglan Half' or 'Raglan Full' dimensions from your sizing database instead of standard half/full sleeve sizes."
    },
    {
      title: "Auto Nesting & Bin Packing",
      keywords: ["nest", "nesting", "packing", "bin packing", "roll", "spacing", "sheet", "efficiency"],
      summary: "Teedex uses a 2D Bin Packing algorithm to lay out panels.",
      details: "Our nesting engine packs all front, back, and sleeve panels into standard rolls (e.g. 64\" width) with custom gaps. You can toggle 'Tightest Fit' to use node-splitting packing, which fills empty holes and corners, and 'Rotate to Fit' to allow 90-degree rotations, keeping fabric waste under 12%."
    },
    {
      title: "How to Run a Batch Job",
      keywords: ["run", "how to use", "start", "automation", "begin", "steps"],
      summary: "Learn the step-by-step guide to run a batch automation job.",
      details: "To run a batch job:\n1. Choose your inputs: load a CSV file or enter quantities in the 'Live Size/Qty' tab.\n2. Choose your outputs: click 'Select Output' folder.\n3. Configure options (Format, Resolution, compression, and sleeve merge options).\n4. Click 'Run Automation' to process everything automatically."
    }
  ];

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query) return;

    // Add user message
    const userMsg: Message = { text: query, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setChatInput("");

    // Look for matching manual item
    setTimeout(() => {
      const cleanQuery = query.toLowerCase().replace(/[^a-z0-9\s]/g, "");
      const words = cleanQuery.split(/\s+/).filter(w => w.length > 2);

      if (words.length === 0) {
        setMessages(prev => [...prev, {
          text: "I couldn't understand that. Could you please specify a feature or choose one of the quick suggestions below?",
          sender: 'assistant',
          timestamp: new Date()
        }]);
        return;
      }

      let bestMatch: ManualItem | null = null;
      let maxMatches = 0;

      for (const item of helpManual) {
        let matchCount = 0;
        for (const word of words) {
          if (item.keywords.some(k => k.includes(word) || word.includes(k)) || 
              item.title.toLowerCase().includes(word)) {
            matchCount++;
          }
        }
        if (matchCount > maxMatches) {
          maxMatches = matchCount;
          bestMatch = item;
        }
      }

      if (bestMatch && maxMatches > 0) {
        setMessages(prev => [...prev, {
          text: `${bestMatch!.summary}\n\n${bestMatch!.details}`,
          sender: 'assistant',
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, {
          text: "I couldn't find a direct match in the user guide. Let me summarize what I can help you with:\n\n" +
                "• Blank Kit Mode\n• A4-Back Print\n• Half-Sleeve Merge\n• Raglan Sizing grading\n• 2D Bin Packing Nesting\n\n" +
                "Try asking about one of these features, or paste unstructured lists in the 'Roster Refiner' tab above!",
          sender: 'assistant',
          timestamp: new Date()
        }]);
      }
    }, 300);
  };

  const handleSuggestionClick = (title: string) => {
    const found = helpManual.find(m => m.title === title);
    if (found) {
      handleSendMessage(title);
    }
  };

  // --- Smart Roster Refiner Parser ---
  const handleRefineTextWithCustomText = (textInput: string) => {
    if (!textInput.trim()) return;

    const lines = textInput.split('\n');
    const records: PlayerRecord[] = [];
    let idCounter = 1;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length < 2) return;

      const sizeMatch = trimmed.match(/(?:size|sz)\s*([0-9]{2}|S|M|L|XL|XXL)/i) || trimmed.match(/\b(18|20|22|24|26|28|30|32|34|36|38|40|42|44|46|48|50|52|54|56|58|60|S|M|L|XL|XXL)\b/i);
      const numMatch = trimmed.match(/(?:number|num|#)\s*([0-9]+)/i) || trimmed.match(/#([0-9]+)/);
      const qtyMatch = trimmed.match(/(?:qty|quantity|count)\s*([0-9]+)/i) || trimmed.match(/(?:qty|\(qty|x)\s*([0-9]+)/i);
      const sleeveMatch = trimmed.match(/\b(full\s*sleeve|half\s*sleeve|full|half|fls|lhs|sleeveless|no\s*sleeve)\b/i);

      const num = numMatch ? numMatch[1] : "";
      const size = sizeMatch ? sizeMatch[1].toUpperCase() : "40";
      const qty = qtyMatch ? parseInt(qtyMatch[1]) || 1 : 1;
      const sleeve: 'half' | 'full' | 'none' = sleeveMatch && (sleeveMatch[1].toLowerCase().includes('full') || sleeveMatch[1].toLowerCase() === 'fls') ? 'full' : sleeveMatch && (sleeveMatch[1].toLowerCase().includes('less') || sleeveMatch[1].toLowerCase().includes('no')) ? 'none' : 'half';

      let cleanName = trimmed
        .replace(/(?:size|sz|number|num|qty|quantity|count|sleeve)\s*[:=]?\s*[a-z0-9]+/gi, '')
        .replace(/\b(full\s*sleeve|half\s*sleeve|full|half|fls|lhs|sleeveless)\b/gi, '')
        .replace(/\b(18|20|22|24|26|28|30|32|34|36|38|40|42|44|46|48|50|52|54|56|58|60|S|M|L|XL|XXL)\b/gi, '')
        .replace(/#[0-9]+/g, '')
        .replace(/^[0-9]+[\s.\-)]+/, '')
        .replace(/[^a-zA-Z\s]/g, ' ')
        .trim();

      if (!cleanName || cleanName.length < 2) {
        cleanName = "";
      }

      records.push({
        id: `refined-${idCounter++}-${Date.now()}`,
        name: cleanName.toUpperCase(),
        number: num,
        size: size,
        qty: qty,
        sleeve: sleeve
      });
    });

    if (records.length === 0) {
      alert("Failed to identify sizing pattern. Try formatting lines like: 'SMITH, size 40, number 10'.");
      return;
    }

    setRefinedRecords(records);

    let csv = "Player Name,Number,Size,Sleeve,Qty\n";
    records.forEach(r => {
      csv += `"${r.name}","${r.number}","${r.size}","${r.sleeve}",${r.qty}\n`;
    });
    setRefinedCSV(csv);
  };

  const handleRefineText = () => {
    handleRefineTextWithCustomText(unstructuredText);
  };

  // --- OCR Image Processor Engine ---
  const processImageOCR = async (imageSource: string | File) => {
    setOcrLoading(true);
    setOcrProgress(15);
    try {
      if (typeof imageSource !== 'string') {
        const previewUrl = URL.createObjectURL(imageSource);
        setScannedImagePreview(previewUrl);
      } else {
        setScannedImagePreview(imageSource);
      }

      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      setOcrProgress(50);
      
      const ret = await worker.recognize(imageSource);
      setOcrProgress(90);
      await worker.terminate();

      const extractedText = ret.data.text;
      setOcrProgress(100);
      setOcrLoading(false);

      if (extractedText && extractedText.trim().length > 0) {
        setUnstructuredText(extractedText);
        handleRefineTextWithCustomText(extractedText);
      } else {
        alert("No readable text found on the image. Please ensure high contrast and clear handwriting.");
      }
    } catch (err: any) {
      console.error("OCR Error:", err);
      setOcrLoading(false);
      alert("Failed to read image text. Please try uploading a clearer image file.");
    }
  };

  // Clipboard Paste Event Listener for Images (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) { processImageOCR(blob); break; }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(refinedCSV);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportToProject = () => {
    if (refinedRecords.length === 0) return;
    if (onImportRecords) {
      onImportRecords(refinedRecords);
      alert(`Imported ${refinedRecords.length} records successfully! Navigate to 'Order Entry' step to view.`);
    }
  };

  return (
    <div className="help-center-container fade-in" style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={24} style={{ color: 'var(--color-primary)' }} /> AI Data Refiner
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          Paste a messy client message, WhatsApp order, or email — or upload a photo of a handwritten list.
          AI extracts player <strong>Name, Number, Size &amp; Qty</strong> and sends it straight to Job Details.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* LEFT — Input Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Image Upload / Paste Zone */}
          <div
            style={{
              background: 'rgba(0,229,255,0.04)',
              border: '2px dashed rgba(0,229,255,0.3)',
              borderRadius: '10px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file && file.type.startsWith('image/')) processImageOCR(file);
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Camera size={15} /> SCAN IMAGE (Photo / Screenshot / Handwritten)
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Ctrl+V to paste from clipboard</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', fontSize: '12px', fontWeight: '700',
                  background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.4)',
                  borderRadius: '6px', cursor: 'pointer', color: '#00e5ff'
                }}
              >
                <Upload size={14} /> Choose Image File
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processImageOCR(file);
                }} />
              </label>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>or drag &amp; drop here</span>
              {ocrLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#00e5ff', fontWeight: 'bold' }}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Reading... {ocrProgress}%
                </div>
              )}
            </div>
            {scannedImagePreview && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '6px', marginTop: '4px' }}>
                <img src={scannedImagePreview} alt="Scanned" style={{ height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>✅ Scanned — text extracted below</span>
              </div>
            )}
          </div>

          {/* Gemini AI Gem Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(155,77,255,0.14), rgba(0,229,255,0.09))',
            border: '1px solid rgba(155,77,255,0.35)',
            borderRadius: '10px', padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#c084fc', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} /> Use Gemini AI for complex / multilingual data
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                For messy multi-language orders, use our Gemini Gem for best results.
              </p>
            </div>
            <a
              href="https://gemini.google.com/gem/1vc3MbyzLtt5RspOpQualSpuViseurHd4?usp=sharing"
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', fontSize: '11px', fontWeight: '700',
                background: 'rgba(155,77,255,0.2)', border: '1px solid rgba(155,77,255,0.5)',
                borderRadius: '6px', color: '#c084fc', textDecoration: 'none', whiteSpace: 'nowrap'
              }}
            >
              <ExternalLink size={13} /> Open Gemini Gem
            </a>
          </div>

          {/* Text Input Area */}
          <div className="glass-card" style={{ padding: '16px', flex: 1 }}>
            <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
              📝 Paste Text / Email / WhatsApp Message
            </label>
            <textarea
              className="form-input"
              rows={10}
              value={unstructuredText}
              onChange={(e) => setUnstructuredText(e.target.value)}
              placeholder={"Example:\nPlease print these:\n- Size 38, Number 7, RONALDO\n- Size 40, Number 10, MESSI\n- Size 44, #23, JORDAN (qty 2)"}
              style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', lineHeight: '1.6', resize: 'vertical', width: '100%' }}
            />
            <button
              className="btn btn-primary"
              onClick={handleRefineText}
              style={{ width: '100%', marginTop: '10px', padding: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Sparkles size={16} /> ✨ Refine &amp; Extract Data
            </button>
          </div>
        </div>

        {/* RIGHT — Output Panel */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📊 Extracted Order Data
            </h3>
            {refinedRecords.length > 0 && (
              <span style={{ fontSize: '11px', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 10px', borderRadius: '20px', fontWeight: '700' }}>
                {refinedRecords.length} players
              </span>
            )}
          </div>

          {refinedRecords.length > 0 ? (
            <>
              {/* Results Table */}
              <div className="table-container" style={{ flex: 1, overflow: 'auto', maxHeight: '340px' }}>
                <table className="custom-table" style={{ fontSize: '12px', width: '100%' }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Number</th>
                      <th>Size</th>
                      <th>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refinedRecords.map((r, idx) => (
                      <tr key={r.id}>
                        <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                        <td style={{ fontWeight: '600' }}>{r.name}</td>
                        <td style={{ textAlign: 'center' }}>{r.number}</td>
                        <td style={{ textAlign: 'center' }}>{r.size}</td>
                        <td style={{ textAlign: 'center' }}>{r.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* CSV Preview (collapsible) */}
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>CSV Preview</div>
                <textarea
                  className="form-input"
                  rows={4}
                  value={refinedCSV}
                  readOnly
                  style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', background: 'transparent', resize: 'none', color: '#10b981', border: 'none', padding: 0, width: '100%' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                <button className="btn btn-secondary" onClick={handleCopyToClipboard} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {copied ? <><Check size={15} style={{ color: '#10b981' }} /> Copied!</> : <><Copy size={15} /> Copy CSV</>}
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleImportToProject}
                  style={{ flex: 1, fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Check size={15} /> → Send to Job Details
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '40px 20px', textAlign: 'center', gap: '12px' }}>
              <Sparkles size={48} style={{ opacity: 0.2 }} />
              <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', opacity: 0.7 }}>
                Paste your order data on the left or upload a photo,<br />then click <strong>Refine &amp; Extract Data</strong>.
              </p>
              <p style={{ margin: 0, fontSize: '11px', opacity: 0.5 }}>
                Supports: emails, WhatsApp messages, handwritten notes, screenshots
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


