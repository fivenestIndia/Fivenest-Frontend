/**
 * FiveNest Robust Font Loader & Sanitizer
 * 
 * Automatically repairs corrupted font headers (e.g. legacy Windows Type 1 converted TTFs,
 * invalid post format 2.0 indices like 65535, malformed legacy kern searchRange values,
 * unconsumed trailing garbage bytes from downloaders/scrapers, and table checksum mismatches).
 */

// Convert ArrayBuffer or Uint8Array to a Base64 Data URL safely in chunks
export function arrayBufferToDataUrl(buffer: ArrayBuffer | Uint8Array, mime = 'font/truetype'): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return `data:${mime};charset=utf-8;base64,${btoa(binary)}`;
}

// Convert Base64 Data URL to ArrayBuffer
export function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const commaIndex = dataUrl.indexOf(',');
  const base64 = commaIndex !== -1 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Extract true font family name from TTF/OTF 'name' table
export function extractFontFamily(buffer: ArrayBuffer, fallbackFilename: string): string {
  try {
    const data = new Uint8Array(buffer.slice(0));
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    if (data.length < 12) return formatFallbackName(fallbackFilename);

    const numTables = view.getUint16(4);
    let nameOffset = 0;
    for (let i = 0; i < numTables; i++) {
      const dirOffset = 12 + i * 16;
      if (dirOffset + 16 > data.length) break;
      const tag = view.getUint32(dirOffset);
      if (tag === 0x6E616D65) { // "name"
        nameOffset = view.getUint32(dirOffset + 8);
        break;
      }
    }

    if (!nameOffset || nameOffset + 6 > data.length) return formatFallbackName(fallbackFilename);
    const count = view.getUint16(nameOffset + 2);
    const stringOffset = nameOffset + view.getUint16(nameOffset + 4);

    let fullName = '';
    let familyName = '';

    for (let i = 0; i < count; i++) {
      const rec = nameOffset + 6 + i * 12;
      if (rec + 12 > data.length) break;
      const platformId = view.getUint16(rec);
      const nameId = view.getUint16(rec + 6);
      const length = view.getUint16(rec + 8);
      const strOffset = stringOffset + view.getUint16(rec + 10);

      if (strOffset + length <= data.length) {
        let str = '';
        if (platformId === 0 || platformId === 3) { // Unicode or Windows UTF-16BE
          for (let b = 0; b < length; b += 2) {
            str += String.fromCharCode(view.getUint16(strOffset + b));
          }
        } else { // Macintosh / ASCII
          for (let b = 0; b < length; b++) {
            str += String.fromCharCode(data[strOffset + b]);
          }
        }
        str = str.trim().replace(/\0/g, '');
        if (str) {
          if (nameId === 1 && !familyName) familyName = str;
          if (nameId === 4 && !fullName) fullName = str;
        }
      }
    }

    const candidate = familyName || fullName;
    if (candidate && candidate.length > 1 && candidate.length < 60) {
      return candidate.trim();
    }
  } catch (e) {
    console.warn("Failed to extract font name from binary:", e);
  }

  return formatFallbackName(fallbackFilename);
}

function formatFallbackName(filename: string): string {
  let name = filename.replace(/\.[a-zA-Z0-9]+$/, ''); // remove extension
  // Remove trailing hash suffixes like -587ebe5a59211 or _1234abcd
  name = name.replace(/[-_][a-f0-9]{8,}$/i, '');
  // Replace hyphens/underscores with spaces
  name = name.replace(/[-_]+/g, ' ').trim();
  // Capitalize words
  return name.replace(/\b\w/g, c => c.toUpperCase()) || 'Custom Font';
}

/**
 * Cleanly rebuilds and repairs a TTF/OTF font file:
 * - Trims unconsumed trailing bytes/garbage after the last table (causes OTS drop)
 * - Converts or repairs 'post' table (Format 3.0 eliminates glyph index 65535 corruption)
 * - Repairs or removes malformed legacy 'kern' tables (fixes searchRange mismatches)
 * - Strictly satisfies table 4-byte alignment and recalculates head checkSumAdjustment
 */
export function cleanRebuildFont(
  buffer: ArrayBuffer,
  options: { postFormat3?: boolean; dropKern?: boolean } = {}
): ArrayBuffer {
  try {
    const data = new Uint8Array(buffer);
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    if (data.length < 12) return buffer;

    const sfntVersion = view.getUint32(0);
    // 0x00010000 (TrueType), 0x4F54544F (OTTO/CFF), 0x74727565 (true)
    if (sfntVersion !== 0x00010000 && sfntVersion !== 0x4F54544F && sfntVersion !== 0x74727565) {
      return buffer;
    }

    const numTables = view.getUint16(4);
    const tables: { tag: string; offset: number; length: number }[] = [];

    for (let i = 0; i < numTables; i++) {
      const o = 12 + i * 16;
      if (o + 16 > data.length) break;
      const tag = String.fromCharCode(data[o], data[o + 1], data[o + 2], data[o + 3]);
      const offset = view.getUint32(o + 8);
      const length = view.getUint32(o + 12);
      if (offset + length <= data.length) {
        if (options.dropKern && tag === 'kern') continue;
        tables.push({ tag, offset, length });
      }
    }

    if (tables.length === 0) return buffer;

    // OpenType spec strictly mandates alphabetical table tag order in directory
    tables.sort((a, b) => a.tag.localeCompare(b.tag));

    const newNumTables = tables.length;
    const maxPow2 = 1 << Math.floor(Math.log2(newNumTables));
    const searchRange = maxPow2 * 16;
    const entrySelector = Math.floor(Math.log2(maxPow2));
    const rangeShift = newNumTables * 16 - searchRange;

    const newHeaderLen = 12 + newNumTables * 16;
    let curOffset = (newHeaderLen + 3) & ~3;

    const tableDataList: {
      tag: string;
      newOffset: number;
      length: number;
      checkSum: number;
      data: Uint8Array;
    }[] = [];

    for (const t of tables) {
      let tData = new Uint8Array(data.subarray(t.offset, t.offset + t.length));

      // Option 1: Cleanly convert post table to Format 3.0 (32 bytes)
      if (t.tag === 'post' && options.postFormat3 && tData.length >= 32) {
        const p3 = new Uint8Array(32);
        p3.set(tData.subarray(0, 32));
        const p3View = new DataView(p3.buffer);
        p3View.setUint32(0, 0x00030000); // Format 3.0
        tData = p3;
      } else if (t.tag === 'post' && !options.postFormat3 && tData.length >= 34) {
        // Option 2: Clamp corrupted post format 2.0 glyph name indices (such as 65535)
        const pView = new DataView(tData.buffer, tData.byteOffset, tData.byteLength);
        if (pView.getUint32(0) === 0x00020000) {
          const numGlyphs = pView.getUint16(32);
          let customStrings = 0;
          let curr = 34 + numGlyphs * 2;
          while (curr < tData.length) {
            const sLen = tData[curr];
            curr += 1 + sLen;
            customStrings++;
          }
          const maxAllowed = 258 + customStrings;
          for (let g = 0; g < numGlyphs; g++) {
            if (34 + g * 2 + 2 <= tData.length) {
              const idx = pView.getUint16(34 + g * 2);
              if (idx >= maxAllowed) {
                pView.setUint16(34 + g * 2, 0); // Clamp to .notdef
              }
            }
          }
        }
      }

      // Repair malformed legacy kern table searchRange
      if (t.tag === 'kern' && tData.length >= 14) {
        const kView = new DataView(tData.buffer, tData.byteOffset, tData.byteLength);
        if (kView.getUint16(0) === 0 && kView.getUint16(2) >= 1) {
          if ((kView.getUint16(4) & 0x01) === 0x01) { // Format 0
            const nPairs = kView.getUint16(6);
            const maxPow = 1 << Math.floor(Math.log2(nPairs || 1));
            kView.setUint16(8, maxPow * 6);
            kView.setUint16(10, Math.floor(Math.log2(maxPow)));
            kView.setUint16(12, nPairs * 6 - maxPow * 6);
          }
        }
      }

      // Compute table checksum
      let sum = 0;
      const pLen = (tData.length + 3) & ~3;
      for (let p = 0; p < pLen; p += 4) {
        let word = 0;
        for (let b = 0; b < 4; b++) {
          word = (word << 8) | (p + b < tData.length ? tData[p + b] : 0);
        }
        sum = (sum + (word >>> 0)) >>> 0;
      }

      tableDataList.push({
        tag: t.tag,
        newOffset: curOffset,
        length: tData.length,
        checkSum: sum,
        data: tData,
      });
      curOffset = (curOffset + tData.length + 3) & ~3;
    }

    const out = new Uint8Array(curOffset);
    const outView = new DataView(out.buffer);
    outView.setUint32(0, sfntVersion);
    outView.setUint16(4, newNumTables);
    outView.setUint16(6, searchRange);
    outView.setUint16(8, entrySelector);
    outView.setUint16(10, rangeShift);

    let headOffset = 0;
    for (let i = 0; i < tables.length; i++) {
      const t = tableDataList[i];
      const dirOffset = 12 + i * 16;
      for (let c = 0; c < 4; c++) out[dirOffset + c] = t.tag.charCodeAt(c);
      outView.setUint32(dirOffset + 4, t.checkSum);
      outView.setUint32(dirOffset + 8, t.newOffset);
      outView.setUint32(dirOffset + 12, t.length);

      out.set(t.data, t.newOffset);
      if (t.tag === 'head') headOffset = t.newOffset;
    }

    // Recompute head checkSumAdjustment
    if (headOffset && headOffset + 12 <= out.length) {
      outView.setUint32(headOffset + 8, 0);
      let totalSum = 0;
      for (let i = 0; i < out.length; i += 4) {
        let word = 0;
        for (let b = 0; b < 4; b++) {
          word = (word << 8) | (i + b < out.length ? out[i + b] : 0);
        }
        totalSum = (totalSum + (word >>> 0)) >>> 0;
      }
      const adj = (0xB1B0AFBA - totalSum) >>> 0;
      outView.setUint32(headOffset + 8, adj);
    }

    return out.buffer;
  } catch (err) {
    console.warn("Font rebuild error, using original buffer:", err);
    return buffer;
  }
}

// Backward-compatible exports
export function sanitizeFontPostTable(buffer: ArrayBuffer): { buffer: ArrayBuffer; repaired: boolean } {
  const repaired = cleanRebuildFont(buffer, { postFormat3: false, dropKern: false });
  return { buffer: repaired, repaired: repaired.byteLength !== buffer.byteLength };
}

export function convertPostToFormat3(buffer: ArrayBuffer): { buffer: ArrayBuffer; repaired: boolean } {
  const repaired = cleanRebuildFont(buffer, { postFormat3: true, dropKern: true });
  return { buffer: repaired, repaired: true };
}

/**
 * Robustly load a font buffer into the browser document.fonts registry.
 * Tries bulletproof format 3.0 rebuild (which eliminates trailing garbage & OTS bugs),
 * then clamped format 2.0 rebuild, and both Binary & DataURL methods.
 */
export async function loadFontBinaryIntoBrowser(
  fontName: string,
  rawBuffer: ArrayBuffer
): Promise<{ fontFace: FontFace; cleanBuffer: ArrayBuffer; dataUrl: string }> {
  const attempts: { buf: ArrayBuffer; desc: string }[] = [
    { buf: cleanRebuildFont(rawBuffer, { postFormat3: true, dropKern: true }), desc: 'clean format 3.0 (OTS-safe)' },
    { buf: cleanRebuildFont(rawBuffer, { postFormat3: false, dropKern: false }), desc: 'repaired format 2.0 with clamped indices' },
    { buf: rawBuffer, desc: 'original buffer' },
  ];

  let lastError: any = null;

  for (const attempt of attempts) {
    // 1. Try FontFace with ArrayBuffer
    try {
      const face = new FontFace(fontName, attempt.buf);
      const loaded = await face.load();
      document.fonts.add(loaded);
      const dataUrl = arrayBufferToDataUrl(attempt.buf);
      return { fontFace: loaded, cleanBuffer: attempt.buf, dataUrl };
    } catch (e) {
      lastError = e;
    }

    // 2. Try FontFace with data: URL
    try {
      const dataUrl = arrayBufferToDataUrl(attempt.buf);
      const face = new FontFace(fontName, `url(${dataUrl})`);
      const loaded = await face.load();
      document.fonts.add(loaded);
      return { fontFace: loaded, cleanBuffer: attempt.buf, dataUrl };
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError || new Error("Failed to decode font file in browser");
}

/**
 * Handle a user uploaded File object (.ttf, .otf, .woff, .woff2)
 */
export async function processAndRegisterUploadedFont(file: File): Promise<{ name: string; url: string }> {
  const rawBuffer = await file.arrayBuffer();
  const detectedName = extractFontFamily(rawBuffer, file.name);

  const { dataUrl } = await loadFontBinaryIntoBrowser(detectedName, rawBuffer);
  return {
    name: detectedName,
    url: dataUrl
  };
}
