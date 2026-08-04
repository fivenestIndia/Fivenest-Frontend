const ps = require("photoshop");
const { app, core, constants } = ps;
const fs = require("uxp").storage.localFileSystem;
const shell = require("uxp").shell; 

// --- 🔥 STRICT VERSIONING & SECURITY 🔥 ---
const PLUGIN_VERSION = "premium_v1.0"; 
const PLUGIN_ID = "4355a359";
const AUTH_SERVER_URL = "https://fivenest-backend.onrender.com/api/license/verify";
const GRACE_PERIOD_DAYS = 3; 

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
let selectedCSV = null;
let selectedFolder = null;
let startTime = 0;
let isSystemReady = false; 
const PRODUCTION_LIMIT = 10000;

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
    
    const tabs = ["Run", "Edit", "Manual", "Help"];
    function switchTab(target) {
        tabs.forEach(t => {
            const elTab = document.getElementById("tab" + t);
            const elPanel = document.getElementById("panel" + t);
            if (elTab) elTab.classList.remove("active");
            if (elPanel) elPanel.classList.remove("active");
        });
        const targetTab = document.getElementById("tab" + target);
        const targetPanel = document.getElementById("panel" + target);
        if (targetTab) targetTab.classList.add("active");
        if (targetPanel) targetPanel.classList.add("active");
    }
    document.getElementById("tabRun").onclick = () => switchTab("Run");
    document.getElementById("tabEdit").onclick = () => switchTab("Edit");
    document.getElementById("tabManual").onclick = () => switchTab("Manual");
    document.getElementById("tabHelp").onclick = () => switchTab("Help");

    // --- Inject Manual Qty Grid ---
    const qtyGrid = document.getElementById("qtyGrid");
    if(qtyGrid) {
        const sizesToRender = ["18","20","22","24","26","28","30","32","34","36","38","40","42","44","46","48","50","52","54","56","58","60"];
        sizesToRender.forEach(sz => {
            let row = document.createElement("div");
            row.style.display = "flex"; row.style.alignItems = "center"; row.style.marginBottom = "3px";
            
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

    // --- Toggle Manual Mode Listener ---
    document.getElementById("chkManualMode").addEventListener("change", (e) => {
        const tabManual = document.getElementById("tabManual");
        const csvBtnContainer = document.getElementById("csvInputContainer");
        const chkSameFB = document.getElementById("chkSameFrontBack");
        
        if (e.target.checked) {
            tabManual.classList.remove("hidden-control");
            csvBtnContainer.classList.add("hidden-control");
            chkSameFB.checked = true;
            chkSameFB.disabled = true;

            selectedCSV = null;
            document.getElementById("lblCSV").innerText = "None";
            document.getElementById("lblCSV").style.color = "";
        } else {
            tabManual.classList.add("hidden-control");
            csvBtnContainer.classList.remove("hidden-control");
            chkSameFB.disabled = false;
            
            if(document.getElementById("panelManual").classList.contains("active")) switchTab("Run");
        }
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
    document.getElementById("btnImportData").addEventListener("click", importZipData);
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
            details: "When **Half-Sleeve Merge** is checked, the plugin exports Left and Right half sleeves as normal, then vertically merges them (Left on top, Right on bottom) with exactly **0.2 inches** of solid white padding. It saves the combined file and deletes the original two separate sleeves."
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
            title: "Save Default",
            keywords: ["save default", "default", "save def", "defaults"],
            summary: "Save Default remembers your current settings.",
            details: "Clicking **Save Default** saves your selected checkbox configurations, resolution, format, and compression settings to `fivenest_config.json`. These settings will automatically load next time you open Photoshop."
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
            details: "Usage limits are calculated *only* when a BACK layer is exported:\n- **Premium Plan**: 10,000 pcs limit.\n- New installations get a **7-Day Free Trial** with full functionality before requiring license activation."
        }
    ];

    async function openWhatsAppSupport() {
        const email = localStorage.getItem("fivenest_license_email") || "Unregistered User";
        const clientName = document.getElementById("txtCustomerName") ? document.getElementById("txtCustomerName").value.trim() : "";
        const nameSection = clientName ? `${clientName} (${email})` : email;
        const rawMessage = `Hello Vilesh, I need assistance with FN Premium. (User: ${nameSection})`;
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
        const suggestionTitles = ["Blank Kit", "Half-Sleeve Merge", "Smart Mockup", "Quick Size Entry", "Limits & Trial", "How to Run"];
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
        appendMessage("Hi! I'm your FN Premium offline assistant. Ask me about any feature (e.g. Blank Kit, Half-Sleeve Merge, Quick Size Entry) or click a suggestion below!", "assistant");
    };

    // Initialize welcome
    appendMessage("Hi! I'm your FN Premium offline assistant. Ask me about any feature (e.g. Blank Kit, Half-Sleeve Merge, Quick Size Entry) or click a suggestion below!", "assistant");
    renderSuggestions();

    await checkLicenseSystem();
});

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
        nameNum: document.getElementById("chkNameNum").checked,
        raglan: document.getElementById("chkRaglan").checked,
        manualMode: document.getElementById("chkManualMode").checked,
        mergeHalfSleeves: document.getElementById("chkMergeHalfSleeves") ? document.getElementById("chkMergeHalfSleeves").checked : false,
        customerName: document.getElementById("txtCustomerName") ? document.getElementById("txtCustomerName").value : "",
        orderNum: document.getElementById("txtOrderNum") ? document.getElementById("txtOrderNum").value : ""
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
            if(config.raglan !== undefined) document.getElementById("chkRaglan").checked = config.raglan;
            if(config.mergeHalfSleeves !== undefined && document.getElementById("chkMergeHalfSleeves")) document.getElementById("chkMergeHalfSleeves").checked = config.mergeHalfSleeves;
            if(config.customerName !== undefined && document.getElementById("txtCustomerName")) document.getElementById("txtCustomerName").value = config.customerName;
            if(config.orderNum !== undefined && document.getElementById("txtOrderNum")) document.getElementById("txtOrderNum").value = config.orderNum;
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
        await checkLicenseSystem(); // Re-check
        return;
    }

    const currentUsage = parseInt(localStorage.getItem("fivenest_production_usage") || "0");
    if (PRODUCTION_LIMIT > 0 && currentUsage >= PRODUCTION_LIMIT) {
        await app.showAlert("Limit has been exceeded. You need to upgrade to the Enterprise plan.");
        log("❌ Run blocked: Production limit exceeded.");
        return;
    }

    const sameFB = document.getElementById("chkSameFrontBack").checked;
    const isManual = document.getElementById("chkManualMode").checked;
    const globalCustomerName = document.getElementById("txtCustomerName") ? document.getElementById("txtCustomerName").value.trim() : "";
    const globalOrderNum = document.getElementById("txtOrderNum") ? document.getElementById("txtOrderNum").value.trim() : "";

    if (!isManual) {
        if (!selectedCSV) { await app.showAlert("Please select a CSV File."); return; }
    }
    if (!selectedFolder) { await app.showAlert("Please select an Output Folder."); return; }
    
    const res = parseInt(document.getElementById("resolution").value);
    const format = document.getElementById("exportFormat").value.toLowerCase();
    const shouldEmbed = document.getElementById("chkEmbedProfile").checked;
    const useLZW = document.getElementById("chkLZW").checked;
    const doMockup = document.getElementById("chkMockup").checked;
    const doNameNum = document.getElementById("chkNameNum").checked; 
    const isRaglan = document.getElementById("chkRaglan").checked; 

    document.getElementById("workCaption").classList.remove("hidden-control");
    startTime = Date.now();

    try {
        let csvRows = [];
        let headers = [];
        let totalSteps = 0;
        let currentStep = 0;

        await core.executeAsModal(async () => {
            const masterDocID = app.activeDocument.id;
            
            if (isManual) {
                log(">>> Initializing Live Size Mode (CSV Bypassed)...");
                headers = ["front size", "total qty", "half sleeve", "full sleeve"];
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
                
                csvRows = [headers, ...dataRows];
                totalSteps += (dataRows.length * (doNameNum ? 7 : 6));
            } else {
                const csvText = await selectedCSV.read();
                csvRows = parseCSV(csvText);
                const dataRows = csvRows.slice(1).filter(r => r.length > 0 && r[0] !== "");
                if(dataRows.length === 0) throw new Error("Empty CSV or No Data");
                headers = csvRows[0].map(h => h.toLowerCase().trim());
            }

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
                throw new Error("No valid Front, Back, or Sleeve quantities found to process.");
            }

            const dataRows = csvRows.slice(1).filter(r => r.length > 0 && r[0] !== "");
            totalSteps = dataRows.length * layerModes.length;
            updateProgressUI(0, totalSteps);

            const stats = { Front: 0, Back: 0, Sleeves: 0, NameNum: 0 };
            let jobSleevesCount = 0;

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
                const count = await processLayerBatch(masterDocID, lm.name, csvRows, headers, outFolder, res, format, lm.mode, sizeDB, shouldEmbed, useLZW, sameFB, isRaglan, () => {
                    currentStep++;
                    updateProgressUI(currentStep, totalSteps);
                });
                if (lm.mode === "FRONT") stats.Front += count;
                else if (lm.mode === "BACK") stats.Back += count;
                else if (lm.mode === "NAMENUM") stats.NameNum += count;
                else {
                    stats.Sleeves += count;
                    jobSleevesCount += count;
                }
            }

            if (doMockup) {
                log(">>> Generating Mockups...");
                await app.batchPlay([{ _obj: "select", _target: [{ _ref: "document", _id: masterDocID }] }], {});
                
                const now = new Date();
                const dateStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}-${now.getMinutes().toString().padStart(2,'0')}`;
                const mockupFolder = await selectedFolder.createFolder(`Mockup ${dateStr}`);
                
                const csvNameClean = selectedCSV 
                    ? selectedCSV.name.replace(/\.[^/.]+$/, "") 
                    : (globalCustomerName ? `${globalCustomerName.replace(/[\/\\:*?"<>|]/g, "_")} - ${globalOrderNum}` : "ManualOrder");
                const bgGroup = await findLayerRecursive(app.activeDocument, "mockup bg");
                const fullSleeveLayer = await findLayerRecursive(app.activeDocument, "FULL SLEEVE");

                const mockupPasses = [
                    { suffix: "Half", setFullSleeveVisible: false },
                    { suffix: "Full", setFullSleeveVisible: true }
                ];

                for (const pass of mockupPasses) {
                    if (fullSleeveLayer) {
                        fullSleeveLayer.visible = pass.setFullSleeveVisible;
                    } else if (pass.setFullSleeveVisible === true) {
                        log(`⚠️ Skipped Full Sleeve: Layer not found.`);
                        continue; 
                    }

                    if (bgGroup && bgGroup.layers && bgGroup.layers.length > 0) {
                        bgGroup.visible = true; 

                        for (const bgLayer of bgGroup.layers) {
                            for (const sibling of bgGroup.layers) {
                                sibling.visible = (sibling.id === bgLayer.id);
                            }

                            const bgSuffix = bgLayer.name.trim().replace(/[\/\\:*?"<>|]/g, "_");
                            const fName = `${csvNameClean} ${pass.suffix} - ${bgSuffix}.jpg`;
                            
                            const saveFile = await mockupFolder.createFile(fName, { overwrite: true });
                            const saveToken = await fs.createSessionToken(saveFile);
                            
                            await app.batchPlay([{ 
                                _obj: "save", 
                                as: { _obj: "JPEG", extendedQuality: 10, matteColor: { _enum: "matteColor", _value: "none" } }, 
                                in: { _path: saveToken, _kind: "local" },
                                copy: true
                            }], {});
                        }

                        bgGroup.visible = false; 
                        
                        const pngName = `${csvNameClean} ${pass.suffix} NoBG.png`;
                        const pngFile = await mockupFolder.createFile(pngName, { overwrite: true });
                        const pngToken = await fs.createSessionToken(pngFile);

                        await app.batchPlay([{ 
                            _obj: "save", 
                            as: { _obj: "PNGFormat", method: { _enum: "PNGMethod", _value: "quick" } }, 
                            in: { _path: pngToken, _kind: "local" }, 
                            copy: true 
                        }], {});
                        
                        bgGroup.visible = true; 

                    } else {
                        const mockupFileName = `${csvNameClean} ${pass.suffix} mockup.jpg`.replace(/[\/\\:*?"<>|]/g, "_");
                        const saveFile = await mockupFolder.createFile(mockupFileName, { overwrite: true });
                        const saveToken = await fs.createSessionToken(saveFile);
                        await app.batchPlay([
                            { 
                                _obj: "save", 
                                as: { _obj: "JPEG", extendedQuality: 10, matteColor: { _enum: "matteColor", _value: "none" } }, 
                                in: { _path: saveToken, _kind: "local" },
                                copy: true
                            }
                        ], {});
                    }
                    log(`✅ Saved ${pass.suffix} Mockups.`);
                }
            }

            const chkMergeHalfSleeves = document.getElementById("chkMergeHalfSleeves") ? document.getElementById("chkMergeHalfSleeves").checked : false;
            if (chkMergeHalfSleeves && hasSleeve && jobSleevesCount > 0) {
                const sleeveFolder = await ensureFolder(selectedFolder, "Sleeve");
                log(">>> Merging Half Sleeves...");
                await mergeHalfSleevesBatch(sleeveFolder, csvRows, headers, res, format, isRaglan);
            }
            
            updateProgressUI(totalSteps, totalSteps);
            const totalTime = Math.round((Date.now() - startTime) / 1000);
            log(`--- SUMMARY ---`);
            log(`Time Taken: ${Math.floor(totalTime/60)}m ${totalTime%60}s`);
            log(`F: ${stats.Front} | B: ${stats.Back} | SL: ${stats.Sleeves} | NN: ${stats.NameNum}`);
            log("✅ JOB COMPLETE!");
            
            await app.showAlert("Automation Finished!");
            
        }, { commandName: "Relax. The Future of Textile Automation is Running. Powered by Fivenest.in" });
    } catch(e) { log("Error: " + e.message); }
    finally {
        document.getElementById("workCaption").classList.add("hidden-control");
    }
}

async function processLayerBatch(masterDocID, layerName, rows, headers, outFolder, res, format, mode, db, shouldEmbed, useLZW, sameFB, isRaglan, onStep) {
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

    const initialState = soDoc.activeHistoryState;

    try {
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if(!row || row.length === 0 || row[0] === "") { onStep(); continue; }

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
                if (isRaglan) suf = suf.replace("HSL", "Raglan HSL").replace("FSL", "Raglan FSL");
                finalName = `${activeSize} = ${qty}${suf}`;
                if (isRaglan) {
                    w = mode.includes("HALF") ? (db[activeSize].rHalf ? db[activeSize].rHalf.w : 11) : (db[activeSize].rFull ? db[activeSize].rFull.w : 11);
                    h = mode.includes("HALF") ? (db[activeSize].rHalf ? db[activeSize].rHalf.h : 9)  : (db[activeSize].rFull ? db[activeSize].rFull.h : 17);
                } else {
                    w = mode.includes("HALF") ? db[activeSize].half.w : db[activeSize].full.w;
                    h = mode.includes("HALF") ? db[activeSize].half.h : db[activeSize].full.h;
                }
                await updateText(soDoc, "SIZE", activeSize);
                await updateText(soDoc, "quantity", qty);
            }

            if (w > 0 && h > 0) {
                await app.batchPlay([{ _obj: "flattenImage" }], {});
                await app.batchPlay([{ _obj: "imageSize", width: { _unit: "pixelsUnit", _value: w * res }, height: { _unit: "pixelsUnit", _value: h * res }, resolution: { _unit: "densityUnit", _value: res }, scaleStyles: false, constrainProportions: false }], {});
                
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

async function updateLayerFont(doc, layerName, fontPostScriptName) {
    try {
        const layer = await findLayerRecursive(doc, layerName);
        if (layer && layer.kind === "text") { layer.textItem.font = fontPostScriptName; }
    } catch (e) { log(`Font warning: ${fontPostScriptName}`); }
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
        await app.batchPlay([{ 
            _obj: "transform", 
            _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }], 
            width: { _unit: "percentUnit", _value: pct }, 
            height: { _unit: "percentUnit", _value: 100 }, 
            linked: false, 
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
            // Check if L and R files exist
            const fileL = await sleeveFolder.getEntry(nameL);
            const fileR = await sleeveFolder.getEntry(nameR);

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

                // Close Left document without saving
                await docL.closeWithoutSaving();

                // Delete old left and right files
                await fileL.delete();
                await fileR.delete();
                log(`✅ Merged and saved ${nameMerged}`);
            }
        } catch (err) {
            log(`❌ Error merging ${nameL} & ${nameR}: ${err.message}`);
        }
    }
}

function parseCSV(text) { return text.split("\n").map(line => line.split(",")); }
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
        rHalf: { w: parseFloat(document.getElementById("rHalfW").value) || 0, h: parseFloat(document.getElementById("rHalfH").value) || 0 },
        rFull: { w: parseFloat(document.getElementById("rFullW").value) || 0, h: parseFloat(document.getElementById("rFullH").value) || 0 },
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
async function loadDatabase() { 
    try { 
        const f = await fs.getDataFolder(); 
        const file = await f.getEntry("fivenest_sizes.json"); 
        if(file) {
            const loaded = JSON.parse(await file.read()); 
            for(let k in loaded) {
                sizeDB[k] = { ...defaultSizes[k], ...loaded[k] };
            }
        } 
    } catch(e){} 
}

function updateUsageDisplay() {
    const currentUsage = parseInt(localStorage.getItem("fivenest_production_usage") || "0");
    const tag = document.getElementById("versionTag");
    if (tag) {
        tag.innerText = `PREMIUM V1.0 | Usage: ${currentUsage}/${PRODUCTION_LIMIT} pcs`;
    }
}

// --- ZIP IMPORT FEATURE ---
async function collapseGroupLayer(groupLayer) {
    try {
        await ps.action.batchPlay([
            {
                _obj: "set",
                _target: [{ _ref: "layer", _id: groupLayer.id }],
                to: {
                    _obj: "layer",
                    expanded: false
                }
            }
        ], {});
    } catch (e) {
        try {
            groupLayer.expanded = false;
        } catch (err) {}
    }
}

async function getArtboardBounds(layerId) {
    try {
        const result = await ps.action.batchPlay([
            {
                _obj: "get",
                _target: [
                    {
                        _ref: "property",
                        _property: "artboard"
                    },
                    {
                        _ref: "layer",
                        _id: layerId
                    }
                ]
            }
        ], {});
        const artboard = result[0]?.artboard;
        if (artboard && artboard.artboardRect) {
            const rect = artboard.artboardRect;
            return {
                left: Number(rect.left),
                top: Number(rect.top),
                right: Number(rect.right),
                bottom: Number(rect.bottom),
                width: Number(rect.right - rect.left),
                height: Number(rect.bottom - rect.top)
            };
        }
    } catch (e) {
        log(`Error getting artboard bounds for layer ${layerId}: ${e.message}`);
    }
    return null;
}

async function getArtboardContainer(doc) {
    for (const layer of doc.layers) {
        if (layer.kind === "group" || layer.layers) {
            const bounds = await getArtboardBounds(layer.id);
            if (bounds) {
                return layer;
            }
        }
    }
    return null;
}

async function fitLayerToCanvas(layer, doc) {
    let originalUnits = null;
    try {
        // Save original units
        const getUnits = await ps.action.batchPlay([
            {
                _obj: "get",
                _target: [
                    {
                        _ref: "property",
                        _property: "unitsPrefs"
                    },
                    {
                        _ref: "application",
                        _enum: "ordinal",
                        _value: "targetEnum"
                    }
                ]
            }
        ], {});
        originalUnits = getUnits[0]?.unitsPrefs?.rulerUnits?._value;
    } catch (e) {
        log(`Failed to get original units: ${e.message}`);
    }

    try {
        // Set units to pixels
        await ps.action.batchPlay([
            {
                _obj: "set",
                _target: [
                    {
                        _ref: "property",
                        _property: "unitsPrefs"
                    },
                    {
                        _ref: "application",
                        _enum: "ordinal",
                        _value: "targetEnum"
                    }
                ],
                to: {
                    _obj: "unitsPrefs",
                    rulerUnits: {
                        _enum: "rulerUnits",
                        _value: "rulerPixels"
                    }
                }
            }
        ], {});
    } catch (e) {
        log(`Failed to set units to pixels: ${e.message}`);
    }

    try {
        // Unlock layer if locked
        if (layer.locked) {
            layer.locked = false;
        }

        try {
            layer.blendMode = "normal";
        } catch(e) {}

        // Get Artboard bounds in the document
        let artboardBounds = null;
        for (const l of doc.layers) {
            if (l.kind === "group" || l.layers) {
                artboardBounds = await getArtboardBounds(l.id);
                if (artboardBounds) {
                    break;
                }
            }
        }

        const boundsBefore = layer.bounds;
        const currentLeft = Number(boundsBefore.left);
        const currentTop = Number(boundsBefore.top);

        let targetLeft = 0;
        let targetTop = 0;
        let targetW = doc.width;
        let targetH = doc.height;

        if (artboardBounds) {
            targetLeft = artboardBounds.left;
            targetTop = artboardBounds.top;
            targetW = artboardBounds.width;
            targetH = artboardBounds.height;
        }

        // Translate to top-left of target
        await layer.translate(targetLeft - currentLeft, targetTop - currentTop);

        // Get dimensions after translation
        const boundsAfter = layer.bounds;
        const layerW = Number(boundsAfter.right) - Number(boundsAfter.left);
        const layerH = Number(boundsAfter.bottom) - Number(boundsAfter.top);

        if (layerW > 0 && layerH > 0 && targetW > 0 && targetH > 0) {
            const scaleX = (targetW / layerW) * 100;
            const scaleY = (targetH / layerH) * 100;

            const constants = ps.constants;
            await layer.resize(scaleX, scaleY, constants.AnchorPosition.TOPLEFT);
        }
    } catch (err) {
        log(`Error fitting layer to canvas: ${err.message}`);
    } finally {
        // Restore original units
        if (originalUnits) {
            try {
                await ps.action.batchPlay([
                    {
                        _obj: "set",
                        _target: [
                            {
                                _ref: "property",
                                _property: "unitsPrefs"
                            },
                            {
                                _ref: "application",
                                _enum: "ordinal",
                                _value: "targetEnum"
                            }
                        ],
                        to: {
                            _obj: "unitsPrefs",
                            rulerUnits: {
                                _enum: "rulerUnits",
                                _value: originalUnits
                            }
                        }
                    }
                ], {});
            } catch (e) {
                log(`Failed to restore units: ${e.message}`);
            }
        }
    }
}

const ALLOWED_IMPORT_LAYERS = [
    "front",
    "back",
    "half left sl",
    "half right sl",
    "full right sl",
    "full left sl",
    "raglan half right sl",
    "raglan half left sl",
    "raglan full right sl",
    "raglan full left sl",
    "hand stripe",
    "sleeve stripe",
    "collar",
    "only name & number"
];

function isSleeveLayerName(layerName) {
    const lName = layerName.toLowerCase().trim();
    return (
        lName.includes("sleeve") || 
        lName.includes(" sl") || 
        lName.endsWith(" sl") ||
        lName === "half left sl" ||
        lName === "half right sl" ||
        lName === "full left sl" ||
        lName === "full right sl"
    );
}

function matchLayerToFilename(layerName, extractedFilenames) {
    const lName = layerName.toLowerCase().trim();
    const cleanL = lName.replace(/\s+/g, "");
    const containsAllClean = (cf, words) => words.every(w => cf.includes(w));
    
    // 1. Front
    if (cleanL === "front") {
        return extractedFilenames.find(f => {
            const cf = f.replace(/\s+/g, "");
            return cf === "front.jpg" || cf === "front.jpeg" || cf === "front.png" || cf === "front.tiff" || cf === "front.tif" || cf.startsWith("front_") || cf.startsWith("front-");
        });
    }
    
    // 2. Back
    if (cleanL === "back") {
        return extractedFilenames.find(f => {
            const cf = f.replace(/\s+/g, "");
            return cf === "back.jpg" || cf === "back.jpeg" || cf === "back.png" || cf === "back.tiff" || cf === "back.tif" || cf.startsWith("back_") || cf.startsWith("back-");
        });
    }
    
    // 3. Raglan Half Left SL
    if (cleanL === "raglanhalfleftsl") {
        return extractedFilenames.find(f => {
            const cf = f.replace(/\s+/g, "");
            return cf.includes("raglan") && (
                containsAllClean(cf, ["half", "left"]) || 
                containsAllClean(cf, ["left", "half"]) ||
                cf.includes("halfleftsl") || 
                cf.includes("lefthalfsl")
            );
        });
    }
    
    // 4. Raglan Half Right SL
    if (cleanL === "raglanhalfrightsl") {
        return extractedFilenames.find(f => {
            const cf = f.replace(/\s+/g, "");
            return cf.includes("raglan") && (
                containsAllClean(cf, ["half", "right"]) || 
                containsAllClean(cf, ["right", "half"]) ||
                cf.includes("halfrightsl") || 
                cf.includes("righthalfsl")
            );
        });
    }
    
    // 5. Raglan Full Left SL
    if (cleanL === "raglanfullleftsl") {
        return extractedFilenames.find(f => {
            const cf = f.replace(/\s+/g, "");
            return cf.includes("raglan") && (
                containsAllClean(cf, ["full", "left"]) || 
                containsAllClean(cf, ["left", "full"]) ||
                cf.includes("fullleftsl") || 
                cf.includes("leftfullsl")
            );
        });
    }
    
    // 6. Raglan Full Right SL
    if (cleanL === "raglanfullrightsl") {
        return extractedFilenames.find(f => {
            const cf = f.replace(/\s+/g, "");
            return cf.includes("raglan") && (
                containsAllClean(cf, ["full", "right"]) || 
                containsAllClean(cf, ["right", "full"]) ||
                cf.includes("fullrightsl") || 
                cf.includes("rightfullsl")
            );
        });
    }
    
    // 7. Half Left SL
    if (cleanL === "halfleftsl") {
        return extractedFilenames.find(f => {
            const cf = f.replace(/\s+/g, "");
            return !cf.includes("raglan") && (
                containsAllClean(cf, ["half", "left"]) || 
                containsAllClean(cf, ["left", "half"]) ||
                cf.includes("halfleftsl") || 
                cf.includes("lefthalfsl")
            );
        });
    }
    
    // 8. Half Right SL
    if (cleanL === "halfrightsl") {
        return extractedFilenames.find(f => {
            const cf = f.replace(/\s+/g, "");
            return !cf.includes("raglan") && (
                containsAllClean(cf, ["half", "right"]) || 
                containsAllClean(cf, ["right", "half"]) ||
                cf.includes("halfrightsl") || 
                cf.includes("righthalfsl")
            );
        });
    }
    
    // 9. Full Left SL
    if (cleanL === "fullleftsl") {
        return extractedFilenames.find(f => {
            const cf = f.replace(/\s+/g, "");
            return !cf.includes("raglan") && (
                containsAllClean(cf, ["full", "left"]) || 
                containsAllClean(cf, ["left", "full"]) ||
                cf.includes("fullleftsl") || 
                cf.includes("leftfullsl")
            );
        });
    }
    
    // 10. Full Right SL
    if (cleanL === "fullrightsl") {
        return extractedFilenames.find(f => {
            const cf = f.replace(/\s+/g, "");
            return !cf.includes("raglan") && (
                containsAllClean(cf, ["full", "right"]) || 
                containsAllClean(cf, ["right", "full"]) ||
                cf.includes("fullrightsl") || 
                cf.includes("rightfullsl")
            );
        });
    }
    
    // 11. hand stripe
    if (cleanL === "handstripe") {
        return extractedFilenames.find(f => {
            const cf = f.replace(/\s+/g, "");
            return cf.includes("handstripe") || cf.includes("sleevestripe") || cf.includes("sleevestrip");
        });
    }
    
    // 14. sleeve stripe
    if (cleanL === "sleevestripe") {
        return extractedFilenames.find(f => {
            const cf = f.replace(/\s+/g, "");
            return cf.includes("sleevestripe") || cf.includes("sleevestrip") || cf.includes("handstripe");
        });
    }
    
    // 12. collar
    if (cleanL === "collar") {
        return extractedFilenames.find(f => {
            const cf = f.replace(/\s+/g, "");
            return cf.includes("collar") && !cf.includes("mockup") && !cf.includes("template");
        });
    }
    
    // 13. Only Name & Number
    if (cleanL === "onlyname&number" || cleanL === "onlynameandnumber") {
        return extractedFilenames.find(f => {
            const cf = f.replace(/\s+/g, "");
            return cf.includes("name") && (cf.includes("number") || cf.includes("no") || cf.includes("num"));
        });
    }
    
    return null;
}

function getAllLayersRecursive(doc) {
    const list = [];
    const traverse = (layers) => {
        for (const layer of layers) {
            list.push(layer);
            if (layer.layers) {
                traverse(layer.layers);
            }
        }
    };
    traverse(doc.layers);
    return list;
}

async function importZipData() {
    log("Starting Zip Data Import...");
    let tempFiles = [];
    try {
        const file = await fs.getFileForOpening({ types: ["zip"] });
        if (!file) {
            log("No zip file selected.");
            return;
        }
        
        log(`Selected zip: ${file.name}`);
        
        const formats = require("uxp").storage.formats;
        const fileData = await file.read({ format: formats.binary });
        
        const zip = await JSZip.loadAsync(fileData);
        const tempFolder = await fs.getTemporaryFolder();
        
        const zipFiles = zip.filter((relativePath, f) => !f.dir);
        const extractedFiles = {};
        
        for (const zipFile of zipFiles) {
            const filename = zipFile.name;
            const lowerName = filename.toLowerCase();
            if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || lowerName.endsWith(".png") || lowerName.endsWith(".tiff") || lowerName.endsWith(".tif")) {
                const parts = filename.split("/");
                const basename = parts[parts.length - 1];
                if (basename) {
                    log(`Extracting: ${basename}`);
                    const arrayBuffer = await zipFile.async("arraybuffer");
                    const tempFile = await tempFolder.createFile(basename, { overwrite: true });
                    await tempFile.write(arrayBuffer, { format: formats.binary });
                    extractedFiles[basename.toLowerCase()] = tempFile;
                    tempFiles.push(tempFile);
                }
            }
        }
        
        if (Object.keys(extractedFiles).length === 0) {
            log("No image files found in the ZIP.");
            await app.showAlert("No pattern images (JPG, PNG, TIFF) found in the selected ZIP file.");
            return;
        }
        
        const masterDoc = app.activeDocument;
        if (!masterDoc) {
            await app.showAlert("Please open a PSD template first.");
            return;
        }
        
        const masterDocID = masterDoc.id;
        const allLayers = getAllLayersRecursive(masterDoc);
        const smartObjects = allLayers.filter(l => {
            const lName = l.name.toLowerCase().trim();
            return String(l.kind).toLowerCase() === "smartobject" && ALLOWED_IMPORT_LAYERS.includes(lName);
        });
        
        if (smartObjects.length === 0) {
            log("No matching Smart Object layers found in active document.");
            await app.showAlert("No matching Smart Object layers found in the active document.");
            return;
        }
        
        let replacedObjects = [];
        const processedIds = new Set();
        
        await core.executeAsModal(async () => {
            for (const layer of smartObjects) {
                if (processedIds.has(layer.id)) continue;
                processedIds.add(layer.id);
                
                const lName = layer.name;
                const matchedFilename = matchLayerToFilename(lName, Object.keys(extractedFiles));
                if (matchedFilename) {
                    const fileToImport = extractedFiles[matchedFilename];
                    log(`Importing ${matchedFilename} to layer "${lName}"...`);
                    
                    let soDoc = null;
                    try {
                        await app.batchPlay([{ _obj: "select", _target: [{ _ref: "layer", _id: layer.id }] }], {});
                        await app.batchPlay([{ _obj: "placedLayerEditContents", _options: { dialogOptions: "dontDisplay" } }], {});
                        soDoc = app.activeDocument;
                        
                        if (!soDoc || soDoc.id === masterDocID) {
                            throw new Error("Failed to open smart object or smart object is invalid.");
                        }
                        
                        const soLayers = getAllLayersRecursive(soDoc);
                        const childSmartObjects = soLayers.filter(l => String(l.kind).toLowerCase() === "smartobject");
                        
                        if (childSmartObjects.length > 0) {
                            const bottomChildSO = childSmartObjects[childSmartObjects.length - 1];
                            const fileToken = await fs.createSessionToken(fileToImport);
                            await app.batchPlay([{ _obj: "select", _target: [{ _ref: "layer", _id: bottomChildSO.id }] }], {});
                            await app.batchPlay([
                                {
                                    _obj: "placedLayerReplaceContents",
                                    null: {
                                        _path: fileToken,
                                        _kind: "local"
                                    }
                                }
                            ], {});
                            
                            // Fit replaced child smart object to canvas
                            await fitLayerToCanvas(bottomChildSO, soDoc);
                            
                            for (const childSO of childSmartObjects) {
                                try {
                                    if (childSO.id === bottomChildSO.id) {
                                        childSO.visible = true;
                                    } else {
                                        childSO.visible = false;
                                    }
                                } catch (visErr) {
                                    log(`Error setting visibility for child SO "${childSO.name}": ${visErr.message}`);
                                }
                            }
                        } else {
                            try {
                                const bg = soDoc.backgroundLayer;
                                if (bg) {
                                    bg.name = "Background Layer";
                                }
                            } catch (bgErr) {
                                try {
                                    await app.batchPlay([{
                                        _obj: "set",
                                        _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
                                        to: { _obj: "layer", name: "Layer 0" }
                                    }], {});
                                } catch(bgErr2) {}
                            }
                            
                            const imgDoc = await app.open(fileToImport);
                            await app.batchPlay([
                                {
                                    _obj: "duplicate",
                                    _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
                                    to: { _ref: "document", _id: soDoc.id },
                                    version: 5
                                }
                            ], {});
                            
                            if (app.activeDocument.id !== masterDocID && app.activeDocument.id !== soDoc.id) {
                                await app.batchPlay([{ _obj: "close", saving: { _enum: "yesNo", _value: "no" } }], {});
                            }
                            
                            let dupLayer = soDoc.activeLayers[0];
                            if (dupLayer) {
                                try {
                                    await app.batchPlay([{ _obj: "select", _target: [{ _ref: "layer", _id: dupLayer.id }] }], {});
                                    await app.batchPlay([{ _obj: "newPlacedLayer" }], {});
                                    dupLayer = soDoc.activeLayers[0];
                                } catch (soErr) {
                                    log(`Failed to convert layer to Smart Object: ${soErr.message}`);
                                }
                            }
                            if (dupLayer) {
                                const artboardContainer = await getArtboardContainer(soDoc);
                                const targetContainer = artboardContainer || soDoc;
                                
                                try {
                                    dupLayer.move(targetContainer, "placeAtEnd");
                                } catch (moveErr) {
                                    try {
                                        const layersList = targetContainer.layers;
                                        if (layersList && layersList.length > 0) {
                                            const lastLayer = layersList[layersList.length - 1];
                                            if (lastLayer && lastLayer.id !== dupLayer.id) {
                                                await ps.action.batchPlay([
                                                    {
                                                        _obj: "move",
                                                        _target: [{ _ref: "layer", _id: dupLayer.id }],
                                                        to: { _ref: "layer", _id: lastLayer.id },
                                                        insertionMode: { _enum: "insertMode", _value: "insertAfter" }
                                                    }
                                                ], {});
                                            }
                                        }
                                    } catch(moveErr2) {}
                                }
                                
                                // Fit duplicated layer to canvas
                                await fitLayerToCanvas(dupLayer, soDoc);
                            }
                        }
                        
                        await soDoc.save();
                        if (app.activeDocument.id !== masterDocID) {
                            await app.batchPlay([{ _obj: "close", saving: { _enum: "yesNo", _value: "no" } }], {});
                        }
                        
                        replacedObjects.push(lName);
                        log(`Successfully imported ${matchedFilename} to "${lName}"`);
                    } catch (err) {
                        log(`Error editing smart object layer "${lName}": ${err.message}`);
                        if (soDoc && app.activeDocument.id !== masterDocID) {
                            await app.batchPlay([{ _obj: "close", saving: { _enum: "yesNo", _value: "no" } }], {});
                        }
                    }
                }
            }
            
            // Collapse Mockup Data group if found
            try {
                const allLayersAfter = getAllLayersRecursive(masterDoc);
                const mockupDataGroup = allLayersAfter.find(l => l.name.toLowerCase().trim() === "mockup data");
                if (mockupDataGroup) {
                    await collapseGroupLayer(mockupDataGroup);
                }
            } catch (collapseErr) {
                log(`Error collapsing Mockup Data group: ${collapseErr.message}`);
            }
        }, { commandName: "Importing Zip Data" });
        
        if (replacedObjects.length > 0) {
            await app.showAlert(`Successfully replaced layers:\n- ${replacedObjects.join("\n- ")}`);
        } else {
            await app.showAlert("No matching layers were found to replace.");
        }
        
    } catch (e) {
        log(`Zip Import Error: ${e.message}`);
        await app.showAlert(`Error during import: ${e.message}`);
    } finally {
        for (const tempFile of tempFiles) {
            try {
                await tempFile.delete();
            } catch(e) {}
        }
    }
}