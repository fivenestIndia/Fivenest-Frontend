const http = require('http');
const fs = require('fs');
const pathModule = require('path');
const { execSync } = require('child_process');
const PDFDocument = require('pdfkit');

const PORT = 9000;

async function generatePDF(payload) {
    const { imagePaths, folderNames, fileNames, pdfPath, widths, heights } = payload;

    if (!imagePaths || !pdfPath) {
        throw new Error('Missing imagePaths or pdfPath in payload');
    }

    console.log(`Generating PDF for ${imagePaths.length} files...`);

    // Proportional sizing using 18 points per inch
    const scaleFactor = 18;
    const margin = 40;
    const gapY = 30;
    const labelH = 20;

    let totalItemsHeight = 0;
    const itemDimensions = [];

    for (let i = 0; i < imagePaths.length; i++) {
        // Default to 15" x 21" if dimensions are missing
        const wInches = (widths && widths[i]) ? parseFloat(widths[i]) : 15;
        const hInches = (heights && heights[i]) ? parseFloat(heights[i]) : 21;

        const wPt = wInches * scaleFactor;
        const hPt = hInches * scaleFactor;

        itemDimensions.push({ w: wPt, h: hPt });
        totalItemsHeight += hPt + labelH;
    }

    const docHeight = totalItemsHeight + ((imagePaths.length - 1) * gapY) + (2 * margin);

    // Create PDF Document using PDFKit
    const doc = new PDFDocument({
        size: [600, docHeight],
        margins: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // Set white background
    doc.rect(0, 0, 600, docHeight).fill('white');

    let currentY = margin;

    for (let i = 0; i < imagePaths.length; i++) {
        const imgPath = imagePaths[i];
        const folderName = folderNames[i];
        const fileName = fileNames[i];
        const { w: wPt, h: hPt } = itemDimensions[i];

        if (!fs.existsSync(imgPath)) {
            console.warn(`File not found: ${imgPath}`);
            continue;
        }

        let imagePathToLoad = imgPath;
        let isTemp = false;

        // Compress and downscale image to make it low-res and non-printable (JPEG quality 45%, Max Dim 1000px)
        try {
            const tempPath = imgPath.substring(0, imgPath.lastIndexOf('.')) + `_temp_preview_${Date.now()}.jpg`;
            console.log(`Compressing image: ${imgPath}`);
            execSync(`sips -Z 1000 -s format jpeg -s formatOptions 45 "${imgPath}" --out "${tempPath}"`, { stdio: 'ignore' });
            imagePathToLoad = tempPath;
            isTemp = true;
        } catch (err) {
            console.error(`Failed to compress image using sips: ${err.message}`);
            imagePathToLoad = imgPath;
            isTemp = false;
        }

        try {
            // Center the image horizontally on the 600pt canvas
            const targetX = (600 - wPt) / 2;

            doc.image(imagePathToLoad, targetX, currentY, {
                width: wPt,
                height: hPt
            });
        } catch (imageErr) {
            console.error(`Error loading image ${imagePathToLoad}: ${imageErr.message}`);
        }

        // Clean up temp file
        if (isTemp && fs.existsSync(imagePathToLoad)) {
            try {
                fs.unlinkSync(imagePathToLoad);
            } catch (cleanupErr) {
                console.error(`Cleanup failed for ${imagePathToLoad}: ${cleanupErr.message}`);
            }
        }

        // Add text label centered below the image
        const labelText = `[${folderName}] ${fileName}`;
        doc.fillColor('#323232')
           .fontSize(12)
           .font('Helvetica')
           .text(labelText, 0, currentY + hPt + 8, {
               width: 600,
               align: 'center'
           });

        currentY += hPt + labelH + gapY;
    }

    doc.end();

    return new Promise((resolve, reject) => {
        stream.on('finish', () => {
            console.log(`PDF saved successfully to ${pdfPath}`);
            resolve();
        });
        stream.on('error', (err) => {
            reject(err);
        });
    });
}

function packItems(items, rollW, rollH, itemGap, rotateToFit) {
    const sheets = [];
    let currentSheet = { items: [], currentX: 0, currentY: 0, shelfH: 0 };
    sheets.push(currentSheet);

    for (const item of items) {
        const canRotate = rotateToFit || (item.w > rollW && item.h <= rollW);

        let placed = false;

        // 1. Current shelf, unrotated
        if (currentSheet.currentX + item.w <= rollW) {
            if (currentSheet.currentY + item.h <= rollH) {
                currentSheet.items.push({
                    item,
                    x: currentSheet.currentX,
                    y: currentSheet.currentY,
                    w: item.w,
                    h: item.h,
                    rotated: false
                });
                currentSheet.currentX += item.w + itemGap;
                currentSheet.shelfH = Math.max(currentSheet.shelfH, item.h);
                placed = true;
            }
        }
        // 2. Current shelf, rotated
        else if (canRotate && currentSheet.currentX + item.h <= rollW) {
            if (currentSheet.currentY + item.w <= rollH) {
                currentSheet.items.push({
                    item,
                    x: currentSheet.currentX,
                    y: currentSheet.currentY,
                    w: item.h,
                    h: item.w,
                    rotated: true
                });
                currentSheet.currentX += item.h + itemGap;
                currentSheet.shelfH = Math.max(currentSheet.shelfH, item.w);
                placed = true;
            }
        }

        if (!placed) {
            const nextY = currentSheet.currentY + currentSheet.shelfH + itemGap;

            // 3. New shelf, unrotated
            if (item.w <= rollW && nextY + item.h <= rollH) {
                currentSheet.currentY = nextY;
                currentSheet.currentX = 0;
                currentSheet.shelfH = item.h;
                currentSheet.items.push({
                    item,
                    x: currentSheet.currentX,
                    y: currentSheet.currentY,
                    w: item.w,
                    h: item.h,
                    rotated: false
                });
                currentSheet.currentX += item.w + itemGap;
                placed = true;
            }
            // 4. New shelf, rotated
            else if (canRotate && item.h <= rollW && nextY + item.w <= rollH) {
                currentSheet.currentY = nextY;
                currentSheet.currentX = 0;
                currentSheet.shelfH = item.w;
                currentSheet.items.push({
                    item,
                    x: currentSheet.currentX,
                    y: currentSheet.currentY,
                    w: item.h,
                    h: item.w,
                    rotated: true
                });
                currentSheet.currentX += item.h + itemGap;
                placed = true;
            }
        }

        if (!placed) {
            // Start a new sheet
            let w = item.w;
            let h = item.h;
            let rotated = false;

            if (item.w <= rollW) {
                w = item.w;
                h = item.h;
                rotated = false;
            } else if (canRotate && item.h <= rollW) {
                w = item.h;
                h = item.w;
                rotated = true;
            } else {
                if (canRotate && item.h <= rollW && item.w > rollW) {
                    w = item.h;
                    h = item.w;
                    rotated = true;
                }
            }

            currentSheet = {
                items: [{
                    item,
                    x: 0,
                    y: 0,
                    w,
                    h,
                    rotated
                }],
                currentX: w + itemGap,
                currentY: 0,
                shelfH: h
            };
            sheets.push(currentSheet);
        }
    }
    return sheets;
}

function findBestNode(root, itemW, itemH) {
    if (root.used) {
        const leftResult = findBestNode(root.right, itemW, itemH);
        const rightResult = findBestNode(root.down, itemW, itemH);
        if (!leftResult) return rightResult;
        if (!rightResult) return leftResult;
        return leftResult.score < rightResult.score ? leftResult : rightResult;
    }

    if (itemW <= root.w && itemH <= root.h) {
        const score = root.w - itemW;
        return { node: root, score: score };
    }

    return null;
}

function findBestNodeForSheet(sheetPacker, item, itemGap, rollW, rotateToFit) {
    const itemW = item.w + itemGap;
    const itemH = item.h + itemGap;

    const mustForceRotate = (itemW > rollW && itemH <= rollW);

    if (mustForceRotate) {
        const res = findBestNode(sheetPacker.root, itemH, itemW);
        if (res) {
            return { node: res.node, rotated: true };
        }
        return null;
    }

    // Try unrotated fit first
    const resUnrotated = findBestNode(sheetPacker.root, itemW, itemH);
    if (resUnrotated) {
        return { node: resUnrotated.node, rotated: false };
    }

    // Try rotated fit only if rotateToFit is true
    if (rotateToFit) {
        const resRotated = findBestNode(sheetPacker.root, itemH, itemW);
        if (resRotated) {
            return { node: resRotated.node, rotated: true };
        }
    }

    return null;
}

function packItemsTight(items, rollW, rollH, itemGap, rotateToFit) {
    const sheets = [];

    class FitPacker {
        constructor(w, h) {
            this.root = { x: 0, y: 0, w: w, h: h };
        }

        splitNode(node, w, h) {
            node.used = true;
            node.down  = { x: node.x,     y: node.y + h, w: node.w,     h: node.h - h };
            node.right = { x: node.x + w, y: node.y,     w: node.w - w, h: h          };
            return node;
        }
    }

    for (const item of items) {
        const itemW = item.w + itemGap;
        const itemH = item.h + itemGap;

        let packed = false;
        for (const sheet of sheets) {
            const bestFit = findBestNodeForSheet(sheet.packer, item, itemGap, rollW, rotateToFit);
            if (bestFit) {
                sheet.packer.splitNode(bestFit.node, bestFit.rotated ? itemH : itemW, bestFit.rotated ? itemW : itemH);
                sheet.items.push({
                    item,
                    x: bestFit.node.x,
                    y: bestFit.node.y,
                    w: bestFit.rotated ? item.h : item.w,
                    h: bestFit.rotated ? item.w : item.h,
                    rotated: bestFit.rotated
                });
                packed = true;
                break;
            }
        }

        if (!packed) {
            const newPacker = new FitPacker(rollW, rollH);
            const bestFit = findBestNodeForSheet(newPacker, item, itemGap, rollW, rotateToFit);
            if (bestFit) {
                newPacker.splitNode(bestFit.node, bestFit.rotated ? itemH : itemW, bestFit.rotated ? itemW : itemH);
                sheets.push({
                    packer: newPacker,
                    items: [{
                        item,
                        x: bestFit.node.x,
                        y: bestFit.node.y,
                        w: bestFit.rotated ? item.h : item.w,
                        h: bestFit.rotated ? item.w : item.h,
                        rotated: bestFit.rotated
                    }]
                });
            } else {
                const node = newPacker.root;
                let rotated = false;
                if (itemH <= rollW && itemW > rollW) {
                    rotated = true;
                }
                const finalW = rotated ? item.h : item.w;
                const finalH = rotated ? item.w : item.h;
                newPacker.splitNode(node, Math.min(rotated ? itemH : itemW, rollW), Math.min(rotated ? itemW : itemH, rollH));
                sheets.push({
                    packer: newPacker,
                    items: [{
                        item,
                        x: node.x,
                        y: node.y,
                        w: finalW,
                        h: finalH,
                        rotated
                    }]
                });
            }
        }
    }

    return sheets;
}

async function runIllustratorNesting(payload) {
    const { items, rollW, rollH, itemGap, format, customerName, orderNum, outputFolder, resolution, tightestFit, rotateToFit } = payload;
    
    if (!items || !outputFolder) {
        throw new Error('Missing items or outputFolder in payload');
    }
    
    const parsedRollW = parseFloat(rollW) || 64;
    const parsedRollH = parseFloat(rollH) || 100;
    const parsedItemGap = parseFloat(itemGap) || 0.25;
    const parsedResolution = parseFloat(resolution) || 300;
    const cleanCust = customerName.replace(/[\/\\:*?"<>|]/g, "_").trim() || "Unknown";
    const cleanOrder = orderNum.replace(/[\/\\:*?"<>|]/g, "_").trim() || "01";
    
    items.sort((a, b) => b.h - a.h);
    // Pack items into sheets (split by parsedRollH which is Max Paper Size)
    const sheets = tightestFit
        ? packItemsTight(items, parsedRollW, parsedRollH, parsedItemGap, rotateToFit)
        : packItems(items, parsedRollW, parsedRollH, parsedItemGap, rotateToFit);
    
    console.log(`Nesting roll dimensions: ${parsedRollW} x (Max ${parsedRollH}) inches (Tightest Fit: ${!!tightestFit}, Gap: ${parsedItemGap} in, Res: ${parsedResolution} DPI)`);
    
    let jsx = `// Nesting script generated by Fivenest\n`;
    jsx += `app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;\n`;
    jsx += `try {\n`;
    jsx += `    app.preferences.setBooleanPreference('enableBackgroundSave', false);\n`;
    jsx += `    app.preferences.setBooleanPreference('enableBackgroundExport', false);\n`;
    jsx += `} catch(e) {}\n`;
    
    for (let s = 0; s < sheets.length; s++) {
        const sheet = sheets[s];
        
        let maxBottom = 0;
        for (const placed of sheet.items) {
            const bottom = placed.y + placed.h;
            if (bottom > maxBottom) {
                maxBottom = bottom;
            }
        }
        const actualRollH = maxBottom > 0 ? maxBottom : parsedRollH;
        
        const sheetNum = s + 1;
        const docName = `${cleanCust}_${cleanOrder}_Nesting_${sheetNum}`;
        const outputFilePath = pathModule.join(outputFolder, `${docName}.${format}`).replace(/\\/g, '/');
        
        // Pre-emptively delete the file to clear any cloud-sync locks before saving
        if (fs.existsSync(outputFilePath)) {
            try {
                fs.unlinkSync(outputFilePath);
            } catch (e) {
                console.warn(`Failed to delete existing file: ${outputFilePath}, ${e.message}`);
            }
        }
        
        jsx += `(function() {\n`;
        jsx += `    var doc = app.documents.add(DocumentColorSpace.RGB, ${parsedRollW * 72}, ${actualRollH * 72});\n`;
        jsx += `    var scale = doc.scaleFactor ? doc.scaleFactor : 1;\n`;
        jsx += `    var bg = doc.pathItems.rectangle(doc.height, 0, doc.width, doc.height);\n`;
        jsx += `    bg.filled = true;\n`;
        jsx += `    var whiteColor = new RGBColor();\n`;
        jsx += `    whiteColor.red = 255; whiteColor.green = 255; whiteColor.blue = 255;\n`;
        jsx += `    bg.fillColor = whiteColor;\n`;
        jsx += `    bg.stroked = false;\n`;
        
        for (const placed of sheet.items) {
            const filePath = placed.item.path.replace(/\\/g, '/');
            const targetLeft = placed.x * 72;
            const targetTop = (actualRollH - placed.y) * 72;
            
            jsx += `    try {\n`;
            jsx += `        var pItem = doc.placedItems.add();\n`;
            jsx += `        pItem.file = new File("${filePath}");\n`;
            jsx += `        pItem.width = (${placed.item.w * 72}) / scale;\n`;
            jsx += `        pItem.height = (${placed.item.h * 72}) / scale;\n`;
            if (placed.rotated) {
                jsx += `        pItem.rotate(90);\n`;
            }
            jsx += `        pItem.left = ${targetLeft} / scale;\n`;
            jsx += `        pItem.top = ${targetTop} / scale;\n`;
            jsx += `    } catch(e) {}\n`;
        }
        
        if (format === 'pdf') {
            jsx += `    var saveFile = new File("${outputFilePath}");\n`;
            jsx += `    var saveOpts = new PDFSaveOptions();\n`;
            jsx += `    saveOpts.compatibility = PDFCompatibility.ACROBAT8;\n`;
            jsx += `    saveOpts.preserveEditability = false;\n`;
            jsx += `    try { saveOpts.colorCompression = CompressionQuality.None; } catch(e) {}\n`;
            jsx += `    try { saveOpts.colorCompression = CompressionQuality.NONE; } catch(e) {}\n`;
            jsx += `    try { saveOpts.grayscaleCompression = CompressionQuality.None; } catch(e) {}\n`;
            jsx += `    try { saveOpts.grayscaleCompression = CompressionQuality.NONE; } catch(e) {}\n`;
            jsx += `    try { saveOpts.monochromeCompression = MonochromeCompression.None; } catch(e) {}\n`;
            jsx += `    try { saveOpts.monochromeCompression = MonochromeCompression.NONE; } catch(e) {}\n`;
            jsx += `    try { saveOpts.colorDownsampling = 0; } catch(e) {}\n`;
            jsx += `    try { saveOpts.grayscaleDownsampling = 0; } catch(e) {}\n`;
            jsx += `    try { saveOpts.monochromeDownsampling = 0; } catch(e) {}\n`;
            jsx += `    doc.saveAs(saveFile, saveOpts);\n`;
        } else {
            jsx += `    var saveFile = new File("${outputFilePath}");\n`;
            jsx += `    var exportOpts = new ExportOptionsTIFF();\n`;
            jsx += `    exportOpts.resolution = ${parsedResolution} * scale;\n`; // Scale resolution by doc scale factor for correct size
            jsx += `    exportOpts.imageColorSpace = ImageColorSpace.RGB;\n`;
            jsx += `    exportOpts.byteOrder = TIFFByteOrder.IBMPC;\n`;
            jsx += `    exportOpts.artBoardClipping = true;\n`;
            jsx += `    doc.exportFile(saveFile, ExportType.TIFF, exportOpts);\n`;
        }
        
        jsx += `    $.sleep(1000);\n`; // Ensure write is settled
        jsx += `    doc.close(SaveOptions.DONOTSAVECHANGES);\n`;
        jsx += `})();\n`;
    }
    
    const jsxPath = pathModule.join(__dirname, `nest_${Date.now()}.jsx`);
    fs.writeFileSync(jsxPath, jsx);
    
    console.log(`Running Illustrator nesting JSX script for ${sheets.length} sheets...`);
    
    try {
        // Use with timeout wrapper in AppleScript to prevent the default 120-second timeout
        const stdout = execSync(`osascript -e 'with timeout of 3600 seconds' -e 'tell application "Adobe Illustrator" to do javascript file "${jsxPath}"' -e 'end timeout'`);
        console.log(`Illustrator nesting complete!`);
    } catch (err) {
        const errMsg = err.stderr ? err.stderr.toString() : err.message;
        console.error('Error running osascript:', errMsg);
        throw new Error(`Adobe Illustrator Script Execution Failed: ${errMsg}`);
    } finally {
        if (fs.existsSync(jsxPath)) {
            fs.unlinkSync(jsxPath);
        }
    }
}

async function runAutoNesting(payload) {
    const { items, rollW, rollH, itemGap, tightestFit, rotateToFit, customerName, orderNum, outputFolder } = payload;
    
    if (!items || !outputFolder) {
        throw new Error('Missing items or outputFolder in payload');
    }
    
    const parsedRollW = parseFloat(rollW) || 64;
    const parsedRollH = parseFloat(rollH) || 100;
    const parsedItemGap = parseFloat(itemGap) || 0.25;
    const cleanCust = customerName.replace(/[\/\\:*?"<>|]/g, "_").trim() || "Unknown";
    const cleanOrder = orderNum.replace(/[\/\\:*?"<>|]/g, "_").trim() || "01";
    
    items.sort((a, b) => b.h - a.h);
    // Pack items into sheets (split by parsedRollH which is Max Paper Size)
    const sheets = tightestFit
        ? packItemsTight(items, parsedRollW, parsedRollH, parsedItemGap, rotateToFit)
        : packItems(items, parsedRollW, parsedRollH, parsedItemGap, rotateToFit);
    
    console.log(`Auto Nesting Engine: Nesting ${items.length} items onto ${sheets.length} sheet(s) (Roll Width: ${parsedRollW}", Max Height: ${parsedRollH}", Tightest Fit: ${!!tightestFit})...`);
    
    for (let s = 0; s < sheets.length; s++) {
        const sheet = sheets[s];
        
        let maxBottom = 0;
        for (const placed of sheet.items) {
            const bottom = placed.y + placed.h;
            if (bottom > maxBottom) {
                maxBottom = bottom;
            }
        }
        const actualRollH = maxBottom > 0 ? maxBottom : parsedRollH;
        
        const sheetNum = s + 1;
        const docName = `${cleanCust}_${cleanOrder}_Nesting_${sheetNum}`;
        const outputFilePath = pathModule.join(outputFolder, `${docName}.pdf`);
        
        if (fs.existsSync(outputFilePath)) {
            try {
                fs.unlinkSync(outputFilePath);
            } catch (e) {
                console.warn(`Failed to delete existing file: ${outputFilePath}, ${e.message}`);
            }
        }
        
        const widthPt = parsedRollW * 72;
        const heightPt = actualRollH * 72;
        
        // PDF page size limit is 14400 points (200 inches). 
        // We use userUnit to scale the page up to 1000+ inches while keeping coordinates within limit.
        const maxDim = 14400;
        let scale = 1;
        if (heightPt > maxDim || widthPt > maxDim) {
            scale = Math.ceil(Math.max(widthPt, heightPt) / maxDim);
        }
        
        console.log(`Creating PDF page of size: ${widthPt / scale} x ${heightPt / scale} pt (scale factor/UserUnit: ${scale})`);
        
        const doc = new PDFDocument({
            size: [widthPt / scale, heightPt / scale],
            userUnit: scale,
            margins: { top: 0, bottom: 0, left: 0, right: 0 }
        });
        
        const stream = fs.createWriteStream(outputFilePath);
        doc.pipe(stream);
        
        // Draw solid white background
        doc.rect(0, 0, widthPt / scale, heightPt / scale).fill('white');
        
        for (const placed of sheet.items) {
            const filePath = placed.item.path;
            if (!fs.existsSync(filePath)) {
                console.warn(`Image file not found: ${filePath}`);
                continue;
            }
            
            const pW = placed.item.w * 72;
            const pH = placed.item.h * 72;
            const pX = placed.x * 72;
            const pY = placed.y * 72;
            
            if (placed.rotated) {
                // Rotation in PDFKit around center of target rectangle
                const targetW = pH;
                const targetH = pW;
                const cX = pX + targetW / 2;
                const cY = pY + targetH / 2;
                
                doc.save();
                doc.translate(cX / scale, cY / scale);
                doc.rotate(90);
                doc.image(filePath, -pW / 2 / scale, -pH / 2 / scale, {
                    width: pW / scale,
                    height: pH / scale
                });
                doc.restore();
            } else {
                doc.image(filePath, pX / scale, pY / scale, {
                    width: pW / scale,
                    height: pH / scale
                });
            }
        }
        
        doc.end();
        
        await new Promise((resolve, reject) => {
            stream.on('finish', () => {
                console.log(`Saved Auto Nesting PDF to ${outputFilePath}`);
                resolve();
            });
            stream.on('error', reject);
        });
    }
}

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/generate-pdf') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const payload = JSON.parse(body);
                await generatePDF(payload);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                console.error('PDF Generation Error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } else if (req.method === 'POST' && req.url === '/nest-illustrator') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const payload = JSON.parse(body);
                await runIllustratorNesting(payload);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                console.error('Illustrator Nesting Error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } else if (req.method === 'POST' && (req.url === '/nest-fivenest' || req.url === '/nest-auto')) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const payload = JSON.parse(body);
                await runAutoNesting(payload);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                console.error('Auto Nesting Error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

server.listen(PORT, () => {
    console.log(`Local PDF Generator Server is running on http://localhost:${PORT}`);
});

