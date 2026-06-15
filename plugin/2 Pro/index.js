const ps = require("photoshop");
const { app, core } = ps;
const fs = require("uxp").storage.localFileSystem;
const shell = require("uxp").shell; 

// --- 🔥 STRICT VERSIONING & SECURITY 🔥 ---
const PLUGIN_VERSION = "pro_v1.0";
const PLUGIN_ID = "d8dcad95";
const AUTH_SERVER_URL = "https://fivenest-backend.onrender.com/api/license/verify";
const GRACE_PERIOD_DAYS = 3;
let isSystemReady = false;
const PRODUCTION_LIMIT = 2000;

// --- DATA ---
const defaultSizes = {
    "18":{front:{w:11,h:15}, back:{w:11,h:15}, half:{w:9.5,h:5}, full:{w:9,h:14}, nn:{w:5,h:5}},
    "20":{front:{w:12,h:16}, back:{w:12,h:16}, half:{w:10,h:5.5}, full:{w:10,h:15}, nn:{w:6,h:6}},
    "22":{front:{w:13,h:17}, back:{w:13,h:17}, half:{w:11,h:6}, full:{w:11,h:16}, nn:{w:6,h:6}},
    "24":{front:{w:14,h:20}, back:{w:14,h:20}, half:{w:12,h:6}, full:{w:12,h:17.5}, nn:{w:7,h:7}},
    "26":{front:{w:15,h:21}, back:{w:15,h:21}, half:{w:12.5,h:7.5}, full:{w:12.5,h:18}, nn:{w:7,h:7}},
    "28":{front:{w:15.8,h:23}, back:{w:15.8,h:23}, half:{w:14,h:8}, full:{w:14,h:19}, nn:{w:8,h:8}},
    "30":{front:{w:17,h:25}, back:{w:17,h:25}, half:{w:14.5,h:8.5}, full:{w:14.5,h:20.5}, nn:{w:8,h:8}},
    "32":{front:{w:18,h:26}, back:{w:18,h:26}, half:{w:15,h:9}, full:{w:15,h:21}, nn:{w:9,h:9}},
    "34":{front:{w:19,h:27}, back:{w:19,h:27}, half:{w:16,h:9.5}, full:{w:16,h:22.5}, nn:{w:9,h:9}},
    "36":{front:{w:20,h:28}, back:{w:20,h:28}, half:{w:17,h:10.5}, full:{w:17,h:23.5}, nn:{w:10,h:10}},
    "38":{front:{w:21,h:29}, back:{w:21,h:29}, half:{w:18,h:10.5}, full:{w:18,h:24}, nn:{w:10,h:10}},
    "40":{front:{w:22,h:30}, back:{w:22,h:30}, half:{w:19,h:10.5}, full:{w:19,h:25}, nn:{w:11,h:11}},
    "42":{front:{w:23,h:31}, back:{w:23,h:31}, half:{w:20,h:11.5}, full:{w:20,h:25}, nn:{w:11,h:11}},
    "44":{front:{w:24,h:31.8}, back:{w:24,h:31.8}, half:{w:21,h:12.5}, full:{w:21,h:26}, nn:{w:11,h:11}},
    "46":{front:{w:25,h:33}, back:{w:25,h:33}, half:{w:22,h:13}, full:{w:22,h:27}, nn:{w:12,h:12}},
    "48":{front:{w:26,h:33.5}, back:{w:26,h:33.5}, half:{w:23.5,h:13.5}, full:{w:23.5,h:27.5}, nn:{w:12,h:12}},
    "50":{front:{w:27,h:34}, back:{w:27,h:34}, half:{w:23,h:14}, full:{w:24,h:28}, nn:{w:12,h:12}},
    "52":{front:{w:28,h:34.5}, back:{w:28,h:34.5}, half:{w:23,h:14.5}, full:{w:24.5,h:28.5}, nn:{w:13,h:13}},
    "54":{front:{w:29,h:34.5}, back:{w:29,h:34.5}, half:{w:24,h:15}, full:{w:25.5,h:29}, nn:{w:13,h:13}},
    "56":{front:{w:30,h:35}, back:{w:30,h:35}, half:{w:25,h:15}, full:{w:26,h:29}, nn:{w:13,h:13}},
    "58":{front:{w:31,h:36}, back:{w:31,h:36}, half:{w:25.5,h:15.5}, full:{w:26,h:29}, nn:{w:13,h:13}},
    "60":{front:{w:32,h:37}, back:{w:32,h:37}, half:{w:26,h:16}, full:{w:26,h:29}, nn:{w:13,h:13}}
};

let sizeDB = defaultSizes; 
let selectedCSV = null;
let selectedFolder = null;
let startTime = 0;

document.addEventListener("DOMContentLoaded", async () => {
    await loadDatabase();
    await loadDefaults(); 
    updateUsageDisplay(); 
    
    const themeBtn = document.getElementById("btnThemeToggle");
    themeBtn.onclick = () => {
        document.body.classList.toggle("light-tool");
        themeBtn.innerText = document.body.classList.contains("light-tool") ? "🌙" : "☀";
    };
    
    document.getElementById("btnToggleConfig").onclick = () => {
        const content = document.getElementById("configContent");
        const icon = document.getElementById("btnToggleConfig");
        content.classList.toggle("hidden-control");
        icon.classList.toggle("collapsed");
    };

    document.getElementById("exportFormat").addEventListener("change", updateUIOptions);

    // --- 🤖 3-TAB LOGIC 🤖 ---
    const tabs = ["Run", "Edit", "Help"];
    function switchTab(target) {
        tabs.forEach(t => {
            document.getElementById("tab" + t).classList.remove("active");
            document.getElementById("panel" + t).classList.remove("active");
        });
        document.getElementById("tab" + target).classList.add("active");
        document.getElementById("panel" + target).classList.add("active");
    }
    document.getElementById("tabRun").onclick = () => switchTab("Run");
    document.getElementById("tabEdit").onclick = () => switchTab("Edit");
    document.getElementById("tabHelp").onclick = () => switchTab("Help");

    document.getElementById("btnCSV").addEventListener("click", async () => {
        const file = await fs.getFileForOpening({ types: ["csv", "txt"] });
        if (file) { selectedCSV = file; document.getElementById("lblCSV").innerText = file.name; document.getElementById("lblCSV").style.color = "#4CAF50"; log("CSV Set."); }
    });
    document.getElementById("btnFolder").addEventListener("click", async () => {
        const folder = await fs.getFolder();
        if (folder) { selectedFolder = folder; document.getElementById("lblFolder").innerText = folder.name; document.getElementById("lblFolder").style.color = "#4CAF50"; log("Output Set."); }
    });
    
    document.getElementById("btnValidate").onclick = validateCSV; 
    document.getElementById("btnRun").onclick = runEngine;
    document.getElementById("btnSetDefault").onclick = saveDefaults; 
    document.getElementById("btnClearLog").onclick = () => { document.getElementById("logArea").innerText = "Ready."; };
    
    const sel = document.getElementById("sizeSelector");
    Object.keys(sizeDB).forEach(k => { let o=document.createElement("option"); o.value=k; o.innerText="Size "+k; sel.appendChild(o); });
    sel.addEventListener("change", loadSizeToUI);
    document.getElementById("btnSaveDB").addEventListener("click", saveSizeFromUI);
    // --- Activate / Logout Button ---
    const btnAct = document.getElementById("btnActivate");
    btnAct.onclick = async () => {
        if (btnAct.innerText === "LOGOUT") {
            localStorage.removeItem("fivenest_license_key");
            localStorage.removeItem("fivenest_license_email");
            localStorage.removeItem("fivenest_last_verified");
            btnAct.innerText = "ACTIVATE";
            document.getElementById("txtLicenseEmail").value = "";
            document.getElementById("txtLicenseKey").value = "";
            document.getElementById("txtLicenseEmail").style.display = "block";
            document.getElementById("txtLicenseKey").style.display = "block";
            await app.showAlert("License Removed from this PC.");
            await checkLicenseSystem(); 
            return;
        }

        const email = document.getElementById("txtLicenseEmail").value.trim();
        const key = document.getElementById("txtLicenseKey").value.trim();
        if(email && key) await checkLicenseSystem(email, key, true);
        else await app.showAlert("Please fill in both Email and License Key.");
    };

    const btnToggleLicense = document.getElementById("btnToggleLicense");
    if (btnToggleLicense) {
        btnToggleLicense.onclick = () => {
            const licContent = document.getElementById("licenseContent");
            if (licContent) {
                if (licContent.style.display === "none") {
                    licContent.style.display = "block";
                    btnToggleLicense.classList.remove("collapsed");
                } else {
                    licContent.style.display = "none";
                    btnToggleLicense.classList.add("collapsed");
                }
            }
        };
    }

    loadSizeToUI();
    updateUIOptions(); 

    // --- 🤖 HELP ASSISTANT CHATBOT LOGIC 🤖 ---
    const chatHistory = document.getElementById("chatHistory");
    const txtChatInput = document.getElementById("txtChatInput");
    const btnChatSend = document.getElementById("btnChatSend");
    const btnClearChat = document.getElementById("btnClearChat");
    const chatSuggestions = document.getElementById("chatSuggestions");

    const helpManual = [
        {
            title: "Blank Kit",
            keywords: ["blank", "kit", "no name", "no number", "name", "number"],
            summary: "Blank Kit exports designs without player names or numbers.",
            details: "When **Blank Kit** is checked, the plugin bypasses name and number layers during front/back exports. This is ideal for generating stock team wear or generic jerseys."
        },
        {
            title: "A4-Back Print",
            keywords: ["a4", "back", "print", "only name", "only number"],
            summary: "A4-Back Print exports ONLY name & number details.",
            details: "When **A4-Back Print** is checked, the plugin outputs separate files containing *only* player names and numbers. These are typically printed on transparent sheets or scaled to A4 size for back prints."
        },
        {
            title: "Smart Mockup",
            keywords: ["mockup", "mockups", "smart mockup", "preview"],
            summary: "Smart Mockup automatically generates preview images of your designs.",
            details: "When **Smart Mockup** is checked, the plugin automatically toggles the mockup template background groups and saves JPG previews of the front/back designs in a designated `Mockups` subdirectory."
        },
        {
            title: "Save Default",
            keywords: ["save default", "default", "save def", "defaults"],
            summary: "Save Default remembers your current settings.",
            details: "Clicking **Save Default** saves your selected checkbox configurations, resolution, format, and compression settings to `fivenest_config.json`. These settings will automatically load next time you open Photoshop."
        },
        {
            title: "How to Run Automation",
            keywords: ["run", "how to use", "start", "automation", "begin", "steps"],
            summary: "Learn the step-by-step guide to run a batch automation job.",
            details: "To run a batch job:\n1. Choose your inputs: load a CSV file.\n2. Choose your outputs: click *Select Output* folder.\n3. Configure options (Format, Resolution, compression, and feature options).\n4. Click **Run Automation** to process everything automatically."
        },
        {
            title: "Tiers & Usage Limits",
            keywords: ["limit", "usage", "subscription", "starter", "pro", "premium", "enterprise", "pcs", "free trial", "trial"],
            summary: "Learn about product limits and trial activation.",
            details: "Usage limits are calculated *only* when a BACK layer is exported:\n- **Pro Plan**: 2,000 pcs limit.\n- New installations get a **7-Day Free Trial** with full functionality before requiring license activation."
        }
    ];

    async function openWhatsAppSupport() {
        const email = localStorage.getItem("fivenest_license_email") || "Unregistered User";
        const clientName = document.getElementById("txtCustomerName") ? document.getElementById("txtCustomerName").value.trim() : "";
        const nameSection = clientName ? `${clientName} (${email})` : email;
        const rawMessage = `Hello Vilesh, I need assistance with FN Pro. (User: ${nameSection})`;
        const encodedMessage = encodeURIComponent(rawMessage);
        const url = `https://wa.me/918879228710?text=${encodedMessage}`;
        
        try {
            await shell.openExternal(url, "Opening WhatsApp Support");
        } catch(e) {
            log("Failed to open WhatsApp: " + e.message);
        }
    }

    function appendMessage(text, sender) {
        const bubble = document.createElement("div");
        bubble.className = "chat-bubble chat-bubble-" + sender;
        bubble.innerText = text;
        chatHistory.appendChild(bubble);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function appendMessageWithWhatsApp(text) {
        const bubble = document.createElement("div");
        bubble.className = "chat-bubble chat-bubble-assistant";
        bubble.innerText = text + "\n\n";
        
        const link = document.createElement("span");
        link.innerText = "💬 Connect on WhatsApp";
        link.style.color = "#2ecc71";
        link.style.textDecoration = "underline";
        link.style.fontWeight = "bold";
        link.style.cursor = "pointer";
        link.style.display = "inline-block";
        link.style.marginTop = "4px";
        link.onclick = openWhatsAppSupport;
        
        bubble.appendChild(link);
        chatHistory.appendChild(bubble);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function renderSuggestions() {
        chatSuggestions.innerHTML = "";
        const suggestionTitles = ["Blank Kit", "Smart Mockup", "A4-Back Print", "Limits & Trial", "How to Run"];
        suggestionTitles.forEach(title => {
            const pill = document.createElement("span");
            pill.className = "chat-suggestion-pill";
            pill.innerText = title;
            pill.onclick = () => {
                appendMessage(title, "user");
                const found = helpManual.find(h => h.title === title);
                if (found) {
                    setTimeout(() => {
                        appendMessage(found.summary + "\n\n" + found.details, "assistant");
                    }, 200);
                }
            };
            chatSuggestions.appendChild(pill);
        });

        // Add green WhatsApp Support pill
        const supportPill = document.createElement("span");
        supportPill.className = "chat-suggestion-pill";
        supportPill.innerText = "💬 WhatsApp Support";
        supportPill.style.borderColor = "#2ecc71";
        supportPill.style.color = "#2ecc71";
        supportPill.onclick = () => {
            appendMessage("Connect with Support", "user");
            setTimeout(() => {
                appendMessage("Opening WhatsApp to chat with Vilesh...", "assistant");
                openWhatsAppSupport();
            }, 200);
        };
        chatSuggestions.appendChild(supportPill);
    }

    function handleUserInput() {
        const query = txtChatInput.value.trim();
        if (!query) return;
        appendMessage(query, "user");
        txtChatInput.value = "";

        setTimeout(() => {
            const cleanQuery = query.toLowerCase().replace(/[^a-z0-9\s]/g, "");
            const words = cleanQuery.split(/\s+/).filter(w => w.length > 2);
            
            if (words.length === 0) {
                appendMessage("I'm sorry, I couldn't catch that. Could you please specify a feature or choose one of the quick suggestions below?", "assistant");
                return;
            }
            
            let bestMatch = null;
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
                appendMessage(bestMatch.summary + "\n\n" + bestMatch.details, "assistant");
            } else {
                appendMessageWithWhatsApp("I couldn't find a direct match for your question. Here is a quick summary of what I can help you with: \n\n" + 
                    "• Blank Kit\n" +
                    "• A4-Back Print\n" +
                    "• Smart Mockup\n" +
                    "• Save Default settings\n" +
                    "• Usage limits & trial status\n\n" +
                    "Please try rephrasing or click a suggestion below! If you still need help, click below to chat with Vilesh directly:");
            }
        }, 300);
    }

    btnChatSend.onclick = handleUserInput;
    txtChatInput.onkeydown = (e) => { if (e.key === "Enter") handleUserInput(); };
    btnClearChat.onclick = () => {
        chatHistory.innerHTML = "";
        appendMessage("Hi! I'm your FN Pro offline assistant. Ask me about any feature (e.g. Blank Kit, Smart Mockup) or click a suggestion below!", "assistant");
    };

    // Initialize welcome
    appendMessage("Hi! I'm your FN Pro offline assistant. Ask me about any feature (e.g. Blank Kit, Smart Mockup) or click a suggestion below!", "assistant");
    renderSuggestions();

    await checkLicenseSystem();
});

function updateUIOptions() {
    const fmt = document.getElementById("exportFormat").value;
    const chkEmbed = document.getElementById("chkEmbedProfile");
    const containerLZW = document.getElementById("containerLZW");
    const lblEmbed = document.getElementById("lblEmbed");

    if (fmt === "png") {
        chkEmbed.disabled = true;
        lblEmbed.classList.add("disabled-text");
        containerLZW.classList.add("hidden-control");
    } else if (fmt === "jpg") {
        chkEmbed.disabled = false;
        lblEmbed.classList.remove("disabled-text");
        containerLZW.classList.add("hidden-control");
    } else if (fmt === "tiff") {
        chkEmbed.disabled = false;
        lblEmbed.classList.remove("disabled-text");
        containerLZW.classList.remove("hidden-control");
    }
}

async function saveDefaults() {
    const config = {
        format: document.getElementById("exportFormat").value,
        res: document.getElementById("resolution").value,
        limitName: document.getElementById("limitName").value,
        limitNum: document.getElementById("limitNum").value,
        embed: document.getElementById("chkEmbedProfile").checked,
        lzw: document.getElementById("chkLZW").checked,
        mockup: document.getElementById("chkMockup").checked,
        sameFB: document.getElementById("chkSameFrontBack").checked,
        nameNum: document.getElementById("chkNameNum").checked
    };
    try {
        const f = await fs.getDataFolder();
        const file = await f.createFile("fivenest_config.json", { overwrite: true });
        await file.write(JSON.stringify(config));
        log("✅ Settings Saved as Default.");
    } catch(e) { log("Error saving defaults"); }
}

async function loadDefaults() {
    try {
        const f = await fs.getDataFolder();
        const file = await f.getEntry("fivenest_config.json");
        if(file) {
            const config = JSON.parse(await file.read());
            if(config.format) document.getElementById("exportFormat").value = config.format;
            if(config.res) document.getElementById("resolution").value = config.res;
            if(config.limitName) document.getElementById("limitName").value = config.limitName;
            if(config.limitNum) document.getElementById("limitNum").value = config.limitNum;
            if(config.embed !== undefined) document.getElementById("chkEmbedProfile").checked = config.embed;
            if(config.lzw !== undefined) document.getElementById("chkLZW").checked = config.lzw;
            if(config.mockup !== undefined) document.getElementById("chkMockup").checked = config.mockup;
            if(config.sameFB !== undefined) document.getElementById("chkSameFrontBack").checked = config.sameFB;
            if(config.nameNum !== undefined) document.getElementById("chkNameNum").checked = config.nameNum;
            updateUIOptions();
            log("Loaded Default Settings.");
        }
    } catch(e) {}
}

async function validateCSV() {
    if (!selectedCSV) { log("❌ Select a CSV first."); return; }
    const csvText = await selectedCSV.read();
    const rows = parseCSV(csvText);
    const headers = rows[0].map(h => h.toLowerCase().trim());
    let errors = [];

    const required = ["filename", "size"];
    required.forEach(req => { if (!headers.includes(req) && !headers.includes("front size")) errors.push(`Missing Column: "${req}"`); });

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 2) continue;
        if (!getVal(row, headers, "size") && !getVal(row, headers, "front size")) {
            errors.push(`Row ${i+1}: Missing Size info.`);
        }
    }

    if (errors.length === 0) {
        log("✅ CSV Validated: No errors found.");
        await app.showAlert("CSV Looks Good! You are ready to run.");
    } else {
        log("❌ CSV ERRORS:\n" + errors.slice(0, 5).join("\n"));
        await app.showAlert("CSV has errors. Check the Process Log.");
    }
}

function log(m) { const l=document.getElementById("logArea"); if(l){ l.innerText+="\n"+m; l.scrollTop=l.scrollHeight; } }

function updateProgressUI(current, total) {
    const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
    document.getElementById("progressBar").style.width = percent + "%";
    document.getElementById("progressVal").innerText = percent + "%";
    
    if (current > 0 && current < total) {
        const elapsed = Date.now() - startTime;
        const remaining = (elapsed / current) * (total - current);
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        document.getElementById("etaDisplay").innerText = `Remaining: ${mins}m ${secs}s`;
    } else if (current >= total && total > 0) {
        document.getElementById("etaDisplay").innerText = "Process Completed.";
    }
}

async function runEngine() {
    if(!isSystemReady) {
        await app.showAlert("Cannot Run: Check Internet connection or License status.");
        await checkLicenseSystem(); 
        return;
    }

    const currentUsage = parseInt(localStorage.getItem("fivenest_production_usage") || "0");
    if (PRODUCTION_LIMIT > 0 && currentUsage >= PRODUCTION_LIMIT) {
        await app.showAlert("Limit has been exceeded. You need to upgrade to the Premium plan.");
        log("❌ Run blocked: Production limit exceeded.");
        return;
    }

    if (!selectedCSV || !selectedFolder) { log("Error: Select files first."); return; }
    const res = parseInt(document.getElementById("resolution").value);
    const format = document.getElementById("exportFormat").value.toLowerCase();
    const shouldEmbed = document.getElementById("chkEmbedProfile").checked;
    const useLZW = document.getElementById("chkLZW").checked;
    const doMockup = document.getElementById("chkMockup").checked;
    const sameFB = document.getElementById("chkSameFrontBack").checked;
    const doNameNum = document.getElementById("chkNameNum").checked; 

    const csvText = await selectedCSV.read();
    const csvRows = parseCSV(csvText);
    const dataRows = csvRows.slice(1).filter(r => r.length > 0 && r[0] !== "");
    
    if(dataRows.length === 0) { log("Error: Empty CSV or No Data"); return; }
    const headers = csvRows[0].map(h => h.toLowerCase().trim());

    let hasFront = false;
    let hasBack = false;
    let hasSleeve = false;

    for (let i = 1; i < csvRows.length; i++) {
        const row = csvRows[i];
        if (!row || row.length === 0 || row[0] === "") continue;

        const fSize = getVal(row, headers, "front size");
        const fQty = parseInt(getVal(row, headers, "total qty") || getVal(row, headers, "total quantity") || "0", 10);
        if (fSize && sizeDB[fSize] && fQty > 0) hasFront = true;

        if (sameFB) {
            if (fSize && sizeDB[fSize] && fQty > 0) hasBack = true;
        } else {
            const fname = row[0];
            const bSize = getVal(row, headers, "size") || (fname.match(/^(\d{2})/) ? fname.match(/^(\d{2})/)[1] : "");
            if (bSize && sizeDB[bSize]) hasBack = true;
        }

        const hQty = parseInt(getVal(row, headers, "half sleeve") || "0", 10);
        const flQty = parseInt(getVal(row, headers, "full sleeve") || "0", 10);
        if (fSize && sizeDB[fSize] && (hQty > 0 || flQty > 0)) hasSleeve = true;
    }

    let layerModes = [];
    if (hasFront) layerModes.push({ name: "Front", mode: "FRONT", folderName: "Front" });
    if (hasBack) layerModes.push({ name: "Back", mode: "BACK", folderName: "Back" });
    if (hasSleeve) {
        layerModes.push({ name: "Half Left SL", mode: "HALF_L", folderName: "Sleeve" });
        layerModes.push({ name: "Half Right SL", mode: "HALF_R", folderName: "Sleeve" });
        layerModes.push({ name: "Full Left SL", mode: "FULL_L", folderName: "Sleeve" });
        layerModes.push({ name: "Full Right SL", mode: "FULL_R", folderName: "Sleeve" });
    }
    if (doNameNum && hasBack) layerModes.push({ name: "Only Name & Number", mode: "NAMENUM", folderName: "Name_Number" });

    if (layerModes.length === 0) {
        await app.showAlert("Error: No valid Front, Back, or Sleeve quantities found to process in the CSV.");
        return;
    }

    const totalSteps = dataRows.length * layerModes.length;
    let currentStep = 0;
    
    document.getElementById("workCaption").classList.remove("hidden-control");
    startTime = Date.now();
    updateProgressUI(0, totalSteps);

    await core.executeAsModal(async () => {
        try {
            const masterDocID = app.activeDocument.id;

            const stats = { Front: 0, Back: 0, Sleeves: 0, NameNum: 0 };

            for (const lm of layerModes) {
                await app.batchPlay([{ _obj: "select", _target: [{ _ref: "document", _id: masterDocID }] }], {});
                const layer = await findLayerRecursive(app.activeDocument, lm.name);
                if (!layer || !layer.visible) {
                    dataRows.forEach(() => {
                        currentStep++;
                        updateProgressUI(currentStep, totalSteps);
                    });
                    continue;
                }

                log(`>>> STARTING: ${lm.name}`);
                const outFolder = await ensureFolder(selectedFolder, lm.folderName);
                const count = await processLayerBatch(masterDocID, lm.name, csvRows, headers, outFolder, res, format, lm.mode, sizeDB, shouldEmbed, useLZW, sameFB, () => {
                    currentStep++;
                    updateProgressUI(currentStep, totalSteps);
                });
                if (lm.mode === "FRONT") stats.Front += count;
                else if (lm.mode === "BACK") stats.Back += count;
                else if (lm.mode === "NAMENUM") stats.NameNum += count;
                else stats.Sleeves += count;
            }

            if (doMockup) {
                log(">>> Generating Mockups...");
                await app.batchPlay([{ _obj: "select", _target: [{ _ref: "document", _id: masterDocID }] }], {});
                
                const csvNameClean = selectedCSV.name.replace(/\.[^/.]+$/, "");
                const bgGroup = await findLayerRecursive(app.activeDocument, "mockup bg");

                if (bgGroup && bgGroup.layers && bgGroup.layers.length > 0) {
                    
                    // A. Export Background Versions (JPEG)
                    for (const bgLayer of bgGroup.layers) {
                        // Ensure the Group itself is ON
                        bgGroup.visible = true;

                        // Explicitly Toggle visibility using ID comparison (Fixes issue)
                        for (const sibling of bgGroup.layers) {
                            sibling.visible = (sibling.id === bgLayer.id);
                        }

                        const suffix = bgLayer.name.trim().replace(/[\/\\:*?"<>|]/g, "_");
                        const fName = `${csvNameClean} ${suffix}.jpg`;
                        const saveFile = await selectedFolder.createFile(fName, { overwrite: true });
                        const saveToken = await fs.createSessionToken(saveFile);
                        
                        await app.batchPlay([{ 
                            _obj: "save", 
                            as: { _obj: "JPEG", extendedQuality: 10, matteColor: { _enum: "matteColor", _value: "none" } }, 
                            in: { _path: saveToken, _kind: "local" },
                            copy: true
                        }], {});
                        log(`✅ Saved: ${fName}`);
                    }

                    // B. Export Transparent Version (PNG) - No Background
                    bgGroup.visible = false; // Hide entire BG group
                    
                    const pngName = `${csvNameClean} NoBG.png`;
                    const pngFile = await selectedFolder.createFile(pngName, { overwrite: true });
                    const pngToken = await fs.createSessionToken(pngFile);

                    await app.batchPlay([{ 
                        _obj: "save", 
                        as: { _obj: "PNGFormat", method: { _enum: "PNGMethod", _value: "quick" } }, 
                        in: { _path: pngToken, _kind: "local" }, 
                        copy: true 
                    }], {});
                    log(`✅ Saved: ${pngName}`);
                    
                    // Restore Visibility (Optional, nice to have)
                    bgGroup.visible = true; 

                } else {
                    // Fallback (Original Single Mockup)
                    const mockupFileName = `${csvNameClean} mockup.jpg`.replace(/[\/\\:*?"<>|]/g, "_");
                    const saveFile = await selectedFolder.createFile(mockupFileName, { overwrite: true });
                    const saveToken = await fs.createSessionToken(saveFile);
                    await app.batchPlay([
                        { 
                            _obj: "save", 
                            as: { _obj: "JPEG", extendedQuality: 10, matteColor: { _enum: "matteColor", _value: "none" } }, 
                            in: { _path: saveToken, _kind: "local" },
                            copy: true
                        }
                    ], {});
                    log(`✅ Saved Mockup: ${mockupFileName}`);
                }
            }
            
            updateProgressUI(totalSteps, totalSteps);
            const totalTime = Math.round((Date.now() - startTime) / 1000);
            log(`--- SUMMARY ---`);
            log(`Time Taken: ${Math.floor(totalTime/60)}m ${totalTime%60}s`);
            log(`F: ${stats.Front} | B: ${stats.Back} | SL: ${stats.Sleeves} | NN: ${stats.NameNum}`);
            log("✅ JOB COMPLETE!");
            
            await app.showAlert("Automation Finished!");
            
        } catch(e) { log("Error: " + e.message); }
        finally {
            document.getElementById("workCaption").classList.add("hidden-control");
        }
    }, { commandName: "Fivenest Automation" });
}

async function processLayerBatch(masterDocID, layerName, rows, headers, outFolder, res, format, mode, db, shouldEmbed, useLZW, sameFB, onStep) {
    let exportCount = 0;
    
    await app.batchPlay([{ _obj: "select", _target: [{ _ref: "document", _id: masterDocID }] }], {});
    
    const layer = await findLayerRecursive(app.activeDocument, layerName);
    if (!layer || !layer.visible) { 
        rows.slice(1).forEach(() => onStep()); 
        return 0; 
    }

    await app.batchPlay([{ _obj: "select", _target: [{ _ref: "layer", _id: layer.id }] }], {});
    await app.batchPlay([{ _obj: "placedLayerEditContents", _options: { dialogOptions: "dontDisplay" } }], {});
    const soDoc = app.activeDocument;
    const docRes = soDoc.resolution;

    // --- CRITICAL: SAVE INITIAL STATE (For Resetting Canvas Size) ---
    const initialState = soDoc.activeHistoryState;

    try {
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if(!row || row.length === 0 || row[0] === "") { onStep(); continue; }

            // --- A. RESET CANVAS TO INITIAL STATE ---
            await app.batchPlay([{ _obj: "select", _target: [{ _ref: "historyState", _id: initialState.id }] }], {});

            let qty = "0", activeSize = "";
            
            if (mode === "FRONT" || (mode === "BACK" && sameFB)) {
                activeSize = getVal(row, headers, "front size");
                qty = getVal(row, headers, "total qty") || getVal(row, headers, "total quantity") || "0";
            } else if (mode === "BACK" || mode === "NAMENUM") {
                const fname = row[0];
                activeSize = getVal(row, headers, "size") || (fname.match(/^(\d{2})/) ? fname.match(/^(\d{2})/)[1] : "");
                qty = "1"; 
            } else {
                activeSize = getVal(row, headers, "front size");
                qty = getVal(row, headers, mode.includes("HALF") ? "half sleeve" : "full sleeve") || "0";
            }

            if (!activeSize || qty === "0" || qty === "") { onStep(); continue; }

            let finalName = "", w=0, h=0;

            if (mode === "FRONT" || (mode === "BACK" && sameFB)) {
                finalName = `${activeSize} = ${qty} ${mode === "FRONT" ? "F" : "B"}`;
                if(db[activeSize]) { 
                    w=db[activeSize].front.w; 
                    h=db[activeSize].front.h; 
                }
                await updateText(soDoc, "SIZE", activeSize);
                await updateText(soDoc, "quantity", qty);
            } 
            else if (mode === "BACK") {
                finalName = `${row[0]} B`;
                if(db[activeSize]) { w=db[activeSize].back.w; h=db[activeSize].back.h; }
                for(let c=0; c<headers.length; c++) { updateText(soDoc, headers[c], (row[c] && row[c].trim() !== "") ? row[c].trim() : " "); }
                const sleeveData = getVal(row, headers, "sleeve");
                if (sleeveData) { await updateText(soDoc, "sleeve style", sleeveData); }
                const fontName = getVal(row, headers, "font");
                if (fontName) {
                    await updateLayerFont(soDoc, "name", fontName);
                    await updateLayerFont(soDoc, "number", fontName);
                }
                await compressLayerWidth(soDoc, "name", parseFloat(document.getElementById("limitName").value) || 11, docRes);
                await compressLayerWidth(soDoc, "number", parseFloat(document.getElementById("limitNum").value) || 9, docRes);
            } 
            else if (mode === "NAMENUM") {
                finalName = `${row[0]} NN`;
                if(db[activeSize]) { 
                    w=db[activeSize].nn ? db[activeSize].nn.w : 10; 
                    h=db[activeSize].nn ? db[activeSize].nn.h : 10;
                }
                for(let c=0; c<headers.length; c++) { updateText(soDoc, headers[c], (row[c] && row[c].trim() !== "") ? row[c].trim() : " "); }
                const sleeveData = getVal(row, headers, "sleeve");
                if (sleeveData) { await updateText(soDoc, "sleeve style", sleeveData); }
                const fontName = getVal(row, headers, "font");
                if (fontName) {
                    await updateLayerFont(soDoc, "name", fontName);
                    await updateLayerFont(soDoc, "number", fontName);
                }
                await compressLayerWidth(soDoc, "name", parseFloat(document.getElementById("limitName").value) || 11, docRes);
                await compressLayerWidth(soDoc, "number", parseFloat(document.getElementById("limitNum").value) || 9, docRes);
            } 
            else if (mode.includes("HALF") || mode.includes("FULL")) {
                let suf = mode.includes("HALF") ? (mode.includes("_L") ? " HSL L" : " HSL R") : (mode.includes("_L") ? " FSL L" : " FSL R");
                finalName = `${activeSize} = ${qty}${suf}`;
                w = mode.includes("HALF") ? db[activeSize].half.w : db[activeSize].full.w;
                h = mode.includes("HALF") ? db[activeSize].half.h : db[activeSize].full.h;
                await updateText(soDoc, "SIZE", activeSize);
                await updateText(soDoc, "quantity", qty);
            }

            if (w > 0 && h > 0) {
                // Flatten and Resize for Export
                await app.batchPlay([{ _obj: "flattenImage" }], {});
                await app.batchPlay([{ _obj: "imageSize", width: { _unit: "pixelsUnit", _value: w * res }, height: { _unit: "pixelsUnit", _value: h * res }, resolution: { _unit: "densityUnit", _value: res }, scaleStyles: false, constrainProportions: false }], {});
                
                // --- TRIM LOGIC FOR NAMENUM ---
                if (mode === "NAMENUM") {
                     await app.batchPlay([{ 
                        _obj: "trim", 
                        trimBasedOn: { _enum: "trimBasedOn", _value: "topLeftPixelColor" }, 
                        top: true, bottom: true, left: true, right: true 
                    }], {});
                }

                const cleanFN = finalName.replace(/[\/\\:*?"<>|]/g, "_");
                const saveFile = await outFolder.createFile(cleanFN + "." + format, { overwrite: true });
                const saveToken = await fs.createSessionToken(saveFile);
                
                let saveCmd = { 
                    _obj: "save", 
                    in: { _path: saveToken, _kind: "local" }, 
                    saveStage: { _enum: "saveStageType", _value: "saveBegin" }, 
                    embedProfiles: shouldEmbed, 
                    copy: true 
                };
                
                if(format === "jpg") {
                    saveCmd.as = { _obj: "JPEG", extendedQuality: 12 };
                } else if (format === "png") {
                    saveCmd.as = { _obj: "PNGFormat", method: { _enum: "PNGMethod", _value: "quick" } };
                } else {
                    let comp = { _enum: "encoding", _value: "none" };
                    if (useLZW) { comp = { _enum: "encoding", _value: "LZW" }; }
                    saveCmd.as = { _obj: "TIFF", imageCompression: comp };
                }
                
                await app.batchPlay([saveCmd], {});
                exportCount++;
                if (mode === "BACK") {
                    let usage = parseInt(localStorage.getItem("fivenest_production_usage") || "0");
                    usage++;
                    localStorage.setItem("fivenest_production_usage", usage.toString());
                    updateUsageDisplay();
                    if (PRODUCTION_LIMIT > 0 && usage >= PRODUCTION_LIMIT) {
                        throw new Error(`Production limit of ${PRODUCTION_LIMIT} pcs exceeded. Please upgrade.`);
                    }
                }
            }
            onStep();
        }
        
        await app.batchPlay([{ _obj: "close", saving: { _enum: "yesNo", _value: "no" } }], {});

    } catch (e) {
        log("Err in batch: " + e.message);
        if (app.activeDocument.id !== masterDocID) await app.batchPlay([{ _obj: "close", saving: { _enum: "yesNo", _value: "no" } }], {}); 
    }
    
    return exportCount;
}

// Helpers
async function updateLayerFont(doc, layerName, fontPostScriptName) {
    try {
        const layer = await findLayerRecursive(doc, layerName);
        if (layer && layer.kind === "text") { layer.textItem.font = fontPostScriptName; }
    } catch (e) { log(`Font warning: ${fontPostScriptName}`); }
}

// --- UNIVERSAL COMPRESSION (Transform Tool for ALL Layer Types) ---
async function compressLayerWidth(doc, layerName, maxInches, docRes) {
    const layer = await findLayerRecursive(doc, layerName);
    if (!layer) return;

    // 1. Select Layer
    await app.batchPlay([{_obj: "select", _target: [{_ref: "layer", _id: layer.id}]}], {});

    // 2. Measure (Raw bounds)
    const result = await app.batchPlay([{ _obj: "get", _target: [{ _ref: "layer", _id: layer.id }], _property: "bounds" }], { synchronousExecution: true });
    
    if (!result[0] || !result[0].bounds) return;

    const widthPx = result[0].bounds.right._value - result[0].bounds.left._value;
    const currentWidthInches = widthPx / docRes;

    // 3. Compress if Needed
    if (currentWidthInches > maxInches) {
        const pct = ((maxInches / currentWidthInches) * 100);
        
        // Use Transform for everything (works for Text AND Smart Objects)
        // explicitly UNLINK width/height to squish width only.
        await app.batchPlay([{ 
            _obj: "transform", 
            _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }], 
            width: { _unit: "percentUnit", _value: pct }, 
            height: { _unit: "percentUnit", _value: 100 }, 
            linked: false, // Force unlink aspect ratio
            freeTransformCenterState: { _enum: "quadCenterState", _value: "QCSAverage" } 
        }], {});
    }
}

async function findLayerRecursive(doc, name) {
    const search = name.toLowerCase();
    const traverse = (layers) => { for (const layer of layers) { if (layer.name.toLowerCase() === search) return layer; if (layer.layers) { const found = traverse(layer.layers); if(found) return found; } } return null; };
    return traverse(doc.layers);
}

async function updateText(doc, name, text) { try { const layer = await findLayerRecursive(doc, name); if (layer && layer.kind === "text") layer.textItem.contents = (text && text.trim() !== "") ? text : " "; } catch(e) {} }
function getVal(row, headers, key) { const idx = headers.indexOf(key); return (idx > -1 && row[idx]) ? row[idx].trim() : null; }
async function ensureFolder(root, name) { try { const f = await root.getEntry(name); if(f.isFolder) return f; } catch(e) {} return await root.createFolder(name); }
function parseCSV(text) { return text.split("\n").map(line => line.split(",")); }
function loadSizeToUI() { 
    const d = sizeDB[document.getElementById("sizeSelector").value]; 
    if(!d) return; 
    document.getElementById("frontW").value=d.front.w; document.getElementById("frontH").value=d.front.h; 
    document.getElementById("backW").value=d.back.w; document.getElementById("backH").value=d.back.h; 
    document.getElementById("halfW").value=d.half.w; document.getElementById("halfH").value=d.half.h; 
    document.getElementById("fullW").value=d.full.w; document.getElementById("fullH").value=d.full.h;
    if(d.nn) { document.getElementById("nnW").value=d.nn.w; document.getElementById("nnH").value=d.nn.h; }
    else { document.getElementById("nnW").value=0; document.getElementById("nnH").value=0; }
}
async function saveSizeFromUI() { 
    const k = document.getElementById("sizeSelector").value; 
    sizeDB[k] = { 
        front: { w: parseFloat(document.getElementById("frontW").value), h: parseFloat(document.getElementById("frontH").value) }, 
        back: { w: parseFloat(document.getElementById("backW").value), h: parseFloat(document.getElementById("backH").value) }, 
        half: { w: parseFloat(document.getElementById("halfW").value), h: parseFloat(document.getElementById("halfH").value) }, 
        full: { w: parseFloat(document.getElementById("fullW").value), h: parseFloat(document.getElementById("fullH").value) },
        nn: { w: parseFloat(document.getElementById("nnW").value), h: parseFloat(document.getElementById("nnH").value) }
    }; 
    try { 
        const f = await fs.getDataFolder(); 
        const file = await f.createFile("fivenest_sizes.json", {overwrite: true}); 
        await file.write(JSON.stringify(sizeDB)); 
        document.getElementById("saveMsg").innerText = "Saved!"; 
        setTimeout(()=>document.getElementById("saveMsg").innerText="", 1500); 
    } catch(e) { log("Save Err"); } 
}
async function loadDatabase() { try { const f=await fs.getDataFolder(); const file=await f.getEntry("fivenest_sizes.json"); if(file) sizeDB=JSON.parse(await file.read()); } catch(e){} }

// --- 🔥 STRICT VALIDATION SYSTEM 🔥 ---
function checkTrialStatus(lbl, runBtn, btnAct, txtEmail, txtKey, btnManage, licContent) {
    let trialStart = localStorage.getItem("fivenest_trial_start");
    if (!trialStart) {
        trialStart = Date.now().toString();
        localStorage.setItem("fivenest_trial_start", trialStart);
    }
    const msElapsed = Date.now() - parseInt(trialStart);
    const daysRemaining = 7 - (msElapsed / (1000 * 60 * 60 * 24));

    if (daysRemaining > 0) {
        lbl.innerText = `TRIAL ACTIVE (${Math.ceil(daysRemaining)} Days Left)`;
        lbl.style.color = "#00bcd4"; 
        
        runBtn.innerText = "▶ RUN AUTOMATION";
        runBtn.disabled = false;
        isSystemReady = true;

        btnAct.innerText = "ACTIVATE";
        txtEmail.style.display = "block";
        txtKey.style.display = "block";
        if (licContent) licContent.style.display = "block";
        if (btnManage) {
            btnManage.classList.remove("collapsed");
        }
    } else {
        lbl.innerText = "TRIAL EXPIRED / NO KEY";
        lbl.style.color = "#ff3b30";
        
        runBtn.innerText = "ENTER KEY TO RUN";
        runBtn.disabled = true;
        isSystemReady = false;

        btnAct.innerText = "ACTIVATE";
        txtEmail.style.display = "block";
        txtKey.style.display = "block";
        if (licContent) licContent.style.display = "block";
        if (btnManage) {
            btnManage.classList.remove("collapsed");
        }
    }
}

// --- 🔥 STRICT VALIDATION SYSTEM 🔥 ---
async function checkLicenseSystem(manualEmail = null, manualKey = null, isUserAction = false) {
    const lbl = document.getElementById("licenseStatus");
    const runBtn = document.getElementById("btnRun");
    const btnAct = document.getElementById("btnActivate");
    const txtEmail = document.getElementById("txtLicenseEmail");
    const txtKey = document.getElementById("txtLicenseKey");
    const btnManage = document.getElementById("btnToggleLicense");
    const licContent = document.getElementById("licenseContent");

    let savedEmail = localStorage.getItem("fivenest_license_email");
    let savedKey = localStorage.getItem("fivenest_license_key");

    if (manualEmail && manualKey) {
        savedEmail = manualEmail;
        savedKey = manualKey;
    }

    if (!savedEmail || !savedKey) {
        checkTrialStatus(lbl, runBtn, btnAct, txtEmail, txtKey, btnManage, licContent);
        return;
    }

    lbl.innerText = "Verifying...";
    lbl.style.color = "#ffcc00";
    runBtn.innerText = "VERIFYING...";
    runBtn.disabled = true;

    const authResult = await verifyFiveNestKey(savedEmail, savedKey); 
    
    if (authResult.success) {
        lbl.innerText = `LICENSE ACTIVE`;
        lbl.style.color = "#4cd964"; 
        
        localStorage.setItem("fivenest_license_email", savedEmail);
        localStorage.setItem("fivenest_license_key", savedKey);
        localStorage.setItem("fivenest_last_verified", Date.now().toString());
        btnAct.innerText = "LOGOUT";
        txtEmail.style.display = "block"; 
        txtKey.style.display = "block"; 
        if (licContent) licContent.style.display = "none";
        if (btnManage) {
            btnManage.classList.add("collapsed");
        }
        
        runBtn.innerText = "▶ RUN AUTOMATION";
        runBtn.disabled = false;
        isSystemReady = true;
        if(isUserAction) await app.showAlert("License Activated Successfully!");

    } else if (authResult.isOffline) {
        const lastVerified = parseInt(localStorage.getItem("fivenest_last_verified") || "0");
        const daysSinceVerify = (Date.now() - lastVerified) / (1000 * 60 * 60 * 24);

        if (daysSinceVerify <= GRACE_PERIOD_DAYS) {
            lbl.innerText = "OFFLINE - GRACE ACTIVE";
            lbl.style.color = "#ff9500"; 
            btnAct.innerText = "LOGOUT";
            txtEmail.style.display = "block"; 
            txtKey.style.display = "block"; 
            if (licContent) licContent.style.display = "none";
            if (btnManage) {
                btnManage.classList.add("collapsed");
            }
            runBtn.innerText = "▶ RUN (OFFLINE)";
            runBtn.disabled = false;
            isSystemReady = true;
            if(isUserAction) await app.showAlert("Offline Mode Active.");
        } else {
            lbl.innerText = "OFFLINE LOCKOUT";
            lbl.style.color = "#ff3b30";
            runBtn.innerText = "CONNECT TO INTERNET";
            runBtn.disabled = true;
            isSystemReady = false;
        }
    } else {
        localStorage.removeItem("fivenest_license_email"); 
        localStorage.removeItem("fivenest_license_key"); 
        txtKey.value = "";
        
        if(isUserAction) await app.showAlert("Activation Failed:\n\n" + authResult.message);
        
        checkTrialStatus(lbl, runBtn, btnAct, txtEmail, txtKey, btnManage, licContent);
    }
}

function getHardwareId() {
    let hwid = localStorage.getItem("fivenest_hwid");
    if (!hwid) {
        try {
            const osModule = require("os");
            hwid = "FN-" + osModule.hostname().toUpperCase().replace(/[^A-Z0-9]/g, '') + "-" + osModule.platform().toUpperCase();
        } catch(e) {
            hwid = "FN-" + Math.random().toString(36).substr(2, 9).toUpperCase();
        }
        localStorage.setItem("fivenest_hwid", hwid);
    }
    return hwid;
}

async function verifyFiveNestKey(email, key) {
    try {
        const machineId = getHardwareId();
        const payload = { 
            email: email.trim(),
            licenseKey: key.trim(), 
            deviceId: machineId,
            pluginId: PLUGIN_ID
        };

        const resp = await fetch(AUTH_SERVER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        const data = await resp.json();
        return { success: data.success, message: data.message || "Verification response received", isOffline: false };
    } catch(e) {
        return { success: false, message: "Could not connect to authentication server.", isOffline: true };
    }
}

function updateUsageDisplay() {
    const currentUsage = parseInt(localStorage.getItem("fivenest_production_usage") || "0");
    const tag = document.getElementById("versionTag");
    if (tag) {
        tag.innerText = `PRO V1.0 | Usage: ${currentUsage}/${PRODUCTION_LIMIT} pcs`;
    }
}