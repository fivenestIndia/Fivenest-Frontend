import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, Check, Copy, RefreshCw } from 'lucide-react';
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

  // --- Roster refiner parser logic ---
  const handleRefineText = () => {
    if (!unstructuredText.trim()) return;

    const lines = unstructuredText.split('\n');
    const records: PlayerRecord[] = [];
    let idCounter = 1;

    // Regular expressions for extracting parameters
    const sizeRegex = /(?:size|sz)\s*([0-9]{2})/i;
    const numRegex = /(?:number|num|#)\s*([0-9]+)/i;
    const nameRegex = /(?:name|player)\s*([a-z\s]+?)(?=(?:\(qty|qty|size|number|#|\n|$))/i;
    const qtyRegex = /(?:qty|quantity|count)\s*([0-9]+)/i;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length < 5) return;

      const sizeMatch = trimmed.match(sizeRegex);
      const numMatch = trimmed.match(numRegex);
      const nameMatch = trimmed.match(nameRegex);
      const qtyMatch = trimmed.match(qtyRegex);

      const size = sizeMatch ? sizeMatch[1] : "40"; // Default L
      const num = numMatch ? numMatch[1] : "";
      const name = nameMatch ? nameMatch[1].replace(/^-|\s+$/g, '').trim() : "BLANK";
      const qty = qtyMatch ? parseInt(qtyMatch[1]) || 1 : 1;

      records.push({
        id: `refined-${idCounter++}-${Date.now()}`,
        name: name.toUpperCase(),
        number: num,
        size: size,
        qty: qty,
        sleeve: 'half'
      });
    });

    if (records.length === 0) {
      alert("Failed to identify sizing pattern. Try formatting lines like: 'SMITH, size 40, number 10'.");
      return;
    }

    setRefinedRecords(records);

    // Build CSV string
    let csv = "Player Name,Number,Size,Sleeve,Qty\n";
    records.forEach(r => {
      csv += `"${r.name}","${r.number}","${r.size}","${r.sleeve}",${r.qty}\n`;
    });
    setRefinedCSV(csv);
  };

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
    <div className="help-center-container fade-in">
      {/* Sub tabs */}
      <div className="tab-btn-group" style={{ marginBottom: '24px', maxWidth: '360px' }}>
        <button className={`tab-btn ${activeSubTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveSubTab('manual')}>Interactive User Manual</button>
        <button className={`tab-btn ${activeSubTab === 'refiner' ? 'active' : ''}`} onClick={() => setActiveSubTab('refiner')}>AI Smart CSV Roster Refiner</button>
      </div>

      {activeSubTab === 'manual' ? (
        <div className="chat-window">
          {/* Chat history */}
          <div className="chat-history">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble chat-bubble-${msg.sender}`} style={{ whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick pills */}
          <div className="chat-suggestions">
            <span className="suggestion-pill" onClick={() => handleSuggestionClick("Blank Kit")}>Blank Kit</span>
            <span className="suggestion-pill" onClick={() => handleSuggestionClick("Half-Sleeve Merge")}>Half-Sleeve Merge</span>
            <span className="suggestion-pill" onClick={() => handleSuggestionClick("A4-Back Print")}>A4-Back Print</span>
            <span className="suggestion-pill" onClick={() => handleSuggestionClick("Raglan Style")}>Raglan Style</span>
            <span className="suggestion-pill" onClick={() => handleSuggestionClick("Auto Nesting & Bin Packing")}>Auto Nesting</span>
            <span className="suggestion-pill" onClick={() => handleSuggestionClick("How to Run a Batch Job")}>How to Run</span>
          </div>

          {/* Input field */}
          <div className="chat-input-row">
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ask a question about sublimation rendering, sizing, or nesting..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
            />
            <button className="btn btn-primary" onClick={() => handleSendMessage()}>
              <Send size={16} /> Send
            </button>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          {/* Unstructured Text Input */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '12px' }}>📝 Paste Client Email / Unstructured Text</h3>
            <p className="form-label" style={{ marginBottom: '16px' }}>
              Paste raw emails or text lists. The refiner will extract player names, numbers, sizes, and quantities into a structured list.
            </p>
            
            <textarea
              className="form-input"
              rows={12}
              value={unstructuredText}
              onChange={(e) => setUnstructuredText(e.target.value)}
              style={{ fontFamily: 'ui-monospace, monospace', fontSize: '13px', lineHeight: '1.5', resize: 'vertical' }}
            />

            <button className="btn btn-primary" onClick={handleRefineText} style={{ width: '100%', marginTop: '16px' }}>
              <RefreshCw size={16} /> Clean & Extract Roster List
            </button>
          </div>

          {/* Structured Output CSV */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '12px' }}>📊 Structured Output (CSV Data)</h3>
            
            {refinedCSV ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                <div>
                  <textarea
                    className="form-input"
                    rows={10}
                    value={refinedCSV}
                    readOnly
                    style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', background: 'rgba(0,0,0,0.4)', resize: 'vertical', color: 'var(--color-success)' }}
                  />
                  
                  <div className="table-container" style={{ maxHeight: '180px', marginTop: '12px' }}>
                    <table className="custom-table" style={{ fontSize: '11px' }}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>#</th>
                          <th>Size</th>
                          <th>Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {refinedRecords.slice(0, 5).map(r => (
                          <tr key={r.id}>
                            <td>{r.name}</td>
                            <td>{r.number}</td>
                            <td>Size {r.size}</td>
                            <td>{r.qty}</td>
                          </tr>
                        ))}
                        {refinedRecords.length > 5 && (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                              + {refinedRecords.length - 5} more entries
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button className="btn btn-secondary" onClick={handleCopyToClipboard} style={{ flex: 1 }}>
                    {copied ? <Check size={16} style={{ color: 'var(--color-success)' }} /> : <Copy size={16} />} 
                    {copied ? "Copied!" : "Copy CSV"}
                  </button>
                  <button className="btn btn-success" onClick={handleImportToProject} style={{ flex: 1 }}>
                    <Check size={16} /> Import into Active Order
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80%', color: 'var(--text-muted)', fontStyle: 'italic', padding: '40px' }}>
                <FileText size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                Click "Clean & Extract Roster List" to parse the text.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
