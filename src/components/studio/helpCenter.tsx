import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileText, 
  Check, 
  Copy, 
  Sparkles, 
  ExternalLink, 
  Camera, 
  Upload, 
  Loader2, 
  Trash2, 
  ArrowRight, 
  FileSpreadsheet, 
  X,
  ClipboardPaste,
  Plus,
  Edit2,
  Info,
  ChevronDown,
  ChevronUp,
  Download,
  AlertCircle
} from 'lucide-react';
import type { PlayerRecord } from './orderEntry';

interface HelpCenterProps {
  onImportRecords?: (records: PlayerRecord[]) => void;
}

// ── Smart Size Conversion Rules (Official Factory Matrix) ──
// XS=36, S=38, M=40, L=42, XL=44, 2XL=46, 3XL=48, 4XL=50, 5XL=52, 6XL=54, 7XL=56, 8XL=58, 9XL=60
const LETTER_TO_SIZE: Record<string, string> = {
  'xs': '36',
  's': '38',
  'm': '40',
  'l': '42',
  'xl': '44',
  '2xl': '46', 'xxl': '46',
  '3xl': '48', 'xxxl': '48',
  '4xl': '50', 'xxxxl': '50',
  '5xl': '52',
  '6xl': '54',
  '7xl': '56',
  '8xl': '58',
  '9xl': '60',
};

// ── Youth / Kids Age to Size Mappings ──
const AGE_TO_SIZE: Record<string, string> = {
  '6 month to 1 year': '18', '6 month': '18', '6 months': '18', '6m-1y': '18', '6m to 1y': '18', '6m': '18',
  '1 year': '20', '1 yr': '20', '1y': '20', '1year': '20',
  '1.5 year': '22', '1.5 yr': '22', '1.5y': '22', '1.5year': '22',
  '2-3 year': '24', '2-3 yr': '24', '2 to 3 year': '24', '2-3y': '24', '2 year': '24', '3 year': '24', '2yr': '24', '3yr': '24',
  '4-5 year': '26', '4-5 yr': '26', '4 to 5 year': '26', '4-5y': '26', '4 year': '26', '5 year': '26', '4yr': '26', '5yr': '26',
  '6-8 year': '28', '6-8 yr': '28', '6 to 8 year': '28', '6-8y': '28', '6 year': '28', '7 year': '28', '8 year': '28', '6yr': '28', '7yr': '28', '8yr': '28',
  '10-11 year': '30', '10-11 yr': '30', '10 to 11 year': '30', '10-11y': '30', '10 year': '30', '11 year': '30', '10yr': '30', '11yr': '30',
  '11-12 year': '32', '11-12 yr': '32', '11 to 12 year': '32', '11-12y': '32', '12 year': '32', '12yr': '32',
  '13-14 year': '34', '13-14 yr': '34', '13 to 14 year': '34', '13-14y': '34', '13 year': '34', '14 year': '34', '13yr': '34', '14yr': '34',
};

// ── Display Label Mapping for Badges & Dropdown ──
const SIZE_DISPLAY_LABEL: Record<string, string> = {
  '18': '6m-1yr',
  '20': '1 yr',
  '22': '1.5 yr',
  '24': '2-3 yr',
  '26': '4-5 yr',
  '28': '6-8 yr',
  '30': '10-11 yr',
  '32': '11-12 yr',
  '34': '13-14 yr',
  '36': 'XS',
  '38': 'S',
  '40': 'M',
  '42': 'L',
  '44': 'XL',
  '46': '2XL',
  '48': '3XL',
  '50': '4XL',
  '52': '5XL',
  '54': '6XL',
  '56': '7XL',
  '58': '8XL',
  '60': '9XL',
};

const ALL_SYSTEM_SIZES = [
  "18", "20", "22", "24", "26", "28", "30", "32", "34", "36",
  "38", "40", "42", "44", "46", "48", "50", "52", "54", "56", "58", "60"
];

// Helper: strictly clean and extract pure numeric size (e.g. "30", "32", "40")
function cleanSizeOnly(raw: string | undefined): string {
  if (!raw) return "40";
  const str = raw.toString().toLowerCase().trim();
  if (LETTER_TO_SIZE[str]) return LETTER_TO_SIZE[str];
  for (const [age, s] of Object.entries(AGE_TO_SIZE)) {
    if (str.includes(age)) return s;
  }
  const match = str.match(/(?:size\s*[:=]?\s*)?(1[8-9]|[2-5][0-9]|60)/i);
  if (match) return match[1];
  return "40";
}

// Sample presets for quick testing
const SAMPLE_NITIN_TITANS = 
`NITIN TITANS

Name : size : no
1. VIVAN : 30 size : 01
2. HITANSH : 32size 01
3. AARAV : 32 size 01
4. NIRMAL : 38 : 143
5. NITESH : 38 : 22
6. PIYUSH : 38 : 69`;

const SAMPLE_SCENARIO_B = 
`WARRIORS FC
34 - 6
38 - 10 (Half Sleeve)
42 - 4 (Full Sleeve)`;

// Internal Raw Roster Item
export interface RawPlayerRow {
  id: string;
  name: string;
  number: string; // TEXT preserving leading zeros like "01", "08"
  size: string; // Strictly numeric string like "30", "32", "38"
  sleeve: string; // 'Half Sleeve' | 'Full Sleeve' | 'No Sleeve'
  isQuantityOnly?: boolean;
}

// 9-Column Formatted Output Row
export interface NineColumnRow {
  id: string;
  // Left 5 Columns (Roster)
  filename: string;
  name: string;
  number: string;
  size: string;
  sleeve: string;
  // Right 4 Columns (Summary)
  frontSize: string;
  halfSleeve: number | string;
  fullSleeve: number | string;
  totalQty: number | string;
  isTotalRow?: boolean;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ onImportRecords }) => {
  const [unstructuredText, setUnstructuredText] = useState<string>(SAMPLE_NITIN_TITANS);
  const [teamName, setTeamName] = useState<string>("NITIN TITANS");
  const [sequenceNumber, setSequenceNumber] = useState<string>("01");
  const [rawRoster, setRawRoster] = useState<RawPlayerRow[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [showRawCsv, setShowRawCsv] = useState<boolean>(false);
  const [showSizeGuide, setShowSizeGuide] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  // OCR Image Reader state
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStatusText, setOcrStatusText] = useState<string>("");
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [scannedImagePreview, setScannedImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Specialized Sports Apparel Manufacturing Parser ---
  const parseApparelOrder = (textInput: string) => {
    if (!textInput || !textInput.trim()) return;

    // 1. Sanitize text: remove invisible unicode characters (zero-width spaces, BOM, directional marks, control characters)
    const sanitizedText = textInput.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u2028\u2029\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

    // 2. Ignore blank lines, empty lines, or lines without any alphanumeric character (extra spaces, empty punctuation)
    const lines = sanitizedText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && /[\p{L}\p{N}]/u.test(l));

    if (lines.length === 0) return;

    let detectedTeam = "";
    const extractedRows: RawPlayerRow[] = [];
    let idCounter = 1;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Check if line is just a stray serial number with nothing else (e.g. "13.", "13", "13 -", "#13", "13)")
      if (/^\s*(?:[0-9]{1,3}|#[0-9]{1,3})[\s.\-):]*\s*$/.test(line)) {
        continue; // Skip trailing or blank numbered line without data
      }

      // Strip leading serial number (e.g., "1.", "1 -", "01)", "#1") if present at the start of line
      const strippedLine = line.replace(/^\s*(?:[0-9]{1,3}|#[0-9]{1,3})[\s.\-):]+\s*/, "");

      // 1. Explicit Team/Project Name prefix (e.g. "Team: Warriors", "Project: Phoenix")
      const teamPrefixMatch = line.match(/^(?:team|project|order\s*name|club|title)\s*[:=]\s*(.+)$/i);
      if (teamPrefixMatch && !detectedTeam) {
        detectedTeam = teamPrefixMatch[1].trim().toUpperCase();
        continue;
      }

      // 2. Filter Table Header line (e.g. "Name : size : no", "Sr | Name | Size | Number")
      const lower = line.toLowerCase();
      const headerWords = ["name", "size", "number", "jersey", "sleeve", "qty", "quantity", "sr", "no.", "sr."];
      const matchCount = headerWords.filter(w => lower.includes(w)).length;
      const hasColonOrDelim = /[:|\/\-]/.test(line);
      if (matchCount >= 2 && hasColonOrDelim && !/[0-9]{2,}/.test(line.replace(/\b(?:sr|no)\.?\s*[0-9]*/gi, ""))) {
        continue; // Skip header line
      }

      // 3. Filter Greetings
      if (/^(?:hi|hello|dear|hey|good\s*morning|good\s*afternoon|please\s*print|order\s*details|here\s*is|jersey\s*order)\b/i.test(lower)) {
        continue;
      }

      // 4. Scenario B: Explicit "Size - Quantity" (e.g., 34 - 6, Size 38 : 10 pcs, 34 - 3 pcs)
      const scenBTarget = strippedLine.length > 0 ? strippedLine : line;
      const scenBMatch = scenBTarget.match(/^(?:size\s*[:=]?\s*)?([0-9]{2}|[0-9]xl|xxxl|xxl|xl|xs|[sml])\s*[-:x=,]\s*([0-9]+)\s*(?:pcs|nos|pieces|qty)?(?:\s*\(?([^)]+)\)?)?$/i);
      if (scenBMatch) {
        const rawS = cleanSizeOnly(scenBMatch[1]);
        const count = parseInt(scenBMatch[2], 10);
        if (count <= 0) continue;
        const extra = (scenBMatch[3] || "").toLowerCase();
        let sleeve = "Half Sleeve";
        if (extra.includes("full")) sleeve = "Full Sleeve";
        else if (extra.includes("none") || extra.includes("without") || extra.includes("sleeveless")) sleeve = "No Sleeve";

        for (let k = 0; k < count; k++) {
          extractedRows.push({
            id: `row-${idCounter++}-${Date.now()}`,
            name: "",
            number: "",
            size: rawS,
            sleeve,
            isQuantityOnly: true
          });
        }
        continue;
      }

      // 5. Implicit Team Name (First non-empty line without digits/colons)
      if (!detectedTeam && !/[0-9]/.test(line) && !line.includes(":") && !line.includes("-") && line.length > 2) {
        detectedTeam = line.trim().toUpperCase();
        continue;
      }

      // 6. Scenario A: Universal Sequential Extraction
      let working = line;
      let pSleeve = "Half Sleeve";
      let pSize = "";
      let pNum = "";

      // Step A: Strip leading serial number from working string (e.g. "1.", "1 -", "01)", "#1")
      working = working.replace(/^\s*(?:[0-9]{1,3}|#[0-9]{1,3})[\s.\-):]+\s*/, " ");

      // Step B: Extract Sleeve
      if (/\b(full\s*sleeve[s]?|full\s*hand|full|fls)\b/i.test(working)) {
        pSleeve = "Full Sleeve";
        working = working.replace(/\b(full\s*sleeve[s]?|full\s*hand|full|fls)\b/gi, " ");
      } else if (/\b(sleeveless|no\s*sleeve[s]?|without\s*sleeve[s]?|none)\b/i.test(working)) {
        pSleeve = "No Sleeve";
        working = working.replace(/\b(sleeveless|no\s*sleeve[s]?|without\s*sleeve[s]?|none)\b/gi, " ");
      } else if (/\b(half\s*sleeve[s]?|half\s*hand|half|hls)\b/i.test(working)) {
        pSleeve = "Half Sleeve";
        working = working.replace(/\b(half\s*sleeve[s]?|half\s*hand|half|hls)\b/gi, " ");
      }

      // Step C: Extract Quantity notes if any (e.g. qty 2, x2)
      const qMatch = working.match(/(?:qty|quantity|nos|pcs|pieces)\s*[:=]?\s*([0-9]+)/i) || working.match(/\bx\s*([0-9]+)\b/i);
      if (qMatch) {
        working = working.replace(qMatch[0], " ");
      }

      // Step D: Extract Explicit Jersey Number (e.g. "No. 54", "No: 07", "#10", "Number: 18", "No 0")
      // ALWAYS treat as TEXT and preserve leading zeros!
      const explicitNumMatch = working.match(/(?:(?:jersey|jrsy|no|num|number)\.?\s*[:=\-#]?\s*|#\s*)([0-9]{1,4})\b/i);
      if (explicitNumMatch) {
        pNum = explicitNumMatch[1];
        working = working.replace(explicitNumMatch[0], " ");
      }

      // Step E: Extract Age/Youth Size
      const lowerWorking = working.toLowerCase();
      for (const [ageStr, szCode] of Object.entries(AGE_TO_SIZE)) {
        if (lowerWorking.includes(ageStr)) {
          pSize = szCode;
          working = working.replace(new RegExp(ageStr, 'gi'), " ");
          break;
        }
      }

      // Step F: Extract Explicit Size Prefix (e.g. "Size 40", "Size: M", "40 Size", "Size-XL")
      if (!pSize) {
        const explicitSzMatch = working.match(/(?:size\s*[:=\-]?\s*)(9xl|8xl|7xl|6xl|5xl|4xl|3xl|2xl|xxxl|xxl|xl|xs|[sml]|[1-5][0-9]|60)\b/i)
          || working.match(/\b(9xl|8xl|7xl|6xl|5xl|4xl|3xl|2xl|xxxl|xxl|xl|xs|[1-5][0-9]|60)\s*(?:size|sz)\b/i);
        if (explicitSzMatch) {
          pSize = cleanSizeOnly(explicitSzMatch[1]);
          working = working.replace(explicitSzMatch[0], " ");
        }
      }

      // Step G: Extract Letter Size with delimiter/boundary isolation (XS, S, M, L, XL, XXL, etc.)
      if (!pSize) {
        const letterSizeMatch = working.match(/(?:^|[\s:\-|/])(9xl|8xl|7xl|6xl|5xl|4xl|3xl|2xl|xxxl|xxl|xl|xs|[sml])(?=$|[\s:\-|/])/i);
        if (letterSizeMatch) {
          pSize = cleanSizeOnly(letterSizeMatch[1]);
          const matchIdx = working.indexOf(letterSizeMatch[0]);
          if (matchIdx !== -1) {
            working = working.slice(0, matchIdx) + " " + working.slice(matchIdx + letterSizeMatch[0].length);
          }
        }
      }

      // Step H: Standalone Jersey Number or Standalone Numeric Size
      const tokens = working.split(/[\s:\-|/]+/).filter(t => t.length > 0);
      const nonNumberTokens: string[] = [];

      for (const token of tokens) {
        if (/^[0-9]{1,4}$/.test(token)) {
          const val = parseInt(token, 10);
          if (!pSize && val >= 18 && val <= 60 && val % 2 === 0) {
            pSize = token;
          } else if (!pNum) {
            pNum = token; // Preserve exact string including "07", "0", "01"
          } else if (!pSize && val >= 18 && val <= 60) {
            pSize = token;
          } else {
            nonNumberTokens.push(token);
          }
        } else {
          nonNumberTokens.push(token);
        }
      }

      // Step I: Player Name from remaining tokens (filtering quantity noise)
      let cleanName = nonNumberTokens
        .filter(t => !/^(?:pcs|nos|pieces|qty|size|sz|no|num|number|sr)$/i.test(t))
        .join(" ")
        .replace(/[-|•*()_:,]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();

      // Must contain actual alphanumeric letters or numbers, else it's just punctuation/whitespace noise
      if (!/[\p{L}\p{N}]/u.test(cleanName)) {
        cleanName = "";
      }

      if (cleanName === "NIL" || cleanName === "NONE" || cleanName === "BLANK") {
        cleanName = "";
      }

      const cleanNumber = (pNum || "").trim();

      // CRITICAL: Ignore blank lines, extra spaces, and rows without data!
      if (!cleanName && !cleanNumber) {
        continue;
      }

      pSize = cleanSizeOnly(pSize);

      extractedRows.push({
        id: `row-${idCounter++}-${Date.now()}`,
        name: cleanName,
        number: cleanNumber,
        size: pSize,
        sleeve: pSleeve
      });
    }

    if (detectedTeam) {
      setTeamName(detectedTeam);
    }
    setRawRoster(extractedRows);
  };

  // Trigger parse on initial load
  useEffect(() => {
    parseApparelOrder(SAMPLE_NITIN_TITANS);
  }, []);

  const handleRefine = () => {
    setIsParsing(true);
    try {
      parseApparelOrder(unstructuredText);
    } finally {
      setIsParsing(false);
    }
  };

  // --- Processing Rules: Sorting, Global ID, and Filename [Size] [Global ID] ---
  const sortedRoster = useMemo(() => {
    // Filter out any blank row without data (must have name or number, unless it is an intentional quantity-only row from Scenario B)
    const validRows = rawRoster.filter(r => {
      if (r.isQuantityOnly) return true;
      const hasName = r.name && /[\p{L}\p{N}]/u.test(r.name);
      const hasNum = r.number && r.number.trim().length > 0;
      return hasName || hasNum;
    });

    const copy = [...validRows];
    // Rule 2: Sort the entire list by Size (Smallest to Largest)
    copy.sort((a, b) => (parseInt(a.size, 10) || 0) - (parseInt(b.size, 10) || 0));

    // Rule 2: Generate Filename as "[Size] [Global ID]"
    // ONLY Size + Serial Number (e.g. "30 1", "32 2", "38 4")
    return copy.map((row, index) => {
      const globalId = index + 1;
      const cleanSize = cleanSizeOnly(row.size);
      return {
        ...row,
        size: cleanSize,
        globalId,
        filename: `${cleanSize} ${globalId}`
      };
    });
  }, [rawRoster]);

  // --- Columns 6-9: Production Summary Calculation ---
  const summaryBreakdown = useMemo(() => {
    const uniqueSizes = Array.from(new Set(sortedRoster.map(r => r.size)))
      .sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0));

    let grandHalf = 0;
    let grandFull = 0;
    let grandTotal = 0;

    const sizeSummaries = uniqueSizes.map(sz => {
      const subset = sortedRoster.filter(r => r.size === sz);
      const half = subset.filter(r => r.sleeve.toLowerCase().includes('half')).length;
      const full = subset.filter(r => r.sleeve.toLowerCase().includes('full')).length;
      const tot = half + full;

      grandHalf += half;
      grandFull += full;
      grandTotal += tot;

      return {
        frontSize: sz,
        halfSleeve: half,
        fullSleeve: full,
        totalQty: tot,
        isTotalRow: false
      };
    });

    // Total row at the end of the summary section
    sizeSummaries.push({
      frontSize: "Total",
      halfSleeve: grandHalf,
      fullSleeve: grandFull,
      totalQty: grandTotal,
      isTotalRow: true
    });

    return sizeSummaries;
  }, [sortedRoster]);

  // --- Combined 9-Column Table Structure ---
  const nineColumnTable: NineColumnRow[] = useMemo(() => {
    const maxLen = Math.max(sortedRoster.length, summaryBreakdown.length);
    const rows: NineColumnRow[] = [];

    for (let i = 0; i < maxLen; i++) {
      const r = sortedRoster[i];
      const s = summaryBreakdown[i];

      rows.push({
        id: r?.id || `summary-row-${i}`,
        filename: r ? r.filename : "",
        name: r ? r.name : "",
        number: r ? r.number : "",
        size: r ? r.size : "",
        sleeve: r ? r.sleeve : "",
        frontSize: s ? s.frontSize : "",
        halfSleeve: s !== undefined ? s.halfSleeve : "",
        fullSleeve: s !== undefined ? s.fullSleeve : "",
        totalQty: s !== undefined ? s.totalQty : "",
        isTotalRow: s?.isTotalRow || false
      });
    }

    return rows;
  }, [sortedRoster, summaryBreakdown]);

  // Format spreadsheet title: [Sequence] [Team/Project Name]
  const spreadsheetTitle = `${sequenceNumber.trim()} ${teamName.trim() || "ORDER"}`.trim();

  // Export CSV Data Generator
  const generatedCSV = useMemo(() => {
    const header = "Filename,name,number,size,sleeve,Front size,Half Sleeve,Full Sleeve,Total Qty";
    const lines = [header];

    nineColumnTable.forEach(row => {
      // For Excel preservation of leading zeros in numbers (e.g. "08", "09")
      const numCell = row.number ? (row.number.startsWith("0") ? `="${row.number}"` : `"${row.number}"`) : '""';
      lines.push([
        `"${row.filename}"`,
        `"${row.name}"`,
        numCell,
        `"${row.size}"`,
        `"${row.sleeve}"`,
        `"${row.frontSize}"`,
        row.halfSleeve !== "" ? row.halfSleeve : '""',
        row.fullSleeve !== "" ? row.fullSleeve : '""',
        row.totalQty !== "" ? row.totalQty : '""'
      ].join(","));
    });

    return lines.join("\n");
  }, [nineColumnTable]);

  // Handle Clipboard Copy
  const handleCopyTable = () => {
    // Generate clean TSV for direct paste into Excel or Google Sheets
    const header = "Filename\tname\tnumber\tsize\tsleeve\tFront size\tHalf Sleeve\tFull Sleeve\tTotal Qty";
    const lines = [header];

    nineColumnTable.forEach(r => {
      lines.push([
        r.filename,
        r.name,
        r.number,
        r.size,
        r.sleeve,
        r.frontSize,
        r.halfSleeve,
        r.fullSleeve,
        r.totalQty
      ].join("\t"));
    });

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download CSV
  const handleDownloadCSV = () => {
    const blob = new Blob([generatedCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${spreadsheetTitle}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download Excel (.xls)
  const handleDownloadExcel = () => {
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
    <meta charset="utf-8">
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>${teamName.substring(0, 31)}</x:Name>
            <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <style>
      th { background-color: #f3f4f6; color: #111827; font-weight: bold; border: 1px solid #d1d5db; padding: 6px; }
      td { border: 1px solid #e5e7eb; padding: 5px; font-size: 11pt; }
      .text-num { mso-number-format:"\\@"; }
      .total-row { background-color: #dcfce7; font-weight: bold; }
    </style>
    </head>
    <body>
    <table>
      <thead>
        <tr>
          <th>Filename</th>
          <th>name</th>
          <th>number</th>
          <th>size</th>
          <th>sleeve</th>
          <th>Front size</th>
          <th>Half Sleeve</th>
          <th>Full Sleeve</th>
          <th>Total Qty</th>
        </tr>
      </thead>
      <tbody>`;

    nineColumnTable.forEach(r => {
      const totalClass = r.isTotalRow ? ' class="total-row"' : '';
      html += `<tr${totalClass}>
        <td>${r.filename}</td>
        <td>${r.name}</td>
        <td class="text-num">${r.number}</td>
        <td>${r.size}</td>
        <td>${r.sleeve}</td>
        <td>${r.frontSize}</td>
        <td>${r.halfSleeve}</td>
        <td>${r.fullSleeve}</td>
        <td>${r.totalQty}</td>
      </tr>`;
    });

    html += `</tbody></table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${spreadsheetTitle}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Send to Job Details
  const handleSendToJobDetails = () => {
    if (!onImportRecords || sortedRoster.length === 0) return;
    const records: PlayerRecord[] = sortedRoster.map(r => ({
      id: r.id,
      name: r.name,
      number: r.number,
      size: r.size,
      qty: 1,
      sleeve: r.sleeve.toLowerCase().includes('full') ? 'full' : r.sleeve.toLowerCase().includes('none') ? 'none' : 'half'
    }));
    onImportRecords(records);
  };

  // Row Manipulation
  const handleRowChange = (id: string, field: keyof RawPlayerRow, val: string) => {
    setRawRoster(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const handleDeleteRow = (id: string) => {
    setRawRoster(prev => prev.filter(r => r.id !== id));
  };

  const handleAddRow = () => {
    const newRow: RawPlayerRow = {
      id: `manual-${Date.now()}`,
      name: "",
      number: "",
      size: "40",
      sleeve: "Half Sleeve"
    };
    setRawRoster(prev => [...prev, newRow]);
    setEditingRowId(newRow.id);
  };

  // --- Preprocess Image for OCR (Canvas Downscaling + Contrast Enhancement) ---
  const preprocessImage = async (imageSource: string | File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1800; // Optimal resolution for Tesseract OCR

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;

          // Grayscale & contrast normalization
          let minLum = 255;
          let maxLum = 0;
          const lums = new Uint8ClampedArray(data.length / 4);

          for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            lums[j] = lum;
            if (lum < minLum) minLum = lum;
            if (lum > maxLum) maxLum = lum;
          }

          const lumRange = Math.max(1, maxLum - minLum);

          for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            let v = ((lums[j] - minLum) / lumRange) * 255;
            v = v < 120 ? Math.max(0, v * 0.8) : Math.min(255, v * 1.15);
            data[i] = v;
            data[i + 1] = v;
            data[i + 2] = v;
          }

          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.92));
        } catch (e) {
          console.warn('OCR preprocessing fallback:', e);
          resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource));
        }
      };

      img.onerror = () => {
        resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource));
      };

      if (typeof imageSource === 'string') {
        img.src = imageSource;
      } else {
        img.src = URL.createObjectURL(imageSource);
      }
    });
  };

  // --- OCR Image Scanner (Multi-Engine with Local & Cloud Fallbacks) ---
  const processImageOCR = async (imageSource: string | File) => {
    setOcrLoading(true);
    setOcrProgress(10);
    setOcrStatusText("Preparing image & enhancing contrast...");
    setOcrError(null);

    let previewUrl = "";
    if (typeof imageSource !== 'string') {
      previewUrl = URL.createObjectURL(imageSource);
      setScannedImagePreview(previewUrl);
    } else {
      previewUrl = imageSource;
      setScannedImagePreview(imageSource);
    }

    try {
      // 1. Preprocess image
      const processedImage = await preprocessImage(imageSource);
      setOcrProgress(25);
      setOcrStatusText("Initializing AI OCR engine...");

      const { createWorker } = await import('tesseract.js');
      let worker: any = null;

      // Attempt 1: Local offline-ready assets (fastest & immune to CDN blocks)
      try {
        const origin = window.location.origin;
        worker = await createWorker('eng', 1, {
          workerPath: `${origin}/tesseract/worker.min.js`,
          corePath: `${origin}/tesseract`,
          langPath: `${origin}/tesseract/tessdata`,
          gzip: true,
          workerBlobURL: false,
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const p = Math.min(98, Math.round((m.progress || 0) * 100));
              setOcrProgress(p);
              setOcrStatusText(`Reading text characters... ${p}%`);
            }
          }
        });
      } catch (localWorkerErr) {
        console.warn("Local OCR worker failed, falling back to GitHub raw mirror:", localWorkerErr);
        setOcrStatusText("Connecting to online OCR engine...");
        // Attempt 2: GitHub Raw fast traineddata fallback
        worker = await createWorker('eng', 1, {
          langPath: 'https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0_fast',
          gzip: true,
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const p = Math.min(98, Math.round((m.progress || 0) * 100));
              setOcrProgress(p);
              setOcrStatusText(`Reading text characters... ${p}%`);
            }
          }
        });
      }

      setOcrProgress(50);
      setOcrStatusText("Scanning roster names, sizes & numbers...");

      const ret = await worker.recognize(processedImage);
      setOcrProgress(95);
      await worker.terminate();

      const rawExtracted = ret.data.text || "";
      setOcrProgress(100);
      setOcrLoading(false);

      // Clean up OCR extracted text
      const cleanedText = rawExtracted
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0 && !/^[_\-=\*~#\s|:]+$/.test(l))
        .join('\n');

      if (cleanedText.trim().length > 0) {
        setUnstructuredText(cleanedText);
        parseApparelOrder(cleanedText);
      } else {
        setOcrError("No legible text or numbers could be found on the image. Please ensure handwriting is clear and well-lit.");
      }
    } catch (err: any) {
      console.error("OCR Scanner Error:", err);
      setOcrLoading(false);
      setOcrError("Could not scan image text. You can paste the text directly or use your custom Gemini Gem for Vision AI transcription.");
    }
  };

  // Clipboard Paste Listener for Images (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) { 
            processImageOCR(blob); 
            break; 
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const totalJerseyCount = sortedRoster.length;

  return (
    <div className="help-center-container fade-in" style={{ padding: '24px 32px', maxWidth: '1520px', margin: '0 auto' }}>

      {/* Hero Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px', color: '#111827' }}>
          <Sparkles size={24} style={{ color: '#E4572E' }} /> AI Data Refiner
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', lineHeight: '1.5' }}>
          Specialized Data Formatting Agent for sports apparel manufacturing. Smartly parses player rosters and size batches, sorts by size ascending, preserves leading zeros in jersey numbers, and creates the 9-column production spreadsheet with size-wise summary.
        </p>
      </div>

      {/* Main Dual Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '430px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* ── LEFT COLUMN: Raw Order Input & OCR Studio ── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DE', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          
          {/* Card Title Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#111827' }}>
              <FileText size={17} style={{ color: '#E4572E' }} /> Raw Order Input
            </h3>
            <span style={{ fontSize: '11px', color: '#15803D', fontWeight: '700', background: '#DCFCE7', padding: '2px 8px', borderRadius: '12px' }}>
              Gemini Gem Engine
            </span>
          </div>

          {/* 1. Quick Image OCR Dropzone Bar */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file && file.type.startsWith('image/')) processImageOCR(file);
            }}
            style={{
              background: isDragging ? '#FFF0EB' : '#FAF8F5',
              border: isDragging ? '2px dashed #E4572E' : '1px dashed #D1D5DB',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Click or drag an image here to scan text"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: '#FFF0EB',
                border: '1px solid #FCD7C8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#E4572E',
                flexShrink: 0
              }}>
                <Camera size={17} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#111827' }}>
                  Scan Note / Photo (OCR)
                </div>
                <div style={{ fontSize: '10px', color: '#6B7280' }}>
                  Click to choose, drop image, or paste via <strong>Ctrl+V</strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 11px',
                fontSize: '11px',
                fontWeight: '800',
                background: '#FFFFFF',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#374151'
              }}
            >
              <Upload size={12} style={{ color: '#E4572E' }} /> Choose Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processImageOCR(file);
                e.target.value = '';
              }}
            />
          </div>

          {/* OCR Progress Loading State */}
          {ocrLoading && (
            <div style={{ background: '#FFF0EB', border: '1px solid #FCD7C8', borderRadius: '8px', padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#E4572E', fontWeight: '800', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> {ocrStatusText || "Scanning note..."}
                </span>
                <span>{ocrProgress}%</span>
              </div>
              <div style={{ height: '6px', background: '#FCD7C8', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${ocrProgress}%`, background: '#E4572E', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          )}

          {/* OCR Error Notice with Gemini Gem Fallback */}
          {ocrError && !ocrLoading && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <AlertCircle size={16} style={{ color: '#DC2626', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#991B1B' }}>
                      Image Scan Notice
                    </div>
                    <div style={{ fontSize: '11px', color: '#7F1D1D', lineHeight: '1.4', marginTop: '2px' }}>
                      {ocrError}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOcrError(null)}
                  style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '2px' }}
                  title="Dismiss error"
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px', borderTop: '1px solid #FEE2E2' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Upload size={11} /> Try Another Image
                </button>
                <a
                  href="https://gemini.google.com/gem/1vc3MbyzLtt5RspOpQualSpuViseurHd4?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#FFF0EB',
                    border: '1px solid #FCD7C8',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#E4572E',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'none'
                  }}
                >
                  <Sparkles size={11} /> Open Gemini Gem (Vision AI)
                </a>
              </div>
            </div>
          )}

          {/* Scanned Image Preview Thumbnail */}
          {scannedImagePreview && !ocrLoading && (
            <div style={{ background: '#FAF8F5', border: '1px solid #E8E4DE', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={scannedImagePreview} alt="Scanned" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #D1D5DB' }} />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#15803D' }}>✅ Image scanned &amp; parsed</div>
                  <div style={{ fontSize: '10px', color: '#6B7280' }}>Data extracted into input below.</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScannedImagePreview(null)}
                style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
                title="Remove preview"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* 2. Text Input Area with Presets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            
            {/* Quick Sample Presets */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: '#4B5563', fontWeight: '700' }}>
                Paste WhatsApp, Email, or Order Text:
              </span>

              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) {
                        setUnstructuredText(text);
                        parseApparelOrder(text);
                      }
                    } catch {}
                  }}
                  style={{
                    background: '#FAF8F5',
                    border: '1px solid #E8E4DE',
                    borderRadius: '5px',
                    padding: '3px 7px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#4B5563',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Paste from clipboard"
                >
                  <ClipboardPaste size={11} /> Paste
                </button>

                {unstructuredText && (
                  <button
                    type="button"
                    onClick={() => {
                      setUnstructuredText("");
                      setRawRoster([]);
                    }}
                    style={{
                      background: '#FAF8F5',
                      border: '1px solid #E8E4DE',
                      borderRadius: '5px',
                      padding: '3px 7px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#9CA3AF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Trash2 size={11} /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Presets Toolbar */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  setUnstructuredText(SAMPLE_NITIN_TITANS);
                  parseApparelOrder(SAMPLE_NITIN_TITANS);
                }}
                style={{
                  flex: 1,
                  background: '#FFF0EB',
                  border: '1px solid #FCD7C8',
                  color: '#9A3412',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                ⚡ Sample A: NITIN TITANS (Players)
              </button>

              <button
                type="button"
                onClick={() => {
                  setUnstructuredText(SAMPLE_SCENARIO_B);
                  parseApparelOrder(SAMPLE_SCENARIO_B);
                }}
                style={{
                  flex: 1,
                  background: '#FAF8F5',
                  border: '1px solid #E8E4DE',
                  color: '#374151',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                ⚡ Sample B: Blank Quantities (34-6)
              </button>
            </div>

            {/* Monospace Textarea */}
            <textarea
              rows={10}
              value={unstructuredText}
              onChange={(e) => setUnstructuredText(e.target.value)}
              placeholder={"Paste team name and lines:\n\nNITIN TITANS\n1. NITIN : L : 08 : OWNER\n2. SRK SONU : L: 09\n3. HITESH : XL : 18\n\nOr Quantities Only (Scenario B):\n34 - 6\n38 - 10\n42 - 4"}
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '12px',
                lineHeight: '1.6',
                resize: 'vertical',
                width: '100%',
                background: '#FAF8F5',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                padding: '12px 14px',
                color: '#111827',
                boxSizing: 'border-box',
                outline: 'none',
                minHeight: '200px'
              }}
            />
          </div>

          {/* 3. Collapsible Smart Sizing Guide */}
          <div style={{ border: '1px solid #E8E4DE', borderRadius: '8px', overflow: 'hidden', background: '#FAF8F5' }}>
            <button
              type="button"
              onClick={() => setShowSizeGuide(!showSizeGuide)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#FAF8F5',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '700',
                color: '#4B5563'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={13} style={{ color: '#E4572E' }} />
                Factory Size Matrix: XS=36, S=38, M=40, L=42, XL=44, 2XL=46...
              </span>
              {showSizeGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showSizeGuide && (
              <div style={{ padding: '10px 12px', borderTop: '1px solid #E8E4DE', background: '#FFFFFF', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <span style={{ fontWeight: '800', color: '#111827' }}>Adult Letter Size Conversions:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    <span style={{ padding: '2px 6px', background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '4px' }}><strong>XS</strong> &rarr; 36</span>
                    <span style={{ padding: '2px 6px', background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '4px' }}><strong>S</strong> &rarr; 38</span>
                    <span style={{ padding: '2px 6px', background: '#FFF0EB', border: '1px solid #FCD7C8', color: '#E4572E', borderRadius: '4px' }}><strong>M</strong> &rarr; 40</span>
                    <span style={{ padding: '2px 6px', background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '4px' }}><strong>L</strong> &rarr; 42</span>
                    <span style={{ padding: '2px 6px', background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '4px' }}><strong>XL</strong> &rarr; 44</span>
                    <span style={{ padding: '2px 6px', background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '4px' }}><strong>2XL</strong> &rarr; 46</span>
                    <span style={{ padding: '2px 6px', background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '4px' }}><strong>3XL</strong> &rarr; 48</span>
                    <span style={{ padding: '2px 6px', background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '4px' }}><strong>4XL</strong> &rarr; 50</span>
                    <span style={{ padding: '2px 6px', background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '4px' }}><strong>5XL</strong> &rarr; 52</span>
                    <span style={{ padding: '2px 6px', background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '4px' }}><strong>6XL</strong> &rarr; 54</span>
                    <span style={{ padding: '2px 6px', background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '4px' }}><strong>7XL</strong> &rarr; 56</span>
                    <span style={{ padding: '2px 6px', background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '4px' }}><strong>8XL</strong> &rarr; 58</span>
                    <span style={{ padding: '2px 6px', background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '4px' }}><strong>9XL</strong> &rarr; 60</span>
                  </div>
                </div>

                <div>
                  <span style={{ fontWeight: '800', color: '#111827' }}>Youth &amp; Kids Age Conversions:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    <span style={{ padding: '2px 6px', background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '4px' }}><strong>6m - 1y</strong> &rarr; 18</span>
                    <span style={{ padding: '2px 6px', background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '4px' }}><strong>1 year</strong> &rarr; 20</span>
                    <span style={{ padding: '2px 6px', background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '4px' }}><strong>1.5 year</strong> &rarr; 22</span>
                    <span style={{ padding: '2px 6px', background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '4px' }}><strong>2-3 year</strong> &rarr; 24</span>
                    <span style={{ padding: '2px 6px', background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '4px' }}><strong>4-5 year</strong> &rarr; 26</span>
                    <span style={{ padding: '2px 6px', background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '4px' }}><strong>6-8 year</strong> &rarr; 28</span>
                    <span style={{ padding: '2px 6px', background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '4px' }}><strong>10-11 year</strong> &rarr; 30</span>
                    <span style={{ padding: '2px 6px', background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '4px' }}><strong>11-12 year</strong> &rarr; 32</span>
                    <span style={{ padding: '2px 6px', background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '4px' }}><strong>13-14 year</strong> &rarr; 34</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Gemini AI Callout Banner */}
          <div style={{
            background: '#FFF0EB',
            border: '1px solid #FCD7C8',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} style={{ color: '#E4572E' }} />
              <div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#9A3412' }}>
                  Custom Gemini Refiner Gem
                </div>
                <div style={{ fontSize: '10px', color: '#C2410C' }}>
                  Using your sports apparel data formatting rules
                </div>
              </div>
            </div>

            <a
              href="https://gemini.google.com/gem/1vc3MbyzLtt5RspOpQualSpuViseurHd4?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: '800',
                background: '#FFFFFF',
                border: '1px solid #FCD7C8',
                borderRadius: '6px',
                color: '#C2410C',
                textDecoration: 'none'
              }}
            >
              <ExternalLink size={12} /> Open Gem
            </a>
          </div>

          {/* 5. Primary Action Button */}
          <button
            type="button"
            className="btn"
            onClick={handleRefine}
            disabled={isParsing || !unstructuredText.trim()}
            style={{
              width: '100%',
              padding: '13px 20px',
              fontSize: '13px',
              fontWeight: '900',
              letterSpacing: '0.03em',
              borderRadius: '10px',
              border: 'none',
              background: !unstructuredText.trim() 
                ? '#F3F4F6' 
                : 'linear-gradient(135deg, #E4572E 0%, #EA580C 100%)',
              color: !unstructuredText.trim() ? '#9CA3AF' : '#FFFFFF',
              boxShadow: !unstructuredText.trim() 
                ? 'none' 
                : '0 4px 14px rgba(228, 87, 46, 0.35)',
              cursor: !unstructuredText.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            {isParsing ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing Rules…
              </>
            ) : (
              <>
                <Sparkles size={16} /> Refine &amp; Generate 9-Column Table
              </>
            )}
          </button>

        </div>

        {/* ── RIGHT COLUMN: 9-Column Spreadsheet Output ── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E8E4DE', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          
          {/* Card Header & Team / Spreadsheet Title Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#DCFCE7', border: '1px solid #86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D' }}>
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Rule 4: Spreadsheet &amp; Team Naming
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <input
                    type="text"
                    value={sequenceNumber}
                    onChange={(e) => setSequenceNumber(e.target.value)}
                    style={{
                      width: '38px',
                      padding: '3px 6px',
                      fontSize: '12px',
                      fontWeight: '900',
                      textAlign: 'center',
                      background: '#FAF8F5',
                      border: '1px solid #D1D5DB',
                      borderRadius: '5px',
                      color: '#111827',
                      outline: 'none'
                    }}
                    title="Sequence Number (01, 02...)"
                  />
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value.toUpperCase())}
                    placeholder="TEAM / PROJECT NAME"
                    style={{
                      width: '220px',
                      padding: '3px 8px',
                      fontSize: '13px',
                      fontWeight: '900',
                      background: '#FAF8F5',
                      border: '1px solid #D1D5DB',
                      borderRadius: '5px',
                      color: '#111827',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Total Badge & Quick Counts */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '4px 12px', borderRadius: '20px', fontWeight: '900' }}>
                ✓ {totalJerseyCount} Jerseys Processed
              </span>
              <span style={{ fontSize: '11px', background: '#FAF8F5', color: '#4B5563', border: '1px solid #E8E4DE', padding: '4px 10px', borderRadius: '20px', fontWeight: '700' }}>
                Sorted by Size (Ascending)
              </span>
            </div>

          </div>

          {nineColumnTable.length > 0 ? (
            <>
              {/* ── EXACT 9-COLUMN TABLE (Rule 3) ── */}
              <div style={{ border: '1px solid #E8E4DE', borderRadius: '10px', overflow: 'hidden', maxHeight: '460px', overflowY: 'auto', background: '#FFFFFF', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '850px' }}>
                  
                  {/* Category Header Row */}
                  <thead>
                    <tr style={{ background: '#FAF8F5', borderBottom: '1px solid #E8E4DE' }}>
                      <th colSpan={5} style={{ padding: '7px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '900', color: '#1E293B', letterSpacing: '0.04em', borderRight: '2px solid #D1D5DB' }}>
                        ROSTER (PLAYER DETAILS &amp; GLOBAL FILENAMES)
                      </th>
                      <th colSpan={4} style={{ padding: '7px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '900', color: '#15803D', letterSpacing: '0.04em', background: '#F0FDF4' }}>
                        PRODUCTION SUMMARY (SIZE WISE BREAKDOWN)
                      </th>
                      <th style={{ width: '60px', background: '#FAF8F5' }}></th>
                    </tr>
                    
                    {/* Exact 9 Columns Header */}
                    <tr style={{ background: '#F3F0EA', borderBottom: '2px solid #E8E4DE', position: 'sticky', top: 0, zIndex: 2 }}>
                      <th style={{ padding: '9px 10px', textAlign: 'left', fontWeight: '800', color: '#374151', width: '90px' }}>Filename</th>
                      <th style={{ padding: '9px 10px', textAlign: 'left', fontWeight: '800', color: '#374151' }}>name</th>
                      <th style={{ padding: '9px 10px', textAlign: 'center', fontWeight: '800', color: '#374151', width: '75px' }}>number</th>
                      <th style={{ padding: '9px 10px', textAlign: 'center', fontWeight: '800', color: '#374151', width: '65px' }}>size</th>
                      <th style={{ padding: '9px 10px', textAlign: 'center', fontWeight: '800', color: '#374151', width: '100px', borderRight: '2px solid #D1D5DB' }}>sleeve</th>
                      
                      {/* Summary Columns */}
                      <th style={{ padding: '9px 10px', textAlign: 'center', fontWeight: '800', color: '#166534', width: '80px', background: '#DCFCE7' }}>Front size</th>
                      <th style={{ padding: '9px 10px', textAlign: 'center', fontWeight: '800', color: '#166534', width: '85px', background: '#DCFCE7' }}>Half Sleeve</th>
                      <th style={{ padding: '9px 10px', textAlign: 'center', fontWeight: '800', color: '#166534', width: '85px', background: '#DCFCE7' }}>Full Sleeve</th>
                      <th style={{ padding: '9px 10px', textAlign: 'center', fontWeight: '800', color: '#166534', width: '80px', background: '#DCFCE7' }}>Total Qty</th>
                      
                      <th style={{ padding: '9px 8px', textAlign: 'center', fontWeight: '800', color: '#6B7280', width: '60px' }}>Edit</th>
                    </tr>
                  </thead>

                  <tbody>
                    {nineColumnTable.map((row, index) => {
                      const isEditing = editingRowId === row.id;

                      return (
                        <tr 
                          key={row.id || index}
                          style={{ 
                            borderBottom: '1px solid #F3F4F6',
                            background: row.isTotalRow ? '#F0FDF4' : index % 2 === 0 ? '#FFFFFF' : '#FCFBFA',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          
                          {/* Col 1: Filename [Size] [Global ID] - ONLY Size + Serial Number */}
                          <td style={{ padding: '8px 10px' }}>
                            {row.filename ? (
                              <span style={{
                                fontFamily: 'ui-monospace, monospace',
                                fontWeight: '900',
                                fontSize: '11px',
                                background: '#FFF0EB',
                                color: '#9A3412',
                                border: '1px solid #FCD7C8',
                                padding: '2px 7px',
                                borderRadius: '5px',
                                whiteSpace: 'nowrap'
                              }}>
                                {row.filename}
                              </span>
                            ) : (
                              <span style={{ color: '#D1D5DB' }}>—</span>
                            )}
                          </td>

                          {/* Col 2: name */}
                          <td style={{ padding: '8px 10px' }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={row.name}
                                onChange={(e) => handleRowChange(row.id, 'name', e.target.value.toUpperCase())}
                                placeholder="Blank row"
                                style={{ width: '100%', padding: '3px 6px', fontSize: '12px', background: '#FFFFFF', border: '1px solid #E4572E', borderRadius: '5px', outline: 'none' }}
                              />
                            ) : (
                              <span style={{ fontWeight: '700', color: row.name ? '#111827' : '#9CA3AF', fontStyle: row.name ? 'normal' : 'italic' }}>
                                {row.name || '(Blank)'}
                              </span>
                            )}
                          </td>

                          {/* Col 3: number (Preserve leading zero) */}
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={row.number}
                                onChange={(e) => handleRowChange(row.id, 'number', e.target.value)}
                                placeholder="—"
                                style={{ width: '55px', padding: '3px 5px', fontSize: '12px', textAlign: 'center', background: '#FFFFFF', border: '1px solid #E4572E', borderRadius: '5px', outline: 'none' }}
                              />
                            ) : (
                              row.number ? (
                                <span style={{
                                  fontFamily: 'ui-monospace, monospace',
                                  fontWeight: '900',
                                  color: '#E4572E',
                                  fontSize: '13px'
                                }}>
                                  {row.number}
                                </span>
                              ) : (
                                <span style={{ color: '#D1D5DB' }}>—</span>
                              )
                            )}
                          </td>

                          {/* Col 4: size */}
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            {isEditing ? (
                              <select
                                value={row.size}
                                onChange={(e) => handleRowChange(row.id, 'size', e.target.value)}
                                style={{ padding: '3px 4px', fontSize: '11px', background: '#FFFFFF', border: '1px solid #E4572E', borderRadius: '5px', outline: 'none' }}
                              >
                                {ALL_SYSTEM_SIZES.map(s => (
                                  <option key={s} value={s}>
                                    {s} {SIZE_DISPLAY_LABEL[s] ? `(${SIZE_DISPLAY_LABEL[s]})` : ''}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              row.size ? (
                                <span style={{
                                  display: 'inline-block',
                                  fontWeight: '800',
                                  color: '#1F2937',
                                  padding: '2px 6px',
                                  background: '#F3F0EA',
                                  borderRadius: '5px',
                                  fontSize: '11px'
                                }}>
                                  {row.size}
                                </span>
                              ) : (
                                <span style={{ color: '#D1D5DB' }}>—</span>
                              )
                            )}
                          </td>

                          {/* Col 5: sleeve */}
                          <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '2px solid #D1D5DB' }}>
                            {isEditing ? (
                              <select
                                value={row.sleeve}
                                onChange={(e) => handleRowChange(row.id, 'sleeve', e.target.value)}
                                style={{ padding: '3px 4px', fontSize: '11px', background: '#FFFFFF', border: '1px solid #E4572E', borderRadius: '5px', outline: 'none' }}
                              >
                                <option value="Half Sleeve">Half Sleeve</option>
                                <option value="Full Sleeve">Full Sleeve</option>
                                <option value="No Sleeve">No Sleeve</option>
                              </select>
                            ) : (
                              row.sleeve ? (
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 7px',
                                  borderRadius: '5px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  background: row.sleeve === 'Full Sleeve' ? '#DBEAFE' : row.sleeve === 'No Sleeve' ? '#F3F4F6' : '#DCFCE7',
                                  color: row.sleeve === 'Full Sleeve' ? '#1D4ED8' : row.sleeve === 'No Sleeve' ? '#4B5563' : '#15803D'
                                }}>
                                  {row.sleeve}
                                </span>
                              ) : (
                                <span style={{ color: '#D1D5DB' }}>—</span>
                              )
                            )}
                          </td>

                          {/* Col 6: Front size (Summary) */}
                          <td style={{
                            padding: '8px 10px',
                            textAlign: 'center',
                            fontWeight: row.isTotalRow ? '900' : '800',
                            color: row.isTotalRow ? '#15803D' : '#374151',
                            background: row.isTotalRow ? '#DCFCE7' : undefined,
                            borderTop: row.isTotalRow ? '2px solid #86EFAC' : undefined
                          }}>
                            {row.frontSize ? (
                              row.isTotalRow ? (
                                <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TOTAL</span>
                              ) : (
                                <span style={{ padding: '2px 6px', background: '#F3F0EA', borderRadius: '4px' }}>
                                  {row.frontSize}
                                </span>
                              )
                            ) : ''}
                          </td>

                          {/* Col 7: Half Sleeve (Summary) */}
                          <td style={{
                            padding: '8px 10px',
                            textAlign: 'center',
                            fontWeight: row.isTotalRow ? '900' : '600',
                            color: row.isTotalRow ? '#15803D' : '#1F2937',
                            background: row.isTotalRow ? '#DCFCE7' : undefined,
                            borderTop: row.isTotalRow ? '2px solid #86EFAC' : undefined
                          }}>
                            {row.halfSleeve !== "" ? row.halfSleeve : ''}
                          </td>

                          {/* Col 8: Full Sleeve (Summary) */}
                          <td style={{
                            padding: '8px 10px',
                            textAlign: 'center',
                            fontWeight: row.isTotalRow ? '900' : '600',
                            color: row.isTotalRow ? '#15803D' : '#1F2937',
                            background: row.isTotalRow ? '#DCFCE7' : undefined,
                            borderTop: row.isTotalRow ? '2px solid #86EFAC' : undefined
                          }}>
                            {row.fullSleeve !== "" ? row.fullSleeve : ''}
                          </td>

                          {/* Col 9: Total Qty (Summary) */}
                          <td style={{
                            padding: '8px 10px',
                            textAlign: 'center',
                            fontWeight: '900',
                            color: row.isTotalRow ? '#15803D' : '#111827',
                            fontSize: row.isTotalRow ? '13px' : '12px',
                            background: row.isTotalRow ? '#DCFCE7' : undefined,
                            borderTop: row.isTotalRow ? '2px solid #86EFAC' : undefined
                          }}>
                            {row.totalQty !== "" ? row.totalQty : ''}
                          </td>

                          {/* Row Actions */}
                          <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                            {row.filename && (
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                {isEditing ? (
                                  <button
                                    type="button"
                                    onClick={() => setEditingRowId(null)}
                                    style={{ padding: '2px 6px', fontSize: '10px', fontWeight: '800', background: '#16A34A', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                  >
                                    Done
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setEditingRowId(row.id)}
                                    style={{ padding: '3px', color: '#4B5563', background: '#FAF8F5', border: '1px solid #D1D5DB', borderRadius: '4px', cursor: 'pointer' }}
                                    title="Edit Row"
                                  >
                                    <Edit2 size={11} />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteRow(row.id)}
                                  style={{ padding: '3px', color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '4px', cursor: 'pointer' }}
                                  title="Delete Row"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            )}
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>

                </table>
              </div>

              {/* Add Row & Raw CSV Drawer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={handleAddRow}
                  style={{
                    background: '#FAF8F5',
                    border: '1px solid #E8E4DE',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={13} style={{ color: '#E4572E' }} /> Add Player Row
                </button>

                <button
                  type="button"
                  onClick={() => setShowRawCsv(!showRawCsv)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#6B7280',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{showRawCsv ? '▾ Hide' : '▸ View'} 9-Column CSV</span>
                </button>
              </div>

              {/* Collapsible CSV View */}
              {showRawCsv && (
                <div style={{ background: '#FAF8F5', border: '1px solid #E8E4DE', borderRadius: '8px', padding: '10px' }}>
                  <textarea
                    rows={5}
                    value={generatedCSV}
                    readOnly
                    style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: '11px',
                      background: 'transparent',
                      resize: 'vertical',
                      color: '#15803D',
                      border: 'none',
                      padding: 0,
                      width: '100%',
                      outline: 'none',
                      lineHeight: '1.4'
                    }}
                  />
                </div>
              )}

              {/* Export & Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #F3F4F6' }}>
                
                {/* Copy Table / CSV */}
                <button
                  type="button"
                  onClick={handleCopyTable}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '11px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: '#FAF8F5',
                    border: '1px solid #E8E4DE',
                    borderRadius: '8px',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                >
                  {copied ? (
                    <>
                      <Check size={14} style={{ color: '#15803D' }} /> Copied Table!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy Table (TSV)
                    </>
                  )}
                </button>

                {/* Download CSV */}
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '11px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: '#FAF8F5',
                    border: '1px solid #E8E4DE',
                    borderRadius: '8px',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={14} /> Export .CSV
                </button>

                {/* Download Excel (.xls) */}
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '11px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: '#FAF8F5',
                    border: '1px solid #E8E4DE',
                    borderRadius: '8px',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                >
                  <FileSpreadsheet size={14} style={{ color: '#15803D' }} /> Export .XLS
                </button>

                {/* Send to Job Details */}
                <button
                  type="button"
                  onClick={handleSendToJobDetails}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '11px 16px',
                    fontSize: '12px',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(21, 128, 61, 0.25)'
                  }}
                >
                  <span>Send to Job Details</span> <ArrowRight size={14} />
                </button>

              </div>
            </>
          ) : (
            /* Empty State */
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '50px 24px',
              textAlign: 'center',
              background: '#FAF8F5',
              borderRadius: '10px',
              border: '1px dashed #D1D5DB',
              minHeight: '380px',
              gap: '14px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#FFF0EB',
                border: '1px solid #FCD7C8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#E4572E'
              }}>
                <FileSpreadsheet size={28} />
              </div>

              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '800', color: '#111827' }}>
                  Awaiting Order Data
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', maxWidth: '380px', lineHeight: '1.5' }}>
                  Paste unstructured orders on the left or scan handwritten sheets to generate the 9-column production spreadsheet.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUnstructuredText(SAMPLE_NITIN_TITANS);
                  parseApparelOrder(SAMPLE_NITIN_TITANS);
                }}
                style={{
                  marginTop: '6px',
                  background: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  padding: '7px 14px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#374151',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
              >
                Load Sample Order (Nitin Titans)
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
