const ps = require("photoshop");
const { app, core, constants } = ps;
const fs = require("uxp").storage.localFileSystem;
const shell = require("uxp").shell;

let exportedDimensions = {};

function normalizePath(p) {
    if (!p) return "";
    return p.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/\/$/, "");
}

// --- 🔥 STRICT VERSIONING & SECURITY 🔥 ---
const PLUGIN_VERSION = "enterprise_v5.1_compact"; 
const PLUGIN_ID = "dd856c50";
const AUTH_SERVER_URL = "https://fivenest-backend.onrender.com/api/license/verify";
const GRACE_PERIOD_DAYS = 3; 

// --- 🌐 GOOGLE SHEETS API URL 🌐 ---
const GOOGLE_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyRg7nUM6zu66Nd7s7NsiFUM5kq1t_qkX3gdSUtKx4NiEtozxnkuUiIOKplzglZK2iKYQ/exec"; // <--- PASTE YOUR GOOGLE URL HERE

// --- DATA ---
const defaultSizes = {
    "18":{front:{w:11,h:15}, back:{w:11,h:15}, half:{w:9.5,h:5}, full:{w:9,h:14}, rHalf:{w:11, h:9}, rFull:{w:11, h:17}, nn:{w:5,h:5}},
    "20":{front:{w:12,h:16}, back:{w:12,h:16}, half:{w:10,h:5.5}, full:{w:10,h:15}, rHalf:{w:12, h:10}, rFull:{w:12, h:18}, nn:{w:6,h:6}},
    "22":{front:{w:13,h:17}, back:{w:13,h:17}, half:{w:11,h:6}, full:{w:11,h:16}, rHalf:{w:13, h:11}, rFull:{w:13, h:19}, nn:{w:6,h:6}},
    "24":{front:{w:14,h:20}, back:{w:14,h:20}, half:{w:12,h:6}, full:{w:12,h:17.5}, rHalf:{w:14, h:12}, rFull:{w:14, h:20}, nn:{w:7,h:7}},
    "26":{front:{w:15,h:21}, back:{w:15,h:21}, half:{w:12.5,h:7.5}, full:{w:12.5,h:18}, rHalf:{w:15, h:13}, rFull:{w:15, h:21}, nn:{w:7,h:7}},
    "28":{front:{w:15.8,h:23}, back:{w:15.8,h:23}, half:{w:14,h:8}, full:{w:14,h:19}, rHalf:{w:15.5, h:13.5}, rFull:{w:15.5, h:22}, nn:{w:8,h:8}},
    "30":{front:{w:17,h:25}, back:{w:17,h:25}, half:{w:14.5,h:8.5}, full:{w:14.5,h:20.5}, rHalf:{w:16, h:14}, rFull:{w:16, h:23}, nn:{w:8,h:8}},
    "32":{front:{w:18,h:26}, back:{w:18,h:26}, half:{w:15,h:9}, full:{w:15,h:21}, rHalf:{w:17, h:14.5}, rFull:{w:17, h:25}, nn:{w:9,h:9}},
    "34":{front:{w:19,h:27}, back:{w:19,h:27}, half:{w:16,h:9.5}, full:{w:16,h:22.5}, rHalf:{w:17, h:15.5}, rFull:{w:17, h:28}, nn:{w:9,h:9}},
    "36":{front:{w:20,h:28}, back:{w:20,h:28}, half:{w:17,h:10.5}, full:{w:17,h:23.5}, rHalf:{w:18, h:16.5}, rFull:{w:18, h:31}, nn:{w:10,h:10}},
    "38":{front:{w:21,h:29}, back:{w:21,h:29}, half:{w:18,h:10.5}, full:{w:18,h:24}, rHalf:{w:18.5, h:16.5}, rFull:{w:18.5, h:31}, nn:{w:10,h:10}},
    "40":{front:{w:22,h:30}, back:{w:22,h:30}, half:{w:19,h:10.5}, full:{w:19,h:25}, rHalf:{w:19, h:16.5}, rFull:{w:19, h:31}, nn:{w:11,h:11}},
    "42":{front:{w:23,h:31}, back:{w:23,h:31}, half:{w:20,h:11.5}, full:{w:20,h:25}, rHalf:{w:20, h:17.5}, rFull:{w:20, h:31.5}, nn:{w:11,h:11}},
    "44":{front:{w:24,h:31.8}, back:{w:24,h:31.8}, half:{w:21,h:12.5}, full:{w:21,h:26}, rHalf:{w:21, h:18}, rFull:{w:21, h:32}, nn:{w:11,h:11}},
    "46":{front:{w:25,h:33}, back:{w:25,h:33}, half:{w:22,h:13}, full:{w:22,h:27}, rHalf:{w:22, h:18.5}, rFull:{w:22, h:32}, nn:{w:12,h:12}},
    "48":{front:{w:26,h:33.5}, back:{w:26,h:33.5}, half:{w:23.5,h:13.5}, full:{w:23.5,h:27.5}, rHalf:{w:22.5, h:19}, rFull:{w:22.5, h:33}, nn:{w:12,h:12}},
    "50":{front:{w:27,h:34}, back:{w:27,h:34}, half:{w:23,h:14}, full:{w:24,h:28}, rHalf:{w:23, h:19.5}, rFull:{w:23, h:33}, nn:{w:12,h:12}},
    "52":{front:{w:28,h:34.5}, back:{w:28,h:34.5}, half:{w:23,h:14.5}, full:{w:24.5,h:28.5}, rHalf:{w:23.5, h:20}, rFull:{w:23.5, h:33.5}, nn:{w:13,h:13}},
    "54":{front:{w:29,h:34.5}, back:{w:29,h:34.5}, half:{w:24,h:15}, full:{w:25.5,h:29}, rHalf:{w:24, h:20.5}, rFull:{w:24, h:34}, nn:{w:13,h:13}},
    "56":{front:{w:30,h:35}, back:{w:30,h:35}, half:{w:25,h:15}, full:{w:26,h:29}, rHalf:{w:24.5, h:21}, rFull:{w:24.5, h:34}, nn:{w:13,h:13}},
    "58":{front:{w:31,h:36}, back:{w:31,h:36}, half:{w:25.5,h:15.5}, full:{w:26,h:29}, rHalf:{w:25, h:21.5}, rFull:{w:25, h:34.5}, nn:{w:13,h:13}},
    "60":{front:{w:32,h:37}, back:{w:32,h:37}, half:{w:26,h:16}, full:{w:26,h:29}, rHalf:{w:25.5, h:22}, rFull:{w:25.5, h:34.5}, nn:{w:13,h:13}}
};

let sizeDB = defaultSizes; 
let selectedCSVFolder = null;
let selectedCSVFile = null; 
let selectedFolder = null;
let startTime = 0;
let isSystemReady = false; 
const PRODUCTION_LIMIT = 0;

document.addEventListener("DOMContentLoaded", async () => {
    
    // --- 🔥 4-TAB LOGIC 🔥 ---
    const tabs = ["Run", "Edit", "Manual", "Help"];
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
    document.getElementById("tabManual").onclick = () => switchTab("Manual");
    document.getElementById("tabHelp").onclick = () => switchTab("Help");

    // --- 🔥 INJECT MANUAL QTY GRID (COMPACTED) 🔥 ---
    const qtyGrid = document.getElementById("qtyGrid");
    if(qtyGrid) {
        const sizesToRender = ["18","20","22","24","26","28","30","32","34","36","38","40","42","44","46","48","50","52","54","56","58","60"];
        sizesToRender.forEach(sz => {
            let row = document.createElement("div");
            row.style.display = "flex"; row.style.alignItems = "center"; row.style.marginBottom = "3px"; // Tighter rows
            
            let lbl = document.createElement("div");
            lbl.innerText = sz; lbl.style.flex = "1"; lbl.style.fontWeight = "bold"; lbl.style.color = "#03A9F4"; lbl.style.fontSize = "10px";
            
            let wFB = document.createElement("div"); wFB.style.flex="1.2"; wFB.style.textAlign="center";
            let inpFB = document.createElement("input"); inpFB.type = "number"; inpFB.className = "qty-input"; inpFB.id = "qty_fb_" + sz;
            wFB.appendChild(inpFB);
            
            let wHalf = document.createElement("div"); wHalf.style.flex="1.2"; wHalf.style.textAlign="center";
            let inpHalf = document.createElement("input"); inpHalf.type = "number"; inpHalf.className = "qty-input"; inpHalf.id = "qty_half_" + sz;
            wHalf.appendChild(inpHalf);
            
            let wFull = document.createElement("div"); wFull.style.flex="1.2"; wFull.style.textAlign="center";
            let inpFull = document.createElement("input"); inpFull.type = "number"; inpFull.className = "qty-input"; inpFull.id = "qty_full_" + sz;
            wFull.appendChild(inpFull);

            row.appendChild(lbl); row.appendChild(wFB); row.appendChild(wHalf); row.appendChild(wFull);
            qtyGrid.appendChild(row);
        });

        document.getElementById("btnClearQty").onclick = () => {
            document.querySelectorAll(".qty-input").forEach(inp => inp.value = "");
        };
    }

    // --- 🔥 TOGGLE TAB VISIBILITY FOR "MANUAL LIVE INPUT" 🔥 ---
    document.getElementById("chkManualMode").addEventListener("change", (e) => {
        const tabManual = document.getElementById("tabManual");
        const csvBtnContainer = document.getElementById("csvInputContainer");
        const chkMulti = document.getElementById("chkMultiTeam");
        const lblMulti = document.getElementById("lblMultiTeam");
        const chkSameFB = document.getElementById("chkSameFrontBack");
        
        if (e.target.checked) {
            tabManual.classList.remove("hidden-control");
            csvBtnContainer.classList.add("hidden-control");
            chkMulti.checked = false; chkMulti.disabled = true;
            if(lblMulti) lblMulti.style.opacity = "0.4";
            
            chkSameFB.checked = true;
            chkSameFB.disabled = true;

            selectedCSVFile = null; selectedCSVFolder = null;
            document.getElementById("lblCSVInput").innerText = "None";
            document.getElementById("lblCSVInput").style.color = "";
        } else {
            tabManual.classList.add("hidden-control");
            csvBtnContainer.classList.remove("hidden-control");
            chkMulti.disabled = false;
            chkSameFB.disabled = false;
            if(lblMulti) lblMulti.style.opacity = "1";
            
            if(document.getElementById("panelManual").classList.contains("active")) switchTab("Run");
        }
    });

    document.getElementById("nestTool").addEventListener("change", (e) => {
        if (e.target.value === "auto") {
            document.getElementById("nestFormat").value = "pdf";
            document.getElementById("nestFormat").disabled = true;
        } else {
            document.getElementById("nestFormat").disabled = false;
        }
    });

    await loadDatabase();
    await loadDefaults();
    
    if (document.getElementById("nestTool") && document.getElementById("nestTool").value === "auto") {
        document.getElementById("nestFormat").value = "pdf";
        document.getElementById("nestFormat").disabled = true;
    } 
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
    
    document.getElementById("chkMultiTeam").addEventListener("change", (e) => {
        const btn = document.getElementById("btnCSVInput");
        if (e.target.checked) {
            btn.innerText = "Select CSV Folder";
        } else {
            btn.innerText = "Select CSV File";
        }
        document.getElementById("lblCSVInput").innerText = "None";
        document.getElementById("lblCSVInput").style.color = "";
        selectedCSVFolder = null;
        selectedCSVFile = null;
    });

    const elMergeSleeves = document.getElementById("chkMergeHalfSleeves");
    if (elMergeSleeves) {
        elMergeSleeves.addEventListener("change", async (e) => {
            if (e.target.checked) {
                log(">>> Please select background color for the sleeve merge.");
                let r = 255, g = 255, b = 255;
                try {
                    const selectedColor = await app.showColorPicker();
                    if (selectedColor && selectedColor.rgb) {
                        r = selectedColor.rgb.red;
                        g = selectedColor.rgb.green;
                        b = selectedColor.rgb.blue;
                    }
                } catch (err) {
                    // Fallback to white
                }

                try {
                    await core.executeAsModal(async () => {
                        app.backgroundColor.rgb.red = r;
                        app.backgroundColor.rgb.green = g;
                        app.backgroundColor.rgb.blue = b;
                    }, { commandName: "Set Background Color" });
                    log(`>>> Background color set to RGB(${r}, ${g}, ${b})`);
                } catch (modalErr) {
                    log("Error setting background color: " + modalErr.message);
                }
            }
        });
    }

    document.getElementById("btnCSVInput").addEventListener("click", async () => {
        const isMulti = document.getElementById("chkMultiTeam").checked;
        if (isMulti) {
            const folder = await fs.getFolder();
            if (folder) { 
                selectedCSVFolder = folder; 
                document.getElementById("lblCSVInput").innerText = folder.name; 
                document.getElementById("lblCSVInput").style.color = "#4CAF50"; 
                log("CSV Folder Set."); 
            }
        } else {
            const fileObj = await fs.getFileForOpening();
            if (fileObj) {
                const file = Array.isArray(fileObj) ? fileObj[0] : fileObj;
                selectedCSVFile = file;
                document.getElementById("lblCSVInput").innerText = file.name; 
                document.getElementById("lblCSVInput").style.color = "#4CAF50"; 
                log("Single CSV File Set."); 
            }
        }
    });

    document.getElementById("btnFolder").addEventListener("click", async () => {
        const folder = await fs.getFolder();
        if (folder) { selectedFolder = folder; document.getElementById("lblFolder").innerText = folder.name; document.getElementById("lblFolder").style.color = "#4CAF50"; log("Output Set."); }
    });
    
    document.getElementById("btnValidate").onclick = validateCSV; 
    document.getElementById("btnRefineAI").onclick = async () => {
        await shell.openExternal("https://gemini.google.com/gem/1vc3MbyzLtt5RspOpQualSpuViseurHd4?usp=sharing", "Opening Gemini AI Refiner link");
    };
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
            title: "Half-Sleeve Merge",
            keywords: ["half sleeve", "merge", "join", "sleeve merge", "padding", "white padding"],
            summary: "Half-Sleeve Merge joins left and right sleeves vertically with 0.2\" white padding.",
            details: "When **Half-Sleeve Merge** is checked, the plugin exports Left and Right half sleeves as normal, then vertically merges them (Left on top, Right on bottom) with exactly **0.2 inches** of solid white padding. It saves the combined file and deletes the original two separate files."
        },
        {
            title: "Raglan Style",
            keywords: ["raglan", "sleeves", "style"],
            summary: "Raglan Style exports sleeves optimized for raglan shirts.",
            details: "When **Raglan Style** is checked, the export logic adapts layout structures for Raglan-cut shirts and appends a `Raglan` tag to the filename."
        },
        {
            title: "Smart Mockup",
            keywords: ["mockup", "mockups", "smart mockup", "preview"],
            summary: "Smart Mockup automatically generates preview images of your designs.",
            details: "When **Smart Mockup** is checked, the plugin automatically toggles the mockup template background groups and saves JPG previews of the front/back designs in a designated `Mockups` subdirectory."
        },
        {
            title: "Quick Size Entry",
            keywords: ["quick size", "manual", "data entry", "size entry", "live size", "live input"],
            summary: "Quick Size Entry lets you input quantities directly in the plugin.",
            details: "Click the **Live Size/Qty** tab to open the Virtual Data Entry grid. You can type in the quantity of front/back, half sleeves, and full sleeves per size (18 to 60) directly in Photoshop. This is useful for quickly printing custom adjustments without a CSV file."
        },
        {
            title: "AI Smart CSV",
            keywords: ["ai", "smart csv", "refine", "csv", "refiner", "gemini"],
            summary: "AI Smart CSV opens the Gemini refiner link in your browser.",
            details: "Clicking **AI Smart CSV** opens a custom Gemini Gem link in your default browser. You can paste messy client emails or order data there, and Gemini will instantly clean and format it into a valid production CSV file."
        },
        {
            title: "Save Default",
            keywords: ["save default", "default", "save def", "defaults"],
            summary: "Save Default remembers your current settings.",
            details: "Clicking **Save Default** saves your selected checkbox configurations, resolution, format, and compression settings to `autonest_config.json`. These settings will automatically load next time you open Photoshop."
        },
        {
            title: "How to Run Automation",
            keywords: ["run", "how to use", "start", "automation", "begin", "steps"],
            summary: "Learn the step-by-step guide to run a batch automation job.",
            details: "To run a batch job:\n1. Choose your inputs: load a CSV file or enter quantities in the *Live Size/Qty* tab.\n2. Choose your outputs: click *Select Output* folder.\n3. Configure options (Format, Resolution, compression, and sleeve merge options).\n4. Click **Run Automation** to process everything automatically."
        },
        {
            title: "Tiers & Usage Limits",
            keywords: ["limit", "usage", "subscription", "starter", "pro", "premium", "enterprise", "pcs", "free trial", "trial"],
            summary: "Learn about product limits and trial activation.",
            details: "Usage limits are calculated *only* when a BACK layer is exported:\n- **Starter**: 500 pcs limit\n- **Pro**: 2,000 pcs limit\n- **Premium**: 10,000 pcs limit\n- **Enterprise**: Unlimited!\n\nNew installations get a **7-Day Free Trial** with full functionality before requiring license activation."
        }
    ];

    function appendMessage(text, sender) {
        const bubble = document.createElement("div");
        bubble.className = "chat-bubble chat-bubble-" + sender;
        bubble.innerText = text;
        chatHistory.appendChild(bubble);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    async function openWhatsAppSupport() {
        const email = localStorage.getItem("fivenest_license_email") || "Unregistered User";
        const clientName = document.getElementById("txtCustomerName") ? document.getElementById("txtCustomerName").value.trim() : "";
        const nameSection = clientName ? `${clientName} (${email})` : email;
        const rawMessage = `Hello Vilesh, I need assistance with FN Enterprise. (User: ${nameSection})`;
        const encodedMessage = encodeURIComponent(rawMessage);
        const url = `https://wa.me/918879228710?text=${encodedMessage}`;
        
        try {
            await shell.openExternal(url, "Opening WhatsApp Support");
        } catch(e) {
            log("Failed to open WhatsApp: " + e.message);
        }
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
        const suggestionTitles = ["Blank Kit", "Half-Sleeve Merge", "Smart Mockup", "Quick Size Entry", "AI Smart CSV", "How to Run"];
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
                    "• Half-Sleeve Merge\n" +
                    "• Raglan Style\n" +
                    "• Smart Mockup\n" +
                    "• Quick Size Entry\n" +
                    "• AI Smart CSV\n" +
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
        appendMessage("Hi! I'm your FN Enterprise offline assistant. Ask me about any feature (e.g. Blank Kit, Half-Sleeve Merge, Quick Size Entry) or click a suggestion below!", "assistant");
    };

    // Initialize welcome
    appendMessage("Hi! I'm your FN Enterprise offline assistant. Ask me about any feature (e.g. Blank Kit, Half-Sleeve Merge, Quick Size Entry) or click a suggestion below!", "assistant");
    renderSuggestions();

    await checkLicenseSystem();
});

function updateUIOptions() {
    const fmt = document.getElementById("exportFormat").value;
    const chkEmbed = document.getElementById("chkEmbedProfile");
    const containerLZW = document.getElementById("containerLZW");
    const lblEmbed = document.getElementById("lblEmbed");

    if (fmt === "png") { chkEmbed.disabled = true; lblEmbed.classList.add("disabled-text"); containerLZW.classList.add("hidden-control"); } 
    else if (fmt === "jpg") { chkEmbed.disabled = false; lblEmbed.classList.remove("disabled-text"); containerLZW.classList.add("hidden-control"); } 
    else if (fmt === "tiff") { chkEmbed.disabled = false; lblEmbed.classList.remove("disabled-text"); containerLZW.classList.remove("hidden-control"); }
}

async function saveDefaults() {
    const config = {
        format: document.getElementById("exportFormat").value, res: document.getElementById("resolution").value,
        limitName: document.getElementById("limitName").value, limitNum: document.getElementById("limitNum").value,
        embed: document.getElementById("chkEmbedProfile").checked, lzw: document.getElementById("chkLZW").checked,
        mockup: document.getElementById("chkMockup").checked, sameFB: document.getElementById("chkSameFrontBack").checked,
        nameNum: document.getElementById("chkNameNum").checked, raglan: document.getElementById("chkRaglan").checked,
        mergeHalfSleeves: document.getElementById("chkMergeHalfSleeves") ? document.getElementById("chkMergeHalfSleeves").checked : false,
        pdfPreview: document.getElementById("chkPDFPreview") ? document.getElementById("chkPDFPreview").checked : false,
        autoNesting: document.getElementById("chkAutoNesting") ? document.getElementById("chkAutoNesting").checked : false,
        nestRollW: document.getElementById("nestRollW").value,
        nestRollH: document.getElementById("nestRollH").value,
        nestItemGap: document.getElementById("nestItemGap").value,
        nestFormat: document.getElementById("nestFormat").value,
        nestTool: document.getElementById("nestTool").value,
        nestTightestFit: document.getElementById("chkTightestFit") ? document.getElementById("chkTightestFit").checked : false,
        nestRotateToFit: document.getElementById("chkRotateToFit") ? document.getElementById("chkRotateToFit").checked : false,
        multi: document.getElementById("chkMultiTeam").checked,
        manualMode: document.getElementById("chkManualMode").checked,
        customerName: document.getElementById("txtCustomerName").value,
        orderNum: document.getElementById("txtOrderNum").value 
    };
    try {
        const f = await fs.getDataFolder();
        const file = await f.createFile("autonest_config.json", { overwrite: true });
        await file.write(JSON.stringify(config));
        log("✅ Settings Saved as Default.");
    } catch(e) { log("Error saving defaults"); }
}

async function loadDefaults() {
    try {
        const f = await fs.getDataFolder();
        let file;
        try {
            file = await f.getEntry("autonest_config.json");
        } catch(e) {
            try {
                file = await f.getEntry("fivenest_config.json");
            } catch(e2) {}
        }
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
            if(config.raglan !== undefined) document.getElementById("chkRaglan").checked = config.raglan;
            if(config.mergeHalfSleeves !== undefined && document.getElementById("chkMergeHalfSleeves")) document.getElementById("chkMergeHalfSleeves").checked = config.mergeHalfSleeves;
            if(config.pdfPreview !== undefined && document.getElementById("chkPDFPreview")) document.getElementById("chkPDFPreview").checked = config.pdfPreview;
            if(config.autoNesting !== undefined && document.getElementById("chkAutoNesting")) document.getElementById("chkAutoNesting").checked = config.autoNesting;
            if(config.nestRollW) document.getElementById("nestRollW").value = config.nestRollW;
            if(config.nestRollH) document.getElementById("nestRollH").value = config.nestRollH;
            if(config.nestItemGap) document.getElementById("nestItemGap").value = config.nestItemGap;
            if(config.nestFormat) document.getElementById("nestFormat").value = config.nestFormat;
            if(config.nestTool) document.getElementById("nestTool").value = config.nestTool;
            if(config.nestTightestFit !== undefined && document.getElementById("chkTightestFit")) document.getElementById("chkTightestFit").checked = config.nestTightestFit;
            if(config.nestRotateToFit !== undefined && document.getElementById("chkRotateToFit")) document.getElementById("chkRotateToFit").checked = config.nestRotateToFit;
            if(config.customerName !== undefined) document.getElementById("txtCustomerName").value = config.customerName;
            if(config.orderNum !== undefined) document.getElementById("txtOrderNum").value = config.orderNum;
            if(config.multi !== undefined) document.getElementById("chkMultiTeam").checked = config.multi;
            if(config.manualMode !== undefined) {
                document.getElementById("chkManualMode").checked = config.manualMode;
                document.getElementById("chkManualMode").dispatchEvent(new Event('change')); 
            }
            updateUIOptions();
            log("Loaded Default Settings.");
        }
    } catch(e) {}
}

async function validateCSV() {
    const isManual = document.getElementById("chkManualMode").checked;
    if (isManual) { log("✅ Live Size Mode Active. CSV is bypassed."); return; }
    
    const isMulti = document.getElementById("chkMultiTeam").checked;
    if (isMulti) {
        if (!selectedCSVFolder) { log("❌ Select a CSV Folder first."); return; }
        const entries = await selectedCSVFolder.getEntries();
        const csvFiles = entries.filter(e => e.isFile && e.name.toLowerCase().endsWith('.csv'));
        if (csvFiles.length === 0) { log("❌ No CSV files found."); await app.showAlert("No CSV files found in folder."); return; }
        log(`✅ Found ${csvFiles.length} CSV files.`);
    } else {
        if (!selectedCSVFile) { log("❌ Select a single CSV File first."); return; }
        log(`✅ Ready to process single file: ${selectedCSVFile.name}`);
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

// --- 🔥 GOOGLE SHEETS SYNC (WITH FAKE-SUCCESS DETECTION) 🔥 ---
async function sendToGoogleSheet(fileName, customerName, backQuantity, panelOrderNumber) {
    if (!GOOGLE_WEBAPP_URL || GOOGLE_WEBAPP_URL === "YOUR_GOOGLE_WEB_APP_URL_HERE") {
        log("⚠️ Skipping Google Sheets: URL is missing in index.js");
        return; 
    }
    try {
        log(`⏳ Syncing [${fileName}] to Google...`);
        const response = await fetch(GOOGLE_WEBAPP_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" }, 
            body: JSON.stringify({ fileName: fileName, customerName: customerName, quantity: backQuantity, panelOrderNumber: panelOrderNumber })
        });
        
        const resultText = await response.text(); 
        
        if (resultText.includes("SUCCESS_SAVED")) {
            log(`📊 Success! Logged Order to Sheets. Qty: ${backQuantity}`);
        } else if (resultText.includes("<html") || resultText.includes("Sign in") || resultText.includes("accounts.google.com")) {
            log(`❌ GOOGLE BLOCKED IT: Google is asking for a Login. You must set 'Who has access' to 'Anyone' in your Deployment!`);
        } else {
            log(`🤖 Google Error Reply: ${resultText}`); 
        }
    } catch(e) {
        log(`❌ Connection Failed: ${e.message}`);
    }
}

// --- 🔥 CORE ENGINE REWRITE 🔥 ---
async function runEngine() {
    exportedDimensions = {};
    if(!isSystemReady) {
        await app.showAlert("Cannot Run: Check Internet connection or License status.");
        await checkLicenseSystem(); 
        return;
    }

    const currentUsage = parseInt(localStorage.getItem("fivenest_production_usage") || "0");
    if (PRODUCTION_LIMIT > 0 && currentUsage >= PRODUCTION_LIMIT) {
        await app.showAlert("Limit has been exceeded. Please upgrade.");
        log("❌ Run blocked: Production limit exceeded.");
        return;
    }
    if (!app.documents || app.documents.length === 0 || !app.activeDocument) {
        await app.showAlert("ERROR: Please open your Master PSD template in Photoshop before running.");
        log("❌ Error: No document open."); return;
    }

    const sameFB = document.getElementById("chkSameFrontBack").checked;
    const isManual = document.getElementById("chkManualMode").checked;
    const isMultiTeam = document.getElementById("chkMultiTeam").checked;
    const globalCustomerName = document.getElementById("txtCustomerName").value.trim() || "Unknown Customer";
    const globalOrderNum = document.getElementById("txtOrderNum").value.trim() || "01";

    if (!isManual) {
        if (isMultiTeam && !selectedCSVFolder) { await app.showAlert("Please select a CSV Folder."); return; }
        if (!isMultiTeam && !selectedCSVFile) { await app.showAlert("Please select a CSV File."); return; }
    }
    if (!selectedFolder) { await app.showAlert("Please select an Output Folder."); return; }

    const chkMergeHalfSleeves = document.getElementById("chkMergeHalfSleeves") ? document.getElementById("chkMergeHalfSleeves").checked : false;
    
    const res = parseInt(document.getElementById("resolution").value);
    const format = document.getElementById("exportFormat").value.toLowerCase();
    const shouldEmbed = document.getElementById("chkEmbedProfile").checked;
    const useLZW = document.getElementById("chkLZW").checked;
    const doMockup = document.getElementById("chkMockup").checked;
    const doNameNum = document.getElementById("chkNameNum").checked; 
    const isRaglan = document.getElementById("chkRaglan").checked; 
    const doPDFPreview = document.getElementById("chkPDFPreview") ? document.getElementById("chkPDFPreview").checked : false; 

    document.getElementById("workCaption").classList.remove("hidden-control");
    startTime = Date.now();

    try {
        let mappedJobs = [];
        let totalSteps = 0;
        let currentStep = 0;

        await core.executeAsModal(async () => {
            const masterDocID = app.activeDocument.id;
            
            // 🔥 VIRTUAL CSV MODE (LIVE SIZE TAB DATA) 🔥
            if (isManual) {
                log(">>> Initializing Live Size Mode (CSV Bypassed)...");
                const headers = ["front size", "total qty", "half sleeve", "full sleeve"];
                const dataRows = [];
                
                const sizesToRender = ["18","20","22","24","26","28","30","32","34","36","38","40","42","44","46","48","50","52","54","56","58","60"];
                for(let sz of sizesToRender) {
                    let elFB = document.getElementById("qty_fb_" + sz);
                    let elHalf = document.getElementById("qty_half_" + sz);
                    let elFull = document.getElementById("qty_full_" + sz);
                    
                    let fb = (elFB && elFB.value) ? elFB.value.toString() : "0";
                    let half = (elHalf && elHalf.value) ? elHalf.value.toString() : "0";
                    let full = (elFull && elFull.value) ? elFull.value.toString() : "0";
                    
                    if (parseInt(fb) > 0 || parseInt(half) > 0 || parseInt(full) > 0) {
                        dataRows.push([sz, fb, half, full]);
                    }
                }
                
                if (dataRows.length === 0) {
                    throw new Error("No quantities entered! Please fill out numbers in the Live Size tab.");
                }
                
                let virtualFileName = `${globalCustomerName.replace(/[\/\\:*?"<>|]/g, "_")} - ${globalOrderNum}.csv`;
                if (virtualFileName === " - .csv" || virtualFileName === " - 01.csv") virtualFileName = "ManualOrder.csv";
                
                mappedJobs.push({ design: { name: "Single_Design" }, file: { name: virtualFileName }, rows: dataRows, headers: headers });
            }
            else if (isMultiTeam) {
                const entries = await selectedCSVFolder.getEntries();
                const csvFiles = entries.filter(e => e.isFile && e.name.toLowerCase().endsWith('.csv'));
                if (csvFiles.length === 0) throw new Error("No CSV files found in selected folder.");

                log(">>> Scanning Master Template (Multi-Mode)...");
                const frontLayer = await findLayerRecursive(app.activeDocument, "Front");
                if (!frontLayer) throw new Error("Cannot find 'Front' Smart Object.");

                await app.batchPlay([{ _obj: "select", _target: [{ _ref: "layer", _id: frontLayer.id }] }], {});
                await app.batchPlay([{ _obj: "placedLayerEditContents", _options: { dialogOptions: "dontDisplay" } }], {});
                
                const scanDoc = app.activeDocument;
                const designLayers = [];
                for (let i = 0; i < scanDoc.layers.length; i++) {
                    const l = scanDoc.layers[i];
                    if (!l.name.toLowerCase().includes("background") && !l.name.toLowerCase().includes("bg") && !l.name.toLowerCase().includes("color fill") && l.kind !== "text" && l.kind !== "solidColorLayer") {
                        designLayers.push(l);
                    }
                }
                
                const designInfo = designLayers.map(l => {
                    let numMatch = l.name.match(/\d+/);
                    return { name: l.name, numberVal: numMatch ? parseInt(numMatch[0], 10) : null, prefix: l.name.substring(0, 2).trim() };
                });
                
                await app.batchPlay([{ _obj: "close", saving: { _enum: "yesNo", _value: "no" } }], {});

                for (let d of designInfo) {
                    let matchedFile = null;
                    if (d.numberVal !== null) { matchedFile = csvFiles.find(f => { let csvNumMatch = f.name.match(/\d+/); return csvNumMatch && parseInt(csvNumMatch[0], 10) === d.numberVal; }); }
                    if (!matchedFile) { matchedFile = csvFiles.find(f => f.name.toLowerCase().includes(d.prefix.toLowerCase())); }

                    if (matchedFile) {
                        const csvText = await matchedFile.read();
                        const csvRows = parseCSV(csvText);
                        const headers = csvRows[0].map(h => h.toLowerCase().trim());
                        const dataRows = csvRows.slice(1).filter(r => r.length > 0 && r[0] !== "");
                        
                        if (dataRows.length > 0) {
                            mappedJobs.push({ design: d, file: matchedFile, rows: dataRows, headers: headers });
                        }
                    } else {
                        log(`⚠️ Skipped Design [${d.name}] - No matching CSV found.`);
                    }
                }
            } 
            else {
                log(">>> Initializing Single CSV Mode...");
                const csvText = await selectedCSVFile.read();
                const csvRows = parseCSV(csvText);
                const headers = csvRows[0].map(h => h.toLowerCase().trim());
                const dataRows = csvRows.slice(1).filter(r => r.length > 0 && r[0] !== "");
                
                if (dataRows.length > 0) {
                    mappedJobs.push({ design: { name: "Single_Design" }, file: selectedCSVFile, rows: dataRows, headers: headers });
                }
            }

            if (mappedJobs.length === 0) throw new Error("No valid data rows found to process.");
            
            // Calculate totalSteps dynamically based on active layer modes per job
            totalSteps = 0;
            for (const job of mappedJobs) {
                const active = getJobActiveLayerModes(job, sameFB, doNameNum);
                totalSteps += job.rows.length * active.modes.length;
            }

            updateProgressUI(0, totalSteps);
            const stats = { Front: 0, Back: 0, Sleeves: 0, NameNum: 0 };

            for (const job of mappedJobs) {
                const actualOrderCode = job.file.name.replace(/\.[^/.]+$/, ""); 
                log(`\n>>> PROCESSING: ${job.design.name === "Single_Design" ? job.file.name : job.design.name}`);
                
                const cleanDesignName = job.design.name === "Single_Design" 
                    ? actualOrderCode.replace(/[\/\\:*?"<>|]/g, "_").trim() 
                    : job.design.name.replace(/[\/\\:*?"<>|]/g, "_").trim();
                
                const designFolder = await ensureFolder(selectedFolder, cleanDesignName);
                
                const active = getJobActiveLayerModes(job, sameFB, doNameNum);

                let layerModes = [];
                if (active.hasFront) layerModes.push({ name: "Front", mode: "FRONT", folderName: "Front" });
                if (active.hasBack) layerModes.push({ name: "Back", mode: "BACK", folderName: "Back" });
                if (active.hasSleeve) {
                    layerModes.push({ name: "Half Left SL", mode: "HALF_L", folderName: "Sleeve" });
                    layerModes.push({ name: "Half Right SL", mode: "HALF_R", folderName: "Sleeve" });
                    layerModes.push({ name: "Full Left SL", mode: "FULL_L", folderName: "Sleeve" });
                    layerModes.push({ name: "Full Right SL", mode: "FULL_R", folderName: "Sleeve" });
                }
                if (active.hasNameNum) layerModes.push({ name: "Only Name & Number", mode: "NAMENUM", folderName: "Name_Number" });

                let currentJobBackCount = 0; 
                let jobSleevesCount = 0;

                for (const lm of layerModes) {
                    await app.batchPlay([{ _obj: "select", _target: [{ _ref: "document", _id: masterDocID }] }], {});
                    const layer = await findLayerRecursive(app.activeDocument, lm.name);
                    if (!layer || !layer.visible) {
                        job.rows.forEach(() => { currentStep++; updateProgressUI(currentStep, totalSteps); });
                        continue;
                    }

                    const outFolder = await ensureFolder(designFolder, lm.folderName);
                    const count = await processMappedDesignBatch(
                        masterDocID, lm.name, job.design.name, job.rows, job.headers, outFolder, 
                        res, format, lm.mode, sizeDB, shouldEmbed, useLZW, sameFB, isRaglan, 
                        () => { currentStep++; updateProgressUI(currentStep, totalSteps); }
                    );
                    
                    if (lm.mode === "FRONT") stats.Front += count;
                    else if (lm.mode === "BACK") { 
                        stats.Back += count; 
                        currentJobBackCount += count; 
                    }
                    else if (lm.mode === "NAMENUM") stats.NameNum += count;
                    else {
                        stats.Sleeves += count;
                        jobSleevesCount += count;
                    }
                }

                const chkMergeHalfSleeves = document.getElementById("chkMergeHalfSleeves") ? document.getElementById("chkMergeHalfSleeves").checked : false;
                if (chkMergeHalfSleeves && active.hasSleeve && jobSleevesCount > 0) {
                    const sleeveFolder = await ensureFolder(designFolder, "Sleeve");
                    log(">>> Merging Half Sleeves...");
                    await mergeHalfSleevesBatch(sleeveFolder, job.rows, job.headers, res, format, isRaglan);
                }

                if (doMockup) {
                    log(`>>> Generating Mockups...`);
                    await generateDesignMockups(masterDocID, job.design.name, designFolder, job.file.name);
                }

                // 🔥 SEND TO GOOGLE SHEETS WITH ORDER NUMBER (Asynchronous background process) 🔥
                sendToGoogleSheet(actualOrderCode, globalCustomerName, currentJobBackCount, globalOrderNum);
            }

            // Generate low-res merged preview PDF for all jobs if checked
            if (doPDFPreview) {
                await generatePreviewPDF(mappedJobs, selectedFolder, globalCustomerName, globalOrderNum);
            }

            // Generate high-resolution nested layout if checked
            const doAutoNesting = document.getElementById("chkAutoNesting") ? document.getElementById("chkAutoNesting").checked : false;
            if (doAutoNesting) {
                await generateAutoNesting(selectedFolder, globalCustomerName, globalOrderNum);
            }

            updateProgressUI(totalSteps, totalSteps);
            const totalTime = Math.round((Date.now() - startTime) / 1000);
            log(`\n--- SUMMARY ---`);
            log(`Time Taken: ${Math.floor(totalTime/60)}m ${totalTime%60}s`);
            log(`F: ${stats.Front} | B: ${stats.Back} | SL: ${stats.Sleeves} | NN: ${stats.NameNum}`);
            log("✅ AUTOMATION COMPLETE!");
            
            await app.showAlert("Automation Finished Successfully!");

        }, { commandName: "Auto Nesting Enterprise Running..." });

    } catch(e) { 
        let errorMsg = "Unknown Error";
        if (e && e.message) errorMsg = e.message;
        else if (typeof e === 'string') errorMsg = e;
        else errorMsg = JSON.stringify(e);
        log("❌ Error: " + errorMsg); 
        await app.showAlert("Error: " + errorMsg);
    } finally {
        document.getElementById("workCaption").classList.add("hidden-control");
    }
}

async function processMappedDesignBatch(masterDocID, layerName, targetDesignName, rows, headers, outFolder, res, format, mode, db, shouldEmbed, useLZW, sameFB, isRaglan, onStep) {
    let exportCount = 0;
    
    await app.batchPlay([{ _obj: "select", _target: [{ _ref: "document", _id: masterDocID }] }], {});
    const layer = await findLayerRecursive(app.activeDocument, layerName);
    if (!layer || !layer.visible) { rows.forEach(() => onStep()); return 0; }

    await app.batchPlay([{ _obj: "select", _target: [{ _ref: "layer", _id: layer.id }] }], {});
    await app.batchPlay([{ _obj: "placedLayerEditContents", _options: { dialogOptions: "dontDisplay" } }], {});
    
    const soDoc = app.activeDocument;
    const docRes = soDoc.resolution;
    const initialState = soDoc.activeHistoryState;

    let targetNum = null;
    let hasMatchingLayer = false;
    if (targetDesignName !== "Single_Design") {
        const designLayersToToggle = [];
        let targetNumMatch = targetDesignName.match(/\d+/);
        targetNum = targetNumMatch ? parseInt(targetNumMatch[0], 10) : null;

        for (let i = 0; i < soDoc.layers.length; i++) {
            const l = soDoc.layers[i];
            if (!l.name.toLowerCase().includes("background") && !l.name.toLowerCase().includes("bg") && !l.name.toLowerCase().includes("color fill") && l.kind !== "text" && l.kind !== "solidColorLayer") {
                designLayersToToggle.push(l);
                let dlNumMatch = l.name.match(/\d+/);
                let dlNum = dlNumMatch ? parseInt(dlNumMatch[0], 10) : null;
                if (targetNum !== null && dlNum !== null && targetNum === dlNum) {
                    hasMatchingLayer = true;
                } else if (l.name === targetDesignName) {
                    hasMatchingLayer = true;
                }
            }
        }

        if (hasMatchingLayer) {
            for (let dl of designLayersToToggle) {
                let dlNumMatch = dl.name.match(/\d+/);
                let dlNum = dlNumMatch ? parseInt(dlNumMatch[0], 10) : null;
                if (targetNum !== null && dlNum !== null && targetNum === dlNum) {
                    dl.visible = true;
                } else {
                    dl.visible = (dl.name === targetDesignName);
                }
            }
        }
    }

    try {
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            await app.batchPlay([{ _obj: "select", _target: [{ _ref: "historyState", _id: initialState.id }] }], {});

            if (targetDesignName !== "Single_Design" && hasMatchingLayer) {
                for (let j = 0; j < soDoc.layers.length; j++) {
                    const dl = soDoc.layers[j];
                    if (!dl.name.toLowerCase().includes("background") && !dl.name.toLowerCase().includes("bg") && !dl.name.toLowerCase().includes("color fill") && dl.kind !== "text" && dl.kind !== "solidColorLayer") {
                        let dlNumMatch = dl.name.match(/\d+/);
                        let dlNum = dlNumMatch ? parseInt(dlNumMatch[0], 10) : null;
                        if (targetNum !== null && dlNum !== null && targetNum === dlNum) {
                            dl.visible = true;
                        } else {
                            dl.visible = (dl.name === targetDesignName);
                        }
                    }
                }
            }

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
            
            if (!db[activeSize]) {
                log(`⚠️ Warning: Size [${activeSize}] missing in Size Editor Database. Skipping row.`);
                onStep(); 
                continue;
            }

            let finalName = "", w=0, h=0;

            if (mode === "FRONT" || (mode === "BACK" && sameFB)) {
                finalName = `${activeSize} = ${qty} ${mode === "FRONT" ? "F" : "B"}`;
                let sideDB = mode === "FRONT" ? db[activeSize].front : db[activeSize].back;
                if(db[activeSize] && sideDB) { w = sideDB.w; h = sideDB.h; }
                await updateText(soDoc, "SIZE", activeSize);
                await updateText(soDoc, "quantity", qty);
            } 
            else if (mode === "BACK") {
                finalName = `${row[0]} B`;
                if(db[activeSize] && db[activeSize].back) { w=db[activeSize].back.w; h=db[activeSize].back.h; }
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
                if(db[activeSize] && db[activeSize].nn) { w=db[activeSize].nn.w; h=db[activeSize].nn.h; } else { w=10; h=10; }
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
                
                if (isRaglan) suf = suf.replace("HSL", "Raglan HSL").replace("FSL", "Raglan FSL");
                
                finalName = `${activeSize} = ${qty}${suf}`;
                
                if (isRaglan) {
                    w = mode.includes("HALF") ? (db[activeSize].rHalf ? db[activeSize].rHalf.w : 11) : (db[activeSize].rFull ? db[activeSize].rFull.w : 11);
                    h = mode.includes("HALF") ? (db[activeSize].rHalf ? db[activeSize].rHalf.h : 9)  : (db[activeSize].rFull ? db[activeSize].rFull.h : 17);
                } else {
                    w = mode.includes("HALF") ? (db[activeSize].half ? db[activeSize].half.w : 11) : (db[activeSize].full ? db[activeSize].full.w : 11);
                    h = mode.includes("HALF") ? (db[activeSize].half ? db[activeSize].half.h : 11) : (db[activeSize].full ? db[activeSize].full.h : 11);
                }
                
                await updateText(soDoc, "SIZE", activeSize);
                await updateText(soDoc, "quantity", qty);
            }

            if (w > 0 && h > 0) {
                await app.batchPlay([{ _obj: "flattenImage" }], {});
                await app.batchPlay([{ _obj: "imageSize", width: { _unit: "pixelsUnit", _value: w * res }, height: { _unit: "pixelsUnit", _value: h * res }, resolution: { _unit: "densityUnit", _value: res }, scaleStyles: false, constrainProportions: false }], {});
                
                if (mode === "NAMENUM") {
                     await app.batchPlay([{ _obj: "trim", trimBasedOn: { _enum: "trimBasedOn", _value: "topLeftPixelColor" }, top: true, bottom: true, left: true, right: true }], {});
                }

                const cleanFN = finalName.replace(/[\/\\:*?"<>|]/g, "_");
                const saveFile = await outFolder.createFile(cleanFN + "." + format, { overwrite: true });
                const saveToken = await fs.createSessionToken(saveFile);
                
                let saveCmd = { _obj: "save", in: { _path: saveToken, _kind: "local" }, saveStage: { _enum: "saveStageType", _value: "saveBegin" }, embedProfiles: shouldEmbed, copy: true };
                if(format === "jpg") { saveCmd.as = { _obj: "JPEG", extendedQuality: 12 }; } 
                else if (format === "png") { saveCmd.as = { _obj: "PNGFormat", method: { _enum: "PNGMethod", _value: "quick" } }; } 
                else { saveCmd.as = { _obj: "TIFF", imageCompression: useLZW ? { _enum: "encoding", _value: "LZW" } : { _enum: "encoding", _value: "none" } }; }
                
                await app.batchPlay([saveCmd], {});
                exportedDimensions[normalizePath(saveFile.nativePath)] = { w, h, fileEntry: saveFile };
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
        log("Err in batch: " + (e.message || e));
        if (app.activeDocument && app.activeDocument.id !== masterDocID) await app.batchPlay([{ _obj: "close", saving: { _enum: "yesNo", _value: "no" } }], {}); 
    }
    
    return exportCount;
}

async function generateDesignMockups(masterDocID, designName, designFolder, csvFileName) {
    await app.batchPlay([{ _obj: "select", _target: [{ _ref: "document", _id: masterDocID }] }], {});
    
    try {
        const frontLayer = await findLayerRecursive(app.activeDocument, "Front");
        if(frontLayer) {
            await app.batchPlay([{ _obj: "select", _target: [{ _ref: "layer", _id: frontLayer.id }] }], {});
            await app.batchPlay([{ _obj: "placedLayerEditContents" }], {});
            
            if (designName !== "Single_Design") {
                const soDoc = app.activeDocument;
                let targetNumMatch = designName.match(/\d+/);
                let targetNum = targetNumMatch ? parseInt(targetNumMatch[0], 10) : null;
                
                for (let i = 0; i < soDoc.layers.length; i++) {
                    const dl = soDoc.layers[i];
                    if (!dl.name.toLowerCase().includes("background") && !dl.name.toLowerCase().includes("bg") && !dl.name.toLowerCase().includes("color fill") && dl.kind !== "text" && dl.kind !== "solidColorLayer") {
                        let dlNumMatch = dl.name.match(/\d+/);
                        let dlNum = dlNumMatch ? parseInt(dlNumMatch[0], 10) : null;
                        if (targetNum !== null && dlNum !== null && targetNum === dlNum) {
                            dl.visible = true;
                        } else {
                            dl.visible = (dl.name === designName);
                        }
                    }
                }
            }
            await app.batchPlay([{ _obj: "close", saving: { _enum: "yesNo", _value: "yes" } }], {}); 
        }
    } catch(e) { log("Failed to set Front mockup design"); }

    await app.batchPlay([{ _obj: "select", _target: [{ _ref: "document", _id: masterDocID }] }], {});

    const csvNameClean = csvFileName.replace(/\.[^/.]+$/, "");
    const mockupFolder = await ensureFolder(designFolder, "Mockups");
    
    const bgGroup = await findLayerRecursive(app.activeDocument, "mockup bg");
    const fullSleeveLayer = await findLayerRecursive(app.activeDocument, "FULL SLEEVE");

    const mockupPasses = [
        { suffix: "Half", setFullSleeveVisible: false },
        { suffix: "Full", setFullSleeveVisible: true }
    ];

    for (const pass of mockupPasses) {
        if (fullSleeveLayer) { fullSleeveLayer.visible = pass.setFullSleeveVisible; } 
        else if (pass.setFullSleeveVisible === true) { continue; }

        if (bgGroup && bgGroup.layers && bgGroup.layers.length > 0) {
            bgGroup.visible = true; 
            
            for (let b = 0; b < bgGroup.layers.length; b++) {
                const bgLayer = bgGroup.layers[b];
                for (let s = 0; s < bgGroup.layers.length; s++) { bgGroup.layers[s].visible = (bgGroup.layers[s].id === bgLayer.id); }
                
                const bgSuffix = bgLayer.name.trim().replace(/[\/\\:*?"<>|]/g, "_");
                const fName = `${csvNameClean} ${pass.suffix} - ${bgSuffix}.jpg`;
                
                const saveFile = await mockupFolder.createFile(fName, { overwrite: true });
                const saveToken = await fs.createSessionToken(saveFile);
                await app.batchPlay([{ _obj: "save", as: { _obj: "JPEG", extendedQuality: 10, matteColor: { _enum: "matteColor", _value: "none" } }, in: { _path: saveToken, _kind: "local" }, copy: true }], {});
            }
            
            bgGroup.visible = false; 
            const pngName = `${csvNameClean} ${pass.suffix} NoBG.png`;
            const pngFile = await mockupFolder.createFile(pngName, { overwrite: true });
            const pngToken = await fs.createSessionToken(pngFile);
            await app.batchPlay([{ _obj: "save", as: { _obj: "PNGFormat", method: { _enum: "PNGMethod", _value: "quick" } }, in: { _path: pngToken, _kind: "local" }, copy: true }], {});
            bgGroup.visible = true; 
        } else {
            const mockupFileName = `${csvNameClean} ${pass.suffix} mockup.jpg`.replace(/[\/\\:*?"<>|]/g, "_");
            const saveFile = await mockupFolder.createFile(mockupFileName, { overwrite: true });
            const saveToken = await fs.createSessionToken(saveFile);
            await app.batchPlay([{ _obj: "save", as: { _obj: "JPEG", extendedQuality: 10, matteColor: { _enum: "matteColor", _value: "none" } }, in: { _path: saveToken, _kind: "local" }, copy: true }], {});
        }
    }
}

async function updateLayerFont(doc, layerName, fontPostScriptName) {
    try { const layer = await findLayerRecursive(doc, layerName); if (layer && layer.kind === "text") { layer.textItem.font = fontPostScriptName; } } catch (e) {}
}

async function compressLayerWidth(doc, layerName, maxInches, docRes) {
    const layer = await findLayerRecursive(doc, layerName);
    if (!layer) return;
    await app.batchPlay([{_obj: "select", _target: [{_ref: "layer", _id: layer.id}]}], {});
    const result = await app.batchPlay([{ _obj: "get", _target: [{ _ref: "layer", _id: layer.id }], _property: "bounds" }], { synchronousExecution: true });
    if (!result[0] || !result[0].bounds) return;

    const widthPx = result[0].bounds.right._value - result[0].bounds.left._value;
    const currentWidthInches = widthPx / docRes;

    if (currentWidthInches > maxInches) {
        const pct = ((maxInches / currentWidthInches) * 100);
        await app.batchPlay([{ _obj: "transform", _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }], width: { _unit: "percentUnit", _value: pct }, height: { _unit: "percentUnit", _value: 100 }, linked: false, freeTransformCenterState: { _enum: "quadCenterState", _value: "QCSAverage" } }], {});
    }
}

async function findLayerRecursive(doc, name) {
    const search = name.toLowerCase();
    const traverse = (layers) => {
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            if (layer.name.toLowerCase() === search) return layer;
            if (layer.layers && layer.layers.length > 0) {
                const found = traverse(layer.layers);
                if (found) return found;
            }
        }
        return null;
    };
    return traverse(doc.layers);
}

async function updateText(doc, name, text) { try { const layer = await findLayerRecursive(doc, name); if (layer && layer.kind === "text") layer.textItem.contents = (text && text.trim() !== "") ? text : " "; } catch(e) {} }
function getVal(row, headers, key) { const idx = headers.indexOf(key); return (idx > -1 && row[idx]) ? row[idx].trim() : null; }
async function ensureFolder(root, name) { try { const f = await root.getEntry(name); if(f.isFolder) return f; } catch(e) {} return await root.createFolder(name); }
async function mergeHalfSleevesBatch(sleeveFolder, rows, headers, res, format, isRaglan) {
    const padInches = 0.2;
    const paddingPx = Math.round(padInches * res);
    
    const firstRowIsHeader = rows[0] && rows[0].some(val => typeof val === 'string' && val.toLowerCase().trim() === 'front size');
    const startIndex = firstRowIsHeader ? 1 : 0;

    for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || row[0] === "") continue;

        const activeSize = getVal(row, headers, "front size");
        const qty = getVal(row, headers, "half sleeve") || "0";

        if (!activeSize || parseInt(qty) <= 0 || isNaN(parseInt(qty))) continue;

        // Suffixes
        let sufL = isRaglan ? " Raglan HSL L" : " HSL L";
        let sufR = isRaglan ? " Raglan HSL R" : " HSL R";
        let sufMerged = isRaglan ? " Raglan HSL" : " HSL";

        // Filenames
        const nameL = `${activeSize} = ${qty}${sufL}`.replace(/[\/\\:*?"<>|]/g, "_") + "." + format;
        const nameR = `${activeSize} = ${qty}${sufR}`.replace(/[\/\\:*?"<>|]/g, "_") + "." + format;
        const nameMerged = `${activeSize} = ${qty}${sufMerged}`.replace(/[\/\\:*?"<>|]/g, "_") + "." + format;

        try {
            const pathL = sleeveFolder.nativePath + "/" + nameL;
            const pathR = sleeveFolder.nativePath + "/" + nameR;
            
            let fileL = exportedDimensions[normalizePath(pathL)] ? exportedDimensions[normalizePath(pathL)].fileEntry : null;
            let fileR = exportedDimensions[normalizePath(pathR)] ? exportedDimensions[normalizePath(pathR)].fileEntry : null;
            
            if (!fileL) { try { fileL = await sleeveFolder.getEntry(nameL); } catch(e){} }
            if (!fileR) { try { fileR = await sleeveFolder.getEntry(nameR); } catch(e){} }

            if (fileL && fileR) {
                log(`Merging ${nameL} and ${nameR}...`);
                
                // Open Left sleeve document
                await app.open(fileL);
                const docL = app.activeDocument;
                const docL_id = docL.id;
                const heightL = typeof docL.height === "object" ? docL.height.value : docL.height;
                const widthL = typeof docL.width === "object" ? docL.width.value : docL.width;

                // Open Right sleeve document
                await app.open(fileR);
                const docR = app.activeDocument;
                const docR_id = docR.id;
                const heightR = typeof docR.height === "object" ? docR.height.value : docR.height;

                // Make sure docR is active
                app.activeDocument = docR;

                // Convert background layer to normal layer if it is background
                const rightActiveLayer = docR.activeLayer;
                if (rightActiveLayer && rightActiveLayer.isBackgroundLayer) {
                    rightActiveLayer.isBackgroundLayer = false;
                }

                // Duplicate active layer of docR to docL
                await app.batchPlay([
                    {
                        _obj: "duplicate",
                        _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
                        to: { _ref: "document", _id: docL_id }
                    }
                ], {});

                // Close Right document without saving
                await docR.closeWithoutSaving();

                // Make Left document active
                app.activeDocument = docL;

                // Resize Left document canvas downwards
                const newHeight = heightL + heightR + paddingPx;
                await docL.resizeCanvas(widthL, newHeight, constants.AnchorPosition.TOPCENTER);

                // Offset the active layer (which is the duplicated Right sleeve layer) downwards
                await app.batchPlay([
                    {
                        _obj: "offset",
                        _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
                        horizontal: { _unit: "pixelsUnit", _value: 0 },
                        vertical: { _unit: "pixelsUnit", _value: heightL + paddingPx }
                    }
                ], {});

                // Create a solid white background layer at the bottom to fill any transparent/resized space
                try {
                    const whiteLayer = await docL.createLayer({ name: "Auto Nesting White Background" });
                    const bottomLayer = docL.layers[docL.layers.length - 1];
                    await whiteLayer.move(bottomLayer, "placeAfter");
                    docL.activeLayer = whiteLayer;
                    await app.batchPlay([
                        {
                            _obj: "fill",
                            using: { _enum: "fillContents", _value: "whiteColor" },
                            mode: { _enum: "blendMode", _value: "normal" },
                            opacity: { _unit: "percentUnit", _value: 100 },
                            _isCommand: true
                        }
                    ], {});
                } catch(bgErr) {
                    log(`Warning: Failed to create white background layer: ${bgErr.message}`);
                }

                // Flatten image
                await app.batchPlay([{ _obj: "flattenImage" }], {});

                // Save merged document
                const mergedFile = await sleeveFolder.createFile(nameMerged, { overwrite: true });
                const saveToken = await fs.createSessionToken(mergedFile);

                let saveCmd = {
                    _obj: "save",
                    in: { _path: saveToken, _kind: "local" },
                    saveStage: { _enum: "saveStageType", _value: "saveBegin" },
                    copy: true
                };

                const shouldEmbed = document.getElementById("chkEmbedProfile").checked;
                const useLZW = document.getElementById("chkLZW").checked;
                saveCmd.embedProfiles = shouldEmbed;

                if (format === "jpg") {
                    saveCmd.as = { _obj: "JPEG", extendedQuality: 12 };
                } else if (format === "png") {
                    saveCmd.as = { _obj: "PNGFormat", method: { _enum: "PNGMethod", _value: "quick" } };
                } else {
                    let comp = { _enum: "encoding", _value: "none" };
                    if (useLZW) { comp = { _enum: "encoding", _value: "LZW" }; }
                    saveCmd.as = { _obj: "TIFF", imageCompression: comp };
                }

                await app.batchPlay([saveCmd], {});

                let sleeveW = 11, sleeveH = 9;
                if (sizeDB[activeSize]) {
                    const side = isRaglan ? sizeDB[activeSize].rHalf : sizeDB[activeSize].half;
                    if (side) {
                        sleeveW = side.w;
                        sleeveH = side.h;
                    }
                }
                exportedDimensions[normalizePath(mergedFile.nativePath)] = { w: sleeveW, h: (sleeveH * 2) + padInches, fileEntry: mergedFile };

                // Close Left document without saving
                await docL.closeWithoutSaving();

                // Delete old left and right files
                await fileL.delete();
                await fileR.delete();
                delete exportedDimensions[normalizePath(fileL.nativePath)];
                delete exportedDimensions[normalizePath(fileR.nativePath)];
                log(`✅ Merged and saved ${nameMerged}`);
            }
        } catch (err) {
            log(`❌ Error merging ${nameL} & ${nameR}: ${err.message}`);
        }
    }
}

function parseCSV(text) { return text.split(/\r?\n/).map(line => line.split(",")); }

function loadSizeToUI() { 
    const d = sizeDB[document.getElementById("sizeSelector").value]; 
    if(!d) return; 
    document.getElementById("frontW").value=d.front.w; document.getElementById("frontH").value=d.front.h; 
    document.getElementById("backW").value=d.back.w; document.getElementById("backH").value=d.back.h; 
    document.getElementById("halfW").value=d.half.w; document.getElementById("halfH").value=d.half.h; 
    document.getElementById("fullW").value=d.full.w; document.getElementById("fullH").value=d.full.h;
    
    document.getElementById("rHalfW").value = d.rHalf ? d.rHalf.w : ""; 
    document.getElementById("rHalfH").value = d.rHalf ? d.rHalf.h : "";
    document.getElementById("rFullW").value = d.rFull ? d.rFull.w : "";
    document.getElementById("rFullH").value = d.rFull ? d.rFull.h : "";

    if(d.nn) { document.getElementById("nnW").value=d.nn.w; document.getElementById("nnH").value=d.nn.h; } else { document.getElementById("nnW").value=0; document.getElementById("nnH").value=0; }
}

async function saveSizeFromUI() { 
    const k = document.getElementById("sizeSelector").value; 
    sizeDB[k] = { 
        front: { w: parseFloat(document.getElementById("frontW").value), h: parseFloat(document.getElementById("frontH").value) }, 
        back: { w: parseFloat(document.getElementById("backW").value), h: parseFloat(document.getElementById("backH").value) }, 
        half: { w: parseFloat(document.getElementById("halfW").value), h: parseFloat(document.getElementById("halfH").value) }, 
        full: { w: parseFloat(document.getElementById("fullW").value), h: parseFloat(document.getElementById("fullH").value) },
        rHalf: { w: parseFloat(document.getElementById("rHalfW").value) || 0, h: parseFloat(document.getElementById("rHalfH").value) || 0 },
        rFull: { w: parseFloat(document.getElementById("rFullW").value) || 0, h: parseFloat(document.getElementById("rFullH").value) || 0 },
        nn: { w: parseFloat(document.getElementById("nnW").value), h: parseFloat(document.getElementById("nnH").value) } 
    }; 
    try { const f = await fs.getDataFolder(); const file = await f.createFile("autonest_sizes.json", {overwrite: true}); await file.write(JSON.stringify(sizeDB)); document.getElementById("saveMsg").innerText = "Saved!"; setTimeout(()=>document.getElementById("saveMsg").innerText="", 1500); } catch(e) { log("Save Err"); } 
}

async function loadDatabase() { 
    try { 
        const f = await fs.getDataFolder(); 
        let file;
        try {
            file = await f.getEntry("autonest_sizes.json");
        } catch(e) {
            try {
                file = await f.getEntry("fivenest_sizes.json");
            } catch(e2) {}
        }
        if(file) {
            const loaded = JSON.parse(await file.read()); 
            for(let k in loaded) {
                sizeDB[k] = { ...defaultSizes[k], ...loaded[k] };
            }
        } 
    } catch(e){} 
}

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
        tag.innerText = `ENTERPRISE V5.1 (COMPACT) | Usage: ${currentUsage} pcs`;
    }
}

function getJobActiveLayerModes(job, sameFB, doNameNum) {
    let hasFront = false;
    let hasBack = false;
    let hasSleeve = false;
    
    for (let i = 0; i < job.rows.length; i++) {
        const row = job.rows[i];
        if (!row || row.length === 0 || row[0] === "") continue;

        const fSize = getVal(row, job.headers, "front size");
        const fQtyVal = getVal(row, job.headers, "total qty") || getVal(row, job.headers, "total quantity");
        const fQty = (fQtyVal && !isNaN(parseInt(fQtyVal, 10))) ? parseInt(fQtyVal, 10) : 0;
        
        if (fSize && sizeDB[fSize] && fQty > 0) hasFront = true;

        if (sameFB) {
            if (fSize && sizeDB[fSize] && fQty > 0) hasBack = true;
        } else {
            const fname = row[0];
            const bSize = getVal(row, job.headers, "size") || (fname.match(/^(\d{2})/) ? fname.match(/^(\d{2})/)[1] : "");
            if (bSize && sizeDB[bSize]) hasBack = true;
        }

        const hQtyVal = getVal(row, job.headers, "half sleeve");
        const flQtyVal = getVal(row, job.headers, "full sleeve");
        const hQty = (hQtyVal && !isNaN(parseInt(hQtyVal, 10))) ? parseInt(hQtyVal, 10) : 0;
        const flQty = (flQtyVal && !isNaN(parseInt(flQtyVal, 10))) ? parseInt(flQtyVal, 10) : 0;
        
        if (fSize && sizeDB[fSize] && (hQty > 0 || flQty > 0)) hasSleeve = true;
    }

    const modes = [];
    if (hasFront) modes.push("FRONT");
    if (hasBack) modes.push("BACK");
    if (hasSleeve) {
        modes.push("HALF_L");
        modes.push("HALF_R");
        modes.push("FULL_L");
        modes.push("FULL_R");
    }
    if (doNameNum && hasBack) {
        modes.push("NAMENUM");
    }
    return {
        hasFront,
        hasBack,
        hasSleeve,
        hasNameNum: doNameNum && hasBack,
        modes
    };
}

async function createLabelTextLayer(doc, text, centerX, posY) {
    try {
        await app.batchPlay([
            {
                _obj: "make",
                _target: [{ _ref: "textLayer" }],
                using: {
                    _obj: "textLayer",
                    textKey: text,
                    warp: { _obj: "warp", warpStyle: { _enum: "warpStyle", _value: "warpNone" }, warpValue: 0, warpPerspective: 0, warpPerspectiveOther: 0, warpRotate: { _enum: "orientation", _value: "horizontal" } },
                    textStyleRange: [
                        {
                            _obj: "textStyleRange",
                            from: 0,
                            to: text.length,
                            textStyle: {
                                _obj: "textStyle",
                                fontPostScriptName: "ArialMT",
                                size: { _unit: "pointsUnit", _value: 9 },
                                impliedFontSize: { _unit: "pointsUnit", _value: 9 },
                                color: { _obj: "RGBColor", red: 50, grain: 50, blue: 50 },
                                align: { _enum: "textAlign", _value: "center" }
                            }
                        }
                    ]
                }
            }
        ], {});

        const activeLayer = doc.activeLayer;
        const result = await app.batchPlay([{ _obj: "get", _target: [{ _ref: "layer", _id: activeLayer.id }], _property: "bounds" }], { synchronousExecution: true });
        if (result[0] && result[0].bounds) {
            const b = result[0].bounds;
            const currentCenterX = (b.left._value + b.right._value) / 2;
            const currentTopY = b.top._value;

            const dx = centerX - currentCenterX;
            const dy = posY - currentTopY;

            await app.batchPlay([
                {
                    _obj: "move",
                    _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
                    to: {
                        _obj: "offset",
                        horizontal: { _unit: "pixelsUnit", _value: dx },
                        vertical: { _unit: "pixelsUnit", _value: dy }
                    }
                }
            ], {});
        }
    } catch (e) {
        log(`Warning: Failed to create text label "${text}" : ${e.message}`);
    }
}

async function generatePreviewPDF(mappedJobs, selectedFolder, customerName, orderNum) {
    log(`>>> Gathering files for consolidated PDF Preview...`);
    const filesToMerge = [];

    for (const job of mappedJobs) {
        const actualOrderCode = job.file.name.replace(/\.[^/.]+$/, "");
        const cleanDesignName = job.design.name === "Single_Design" 
            ? actualOrderCode.replace(/[\/\\:*?"<>|]/g, "_").trim() 
            : job.design.name.replace(/[\/\\:*?"<>|]/g, "_").trim();

        const jobFrontFiles = [];
        const jobBackFiles = [];
        const jobSleeveFiles = [];
        const jobNameNumFiles = [];

        try {
            const designFolder = await selectedFolder.getEntry(cleanDesignName);
            if (designFolder && designFolder.isFolder) {
                // Front
                try {
                    const subF = await designFolder.getEntry("Front");
                    if (subF && subF.isFolder) {
                        const entries = await subF.getEntries();
                        for (const entry of entries) {
                            if (entry.isFile && /\.(png|jpg|jpeg|tiff|tif)$/i.test(entry.name)) {
                                jobFrontFiles.push({ entry, folderName: "Front" });
                            }
                        }
                    }
                } catch(e){}

                // Back
                try {
                    const subB = await designFolder.getEntry("Back");
                    if (subB && subB.isFolder) {
                        const entries = await subB.getEntries();
                        for (const entry of entries) {
                            if (entry.isFile && /\.(png|jpg|jpeg|tiff|tif)$/i.test(entry.name)) {
                                jobBackFiles.push({ entry, folderName: "Back" });
                            }
                        }
                    }
                } catch(e){}

                // Sleeve
                try {
                    const subS = await designFolder.getEntry("Sleeve");
                    if (subS && subS.isFolder) {
                        const entries = await subS.getEntries();
                        for (const entry of entries) {
                            if (entry.isFile && /\.(png|jpg|jpeg|tiff|tif)$/i.test(entry.name)) {
                                jobSleeveFiles.push({ entry, folderName: "Sleeve" });
                            }
                        }
                    }
                } catch(e){}

                // Name_Number
                try {
                    const subN = await designFolder.getEntry("Name_Number");
                    if (subN && subN.isFolder) {
                        const entries = await subN.getEntries();
                        for (const entry of entries) {
                            if (entry.isFile && /\.(png|jpg|jpeg|tiff|tif)$/i.test(entry.name)) {
                                jobNameNumFiles.push({ entry, folderName: "Name_Number" });
                            }
                        }
                    }
                } catch(e){}
            }
        } catch(e){}

        // Sort alphabetically within each category for this job
        jobFrontFiles.sort((a, b) => a.entry.name.localeCompare(b.entry.name));
        jobBackFiles.sort((a, b) => a.entry.name.localeCompare(b.entry.name));
        jobSleeveFiles.sort((a, b) => a.entry.name.localeCompare(b.entry.name));
        jobNameNumFiles.sort((a, b) => a.entry.name.localeCompare(b.entry.name));

        // Combine for this job in requested order: Front -> Back -> Sleeve -> Name_Number
        filesToMerge.push(...jobFrontFiles, ...jobBackFiles, ...jobSleeveFiles, ...jobNameNumFiles);
    }

    if (filesToMerge.length === 0) {
        log("No exported images found for preview PDF.");
        return;
    }

    // Determine output filename
    let pdfBaseName = "Preview";
    if (mappedJobs.length === 1 && mappedJobs[0].file) {
        pdfBaseName = mappedJobs[0].file.name.replace(/\.[^/.]+$/, "");
    } else {
        const cleanCust = customerName.replace(/[\/\\:*?"<>|]/g, "_").trim() || "UnknownCustomer";
        const cleanOrder = orderNum.replace(/[\/\\:*?"<>|]/g, "_").trim() || "01";
        pdfBaseName = `${cleanCust} - ${cleanOrder}`;
    }
    const pdfFileName = `${pdfBaseName}_Preview.pdf`;

    const numItems = filesToMerge.length;
    log(`>>> Compiling PDF Preview (${numItems} images)...`);

    try {
        const imagePaths = [];
        const folderNames = [];
        const fileNames = [];
        const widths = [];
        const heights = [];

        for (const f of filesToMerge) {
            const path = f.entry.nativePath;
            imagePaths.push(path);
            folderNames.push(f.folderName);
            fileNames.push(f.entry.name.replace(/\.[^/.]+$/, ""));

            const dim = exportedDimensions[normalizePath(path)] || { w: 15, h: 21 }; // default fallback to standard front/back size
            widths.push(dim.w);
            heights.push(dim.h);
        }

        const pdfPath = selectedFolder.nativePath + "/" + pdfFileName;

        const payload = {
            imagePaths,
            folderNames,
            fileNames,
            pdfPath,
            widths,
            heights
        };

        const response = await fetch("http://localhost:9000/generate-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success) {
            log(`✅ Saved Merged PDF Preview: ${pdfFileName} in output folder.`);
        } else {
            log(`❌ Server Error: ${result.error}`);
            await app.showAlert(`PDF Generation failed: ${result.error}`);
        }
    } catch (err) {
        log(`❌ Error connecting to PDF generator service: ${err.message}`);
        log(`⚠️ Make sure you start the PDF server by running 'node pdf-generator-service/index.js' in the plugin folder!`);
        await app.showAlert("Failed to connect to local PDF Generator server.\n\nPlease start the server in your terminal:\nnode pdf-generator-service/index.js");
    }
}

async function createNewDoc(name, wInches, hInches, res) {
    const wPixels = Math.round(wInches * res);
    const hPixels = Math.round(hInches * res);
    try {
        const doc = await app.documents.add({
            width: wPixels,
            height: hPixels,
            resolution: res,
            name: name,
            fill: "white"
        });
        return doc;
    } catch (e) {
        await app.batchPlay([
            {
                _obj: "make",
                new: {
                    _class: "document",
                    name: name,
                    mode: { _enum: "colorMode", _value: "RGBColorMode" },
                    width: { _unit: "pixelsUnit", _value: wPixels },
                    height: { _unit: "pixelsUnit", _value: hPixels },
                    resolution: { _unit: "densityUnit", _value: res },
                    depth: 8,
                    fill: { _enum: "fillColor", _value: "white" }
                }
            }
        ], {});
        return app.activeDocument;
    }
}

async function assignColorProfile(docID, profileName) {
    try {
        await app.batchPlay([
            {
                _obj: "assignColorProfile",
                _target: [{ _ref: "document", _id: docID }],
                profile: profileName
            }
        ], {});
    } catch (e) {}
}

function packItems(items, rollW, rollH, itemGap) {
    const sheets = [];
    let currentSheet = { items: [], currentX: 0, currentY: 0, shelfH: 0 };
    sheets.push(currentSheet);

    for (const item of items) {
        let w = item.w;
        let h = item.h;
        let rotated = false;
        if (w > rollW && h <= rollW) {
            w = item.h;
            h = item.w;
            rotated = true;
        }

        if (currentSheet.currentX + w <= rollW) {
            if (currentSheet.currentY + h <= rollH) {
                currentSheet.items.push({
                    item,
                    x: currentSheet.currentX,
                    y: currentSheet.currentY,
                    w,
                    h,
                    rotated
                });
                currentSheet.currentX += w + itemGap;
                currentSheet.shelfH = Math.max(currentSheet.shelfH, h);
            } else {
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
        } else {
            const nextY = currentSheet.currentY + currentSheet.shelfH + itemGap;
            if (nextY + h <= rollH) {
                currentSheet.currentY = nextY;
                currentSheet.currentX = 0;
                currentSheet.shelfH = h;
                currentSheet.items.push({
                    item,
                    x: currentSheet.currentX,
                    y: currentSheet.currentY,
                    w,
                    h,
                    rotated
                });
                currentSheet.currentX += w + itemGap;
            } else {
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
    }
    return sheets;
}
function getCopyCountFromFilename(filename) {
    if (filename.indexOf('=') === -1) {
        return 1;
    }
    const parts = filename.split('=');
    if (parts.length < 2) return 1;
    const match = parts[1].match(/\d+/);
    if (match) {
        return parseInt(match[0], 10) || 1;
    }
    return 1;
}

async function runAutoNesting(outFolder, customerName, orderNum) {
    log("\n>>> INITIALIZING AUTO NESTING LAYOUT ENGINE...");
    const items = [];
    for (const [path, dim] of Object.entries(exportedDimensions)) {
        if (dim.fileEntry) {
            const copies = getCopyCountFromFilename(dim.fileEntry.name);
            for (let c = 0; c < copies; c++) {
                items.push({
                    path,
                    fileEntry: dim.fileEntry,
                    name: dim.fileEntry.name,
                    w: dim.w,
                    h: dim.h
                });
            }
        }
    }

    if (items.length === 0) {
        log("⚠️ No exported files found to nest.");
        return;
    }

    const rollW = parseFloat(document.getElementById("nestRollW").value) || 64;
    const rollH = parseFloat(document.getElementById("nestRollH").value) || 100;
    const itemGap = parseFloat(document.getElementById("nestItemGap").value) || 0.25;
    const nestFormat = (document.getElementById("nestFormat").value || "pdf").toLowerCase();
    const res = parseInt(document.getElementById("resolution").value) || 300;
    const shouldEmbed = document.getElementById("chkEmbedProfile").checked;
    const useLZW = document.getElementById("chkLZW").checked;

    log(`Nesting Settings: Roll Size ${rollW}" x ${rollH}", Item Gap ${itemGap}", Resolution ${res} DPI, Format ${nestFormat.toUpperCase()}`);

    items.sort((a, b) => b.h - a.h);
    const sheets = packItems(items, rollW, rollH, itemGap);
    log(`Nesting complete: Organized ${items.length} items onto ${sheets.length} roll document(s).`);

    try {
        const masterDoc = app.activeDocument;
        const masterDocID = masterDoc ? masterDoc.id : null;
        const masterProfile = masterDoc ? masterDoc.colorProfileName : null;

        for (let s = 0; s < sheets.length; s++) {
            const sheet = sheets[s];
            const sheetNum = s + 1;
            const docName = `${customerName}_${orderNum}_Nesting_${sheetNum}`;
            log(`>>> Compiling Nesting Sheet ${sheetNum}/${sheets.length} (${sheet.items.length} pieces)...`);

            const rollDoc = await createNewDoc(docName, rollW, rollH, res);
            const rollDocID = rollDoc.id;

            if (masterProfile) {
                await assignColorProfile(rollDocID, masterProfile);
            }

            for (let i = 0; i < sheet.items.length; i++) {
                const placed = sheet.items[i];
                log(`   - Placing [${placed.item.name}] at (${placed.x.toFixed(2)}", ${placed.y.toFixed(2)}")`);

                try {
                    await app.open(placed.item.fileEntry);

                    await app.batchPlay([
                        {
                            _obj: "duplicate",
                            _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
                            to: { _ref: "document", _id: rollDocID }
                        }
                    ], {});

                    await app.batchPlay([{ _obj: "close", saving: { _enum: "yesNo", _value: "no" } }], {});
                    await app.batchPlay([{ _obj: "select", _target: [{ _ref: "document", _id: rollDocID }] }], {});

                    const activeLayer = rollDoc.activeLayer;
                    if (activeLayer && activeLayer.isBackgroundLayer) {
                        activeLayer.isBackgroundLayer = false;
                    }

                    if (placed.rotated) {
                        await app.batchPlay([
                            {
                                _obj: "rotate",
                                _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
                                angle: { _unit: "angleUnit", _value: 90.0 }
                            }
                        ], {});
                    }

                    const boundsResult = await app.batchPlay([
                        {
                            _obj: "get",
                            _target: [{ _ref: "layer", _id: activeLayer.id }],
                            _property: "bounds"
                        }
                    ], { synchronousExecution: true });

                    if (boundsResult[0] && boundsResult[0].bounds) {
                        const bounds = boundsResult[0].bounds;
                        const currentLeft = bounds.left._value;
                        const currentTop = bounds.top._value;

                        const targetX_px = Math.round(placed.x * res);
                        const targetY_px = Math.round(placed.y * res);
                        const dx = targetX_px - currentLeft;
                        const dy = targetY_px - currentTop;

                        await app.batchPlay([
                            {
                                _obj: "offset",
                                _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
                                horizontal: { _unit: "pixelsUnit", _value: dx },
                                vertical: { _unit: "pixelsUnit", _value: dy }
                            }
                        ], {});
                    }

                    await app.batchPlay([{ _obj: "flattenImage" }], {});

                } catch (itemErr) {
                    log(`   ❌ Error placing item [${placed.item.name}]: ${itemErr.message}`);
                }
            }

            const saveFileName = `${docName}.${nestFormat}`;
            const saveFile = await outFolder.createFile(saveFileName, { overwrite: true });
            const saveToken = await fs.createSessionToken(saveFile);

            let saveCmd = {
                _obj: "save",
                in: { _path: saveToken, _kind: "local" },
                saveStage: { _enum: "saveStageType", _value: "saveBegin" },
                copy: true
            };

            if (nestFormat === "tiff") {
                saveCmd.as = {
                    _obj: "TIFF",
                    imageCompression: useLZW ? { _enum: "encoding", _value: "LZW" } : { _enum: "encoding", _value: "none" }
                };
            } else {
                saveCmd.as = {
                    _obj: "photoshopPDFFormat",
                    pdfPreset: "High Quality Print",
                    pdfPreserveEdit: false
                };
            }

            try {
                await app.batchPlay([saveCmd], {});
                log(`✅ Saved Nested Roll Sheet: ${saveFileName}`);
            } catch (saveErr) {
                log(`❌ Save failed for nesting sheet: ${saveErr.message || saveErr}`);
                if (nestFormat === "pdf") {
                    const fallbackName = `${docName}.tiff`;
                    log(`⚠️ Attempting fallback save as TIFF: ${fallbackName}`);
                    const fallbackFile = await outFolder.createFile(fallbackName, { overwrite: true });
                    const fallbackToken = await fs.createSessionToken(fallbackFile);
                    saveCmd.in = { _path: fallbackToken, _kind: "local" };
                    saveCmd.as = {
                        _obj: "TIFF",
                        imageCompression: { _enum: "encoding", _value: "none" }
                    };
                    await app.batchPlay([saveCmd], {});
                    log(`✅ Saved Fallback Nesting Sheet: ${fallbackName}`);
                }
            }

            await app.batchPlay([{ _obj: "close", saving: { _enum: "yesNo", _value: "no" } }], {});
        }

        if (masterDocID) {
            try {
                await app.batchPlay([{ _obj: "select", _target: [{ _ref: "document", _id: masterDocID }] }], {});
            } catch(e) {}
        }

    } catch (err) {
        log(`❌ Error compiling nesting layout: ${err.message}`);
    }
}

async function generateIllustratorNesting(outFolder, customerName, orderNum) {
    log("\n>>> DELEGATING NESTING TO ILLUSTRATOR BRIDGE...");
    
    const items = [];
    for (const [path, dim] of Object.entries(exportedDimensions)) {
        if (dim.fileEntry) {
            const copies = getCopyCountFromFilename(dim.fileEntry.name);
            for (let c = 0; c < copies; c++) {
                items.push({
                    path,
                    w: dim.w,
                    h: dim.h,
                    name: dim.fileEntry.name
                });
            }
        }
    }

    if (items.length === 0) {
        log("⚠️ No exported files found to nest.");
        return;
    }

    const rollW = parseFloat(document.getElementById("nestRollW").value) || 64;
    const rollH = parseFloat(document.getElementById("nestRollH").value) || 100;
    const itemGap = parseFloat(document.getElementById("nestItemGap").value) || 0.25;
    const nestFormat = (document.getElementById("nestFormat").value || "pdf").toLowerCase();
    const resolution = parseInt(document.getElementById("resolution").value) || 300;
    const tightestFit = document.getElementById("chkTightestFit") ? document.getElementById("chkTightestFit").checked : false;
    const rotateToFit = document.getElementById("chkRotateToFit") ? document.getElementById("chkRotateToFit").checked : false;

    const payload = {
        items,
        rollW,
        rollH,
        itemGap,
        format: nestFormat,
        customerName,
        orderNum,
        outputFolder: outFolder.nativePath,
        resolution,
        tightestFit,
        rotateToFit
    };

    try {
        const response = await fetch("http://localhost:9000/nest-illustrator", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success) {
            log(`✅ Saved Illustrator Nested Layout (${nestFormat.toUpperCase()}) in output folder.`);
        } else {
            log(`❌ Illustrator Nesting Error: ${result.error}`);
            await app.showAlert(`Illustrator Nesting failed: ${result.error}`);
        }
    } catch (err) {
        log(`❌ Error connecting to nesting service: ${err.message}`);
        log(`⚠️ Make sure you start the background server by running 'node pdf-generator-service/index.js' in the plugin folder!`);
        await app.showAlert("Failed to connect to local Nesting server.\n\nPlease start the server in your terminal:\nnode pdf-generator-service/index.js");
    }
}

async function generateAutoNesting(outFolder, customerName, orderNum) {
    log("\n>>> DELEGATING NESTING TO AUTO NEST ENGINE...");
    
    const items = [];
    for (const [path, dim] of Object.entries(exportedDimensions)) {
        if (dim.fileEntry) {
            const copies = getCopyCountFromFilename(dim.fileEntry.name);
            for (let c = 0; c < copies; c++) {
                items.push({
                    path,
                    w: dim.w,
                    h: dim.h,
                    name: dim.fileEntry.name
                });
            }
        }
    }

    if (items.length === 0) {
        log("⚠️ No exported files found to nest.");
        return;
    }

    const rollW = parseFloat(document.getElementById("nestRollW").value) || 64;
    const rollH = parseFloat(document.getElementById("nestRollH").value) || 100;
    const itemGap = parseFloat(document.getElementById("nestItemGap").value) || 0.25;
    const tightestFit = document.getElementById("chkTightestFit") ? document.getElementById("chkTightestFit").checked : false;
    const rotateToFit = document.getElementById("chkRotateToFit") ? document.getElementById("chkRotateToFit").checked : false;

    const payload = {
        items,
        rollW,
        rollH,
        itemGap,
        tightestFit,
        rotateToFit,
        customerName,
        orderNum,
        outputFolder: outFolder.nativePath
    };

    try {
        const response = await fetch("http://localhost:9000/nest-auto", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success) {
            log(`✅ Saved Auto Nested PDF Layout in output folder.`);
        } else {
            log(`❌ Auto Nesting Error: ${result.error}`);
            await app.showAlert(`Auto Nesting failed: ${result.error}`);
        }
    } catch (err) {
        log(`❌ Error connecting to nesting service: ${err.message}`);
        log(`⚠️ Make sure you start the background server by running 'node pdf-generator-service/index.js' in the plugin folder!`);
        await app.showAlert("Failed to connect to local Nesting server.\n\nPlease start the server in your terminal:\nnode pdf-generator-service/index.js");
    }
}