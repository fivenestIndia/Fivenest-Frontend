/**
 * FiveNest Robust Font Loader & Sanitizer
 * 
 * Automatically repairs corrupted font headers (e.g. legacy Windows Type 1 converted TTFs
 * where the 'post' table has invalid glyph name indices like 65535, causing browser OTS drop),
 * extracts authentic font family names from the 'name' table, and registers custom fonts seamlessly.
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

// Recompute head table checkSumAdjustment to strictly satisfy OTS & TrueType specs
function updateHeadCheckSumAdjustment(data: Uint8Array, view: DataView) {
  try {
    const numTables = view.getUint16(4);
    let headOffset = 0;
    for (let i = 0; i < numTables; i++) {
      const dirOffset = 12 + i * 16;
      if (dirOffset + 16 > data.length) break;
      if (view.getUint32(dirOffset) === 0x68656164) { // "head"
        headOffset = view.getUint32(dirOffset + 8);
        break;
      }
    }
    if (!headOffset || headOffset + 12 > data.length) return;
    view.setUint32(headOffset + 8, 0); // clear checkSumAdjustment before summing
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (i + 4 <= data.length) {
        sum = (sum + view.getUint32(i)) >>> 0;
      } else {
        let lastWord = 0;
        for (let b = 0; b < 4; b++) {
          lastWord = (lastWord << 8) | (i + b < data.length ? data[i + b] : 0);
        }
        sum = (sum + (lastWord >>> 0)) >>> 0;
      }
    }
    const adjustment = (0xB1B0AFBA - sum) >>> 0;
    view.setUint32(headOffset + 8, adjustment);
  } catch (e) {
    console.warn("Failed to update head checkSumAdjustment:", e);
  }
}

// Strategy 1: Clamp corrupted post format 2.0 glyph name indices (such as 65535) to 0 (.notdef)
export function sanitizeFontPostTable(buffer: ArrayBuffer): { buffer: ArrayBuffer; repaired: boolean } {
  try {
    const data = new Uint8Array(buffer.slice(0));
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    if (data.length < 12) return { buffer, repaired: false };
    const sfntVersion = view.getUint32(0);
    if (sfntVersion !== 0x00010000 && sfntVersion !== 0x4F54544F && sfntVersion !== 0x74727565) {
      return { buffer, repaired: false };
    }

    const numTables = view.getUint16(4);
    let postDirOffset = 0;
    let postOffset = 0;
    let postLength = 0;

    for (let i = 0; i < numTables; i++) {
      const dirOffset = 12 + i * 16;
      if (dirOffset + 16 > data.length) break;
      const tag = view.getUint32(dirOffset);
      if (tag === 0x706F7374) { // "post"
        postDirOffset = dirOffset;
        postOffset = view.getUint32(dirOffset + 8);
        postLength = view.getUint32(dirOffset + 12);
        break;
      }
    }

    if (!postOffset || postOffset + 32 > data.length) return { buffer, repaired: false };

    const format = view.getUint32(postOffset);
    if (format === 0x00020000) {
      let needsRepair = false;
      if (postOffset + 34 <= data.length) {
        const numGlyphs = view.getUint16(postOffset + 32);
        const glyphNameIndexOffset = postOffset + 34;
        const stringOffset = glyphNameIndexOffset + numGlyphs * 2;

        let customStringCount = 0;
        let curr = stringOffset;
        while (curr < postOffset + postLength && curr < data.length) {
          const sLen = data[curr];
          curr += 1 + sLen;
          customStringCount++;
        }

        const maxAllowedIndex = 258 + customStringCount;
        for (let g = 0; g < numGlyphs; g++) {
          if (glyphNameIndexOffset + g * 2 + 2 > data.length) break;
          const idx = view.getUint16(glyphNameIndexOffset + g * 2);
          if (idx >= maxAllowedIndex) {
            needsRepair = true;
            view.setUint16(glyphNameIndexOffset + g * 2, 0); // Clamp to 0 (.notdef)
          }
        }
      }

      if (needsRepair) {
        let sum = 0;
        for (let p = 0; p < postLength; p += 4) {
          if (postOffset + p + 4 <= data.length) {
            sum = (sum + view.getUint32(postOffset + p)) >>> 0;
          } else {
            let lastWord = 0;
            for (let b = 0; b < 4; b++) {
              lastWord = (lastWord << 8) | (postOffset + p + b < data.length ? data[postOffset + p + b] : 0);
            }
            sum = (sum + (lastWord >>> 0)) >>> 0;
          }
        }
        view.setUint32(postDirOffset + 4, sum);
        updateHeadCheckSumAdjustment(data, view);
        return { buffer: data.buffer, repaired: true };
      }
    }
  } catch (e) {
    console.warn("Post table sanitization check error:", e);
  }

  return { buffer, repaired: false };
}

// Strategy 2: Convert post table to Format 3.0 (removes all stringData & glyph name index tables entirely)
export function convertPostToFormat3(buffer: ArrayBuffer): { buffer: ArrayBuffer; repaired: boolean } {
  try {
    const data = new Uint8Array(buffer.slice(0));
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    if (data.length < 12) return { buffer, repaired: false };
    const numTables = view.getUint16(4);
    for (let i = 0; i < numTables; i++) {
      const dirOffset = 12 + i * 16;
      if (dirOffset + 16 > data.length) break;
      const tag = view.getUint32(dirOffset);
      if (tag === 0x706F7374) { // "post"
        const postOffset = view.getUint32(dirOffset + 8);
        if (postOffset + 32 > data.length) break;

        // Set format to 3.0
        view.setUint32(postOffset, 0x00030000);
        // Set post length to 32 bytes in table directory
        view.setUint32(dirOffset + 12, 32);

        // Recalculate 32-byte checksum
        let sum = 0;
        for (let p = 0; p < 32; p += 4) {
          sum = (sum + view.getUint32(postOffset + p)) >>> 0;
        }
        view.setUint32(dirOffset + 4, sum);
        updateHeadCheckSumAdjustment(data, view);
        return { buffer: data.buffer, repaired: true };
      }
    }
  } catch (e) {
    console.warn("Format 3 conversion error:", e);
  }

  return { buffer, repaired: false };
}

/**
 * Robustly load a font buffer into the browser document.fonts registry.
 * Tries direct load, then clamped format 2.0, then format 3.0, and both Binary & DataURL methods.
 */
export async function loadFontBinaryIntoBrowser(
  fontName: string,
  rawBuffer: ArrayBuffer
): Promise<{ fontFace: FontFace; cleanBuffer: ArrayBuffer; dataUrl: string }> {
  const attempts = [
    { buf: rawBuffer, desc: 'original buffer' },
    { buf: sanitizeFontPostTable(rawBuffer).buffer, desc: 'clamped post indices' },
    { buf: convertPostToFormat3(rawBuffer).buffer, desc: 'format 3.0 post table' },
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
