
function cleanCEPPath(url) {
    if (!url) return url;
    var clean = decodeURIComponent(url);
    if (clean.indexOf("file://") === 0) {
        clean = clean.substring(7);
        if (clean.charAt(0) === '/' && clean.charAt(2) === ':') {
            clean = clean.substring(1);
        }
    }
    return clean;
}

var csInterface = new CSInterface();

// --- 🔥 STRICT VERSIONING & SECURITY 🔥 ---
var PLUGIN_VERSION = "premium_v1.0";
var PLUGIN_ID = "92c18351";
var AUTH_SERVER_URL = "https://fivenest-backend.onrender.com/api/license/verify";
var GRACE_PERIOD_DAYS = 3;
var isSystemReady = false;
var PRODUCTION_LIMIT = 10000;

// --- DATA ---
var defaultSizes = {
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
var sizeDB = defaultSizes; 
var selectedCSVFile = null;
var selectedFolder = null;
var startTime = 0;

function runHostScript(scriptString) {
    return new Promise(function(resolve) {
        csInterface.evalScript(scriptString, function(res) {
            resolve(res);
        });
    });
}

document.addEventListener("DOMContentLoaded", async function() {
    loadDatabase();
    loadDefaults(); 
    updateUsageDisplay(); 
    buildQtyGrid();

    document.getElementById("btnThemeToggle").onclick = function() {
        document.body.classList.toggle("light-tool");
    };
    
    document.getElementById("btnToggleConfig").onclick = function() {
        var content = document.getElementById("configContent");
        var icon = document.getElementById("btnToggleConfig");
        content.classList.toggle("hidden-control");
        icon.classList.toggle("collapsed");
    };

    document.getElementById("exportFormat").addEventListener("change", updateUIOptions);

    var tabs = ["Run", "Edit", "Manual", "Help"];
    function switchTab(target) {
        tabs.forEach(function(t) {
            document.getElementById("tab" + t).classList.remove("active");
            document.getElementById("panel" + t).classList.remove("active");
        });
        document.getElementById("tab" + target).classList.add("active");
        document.getElementById("panel" + target).classList.add("active");
    }
    document.getElementById("tabRun").onclick = function() { switchTab("Run"); };
    document.getElementById("tabEdit").onclick = function() { switchTab("Edit"); };
    document.getElementById("tabManual").onclick = function() { switchTab("Manual"); };
    document.getElementById("tabHelp").onclick = function() { switchTab("Help"); };

    // Toggle Manual Mode
    document.getElementById("chkManualMode").addEventListener("change", function(e) {
        var isManual = e.target.checked;
        var csvContainer = document.getElementById("csvInputContainer");
        var tabManual = document.getElementById("tabManual");
        
        if(isManual) {
            csvContainer.classList.add("disabled-text");
            document.getElementById("btnCSV").disabled = true;
            tabManual.classList.remove("hidden-control");
            log("Live Size mode enabled. CSV input bypassed.");
        } else {
            csvContainer.classList.remove("disabled-text");
            document.getElementById("btnCSV").disabled = false;
            tabManual.classList.add("hidden-control");
            if(document.getElementById("tabManual").classList.contains("active")) {
                switchTab("Run");
            }
        }
    });

    // Select CSV
    var inputCSV = document.createElement("input");
    inputCSV.type = "file";
    inputCSV.accept = ".csv,.txt";
    inputCSV.style.display = "none";
    document.body.appendChild(inputCSV);
    inputCSV.addEventListener("change", function(e) {
        if (inputCSV.files.length > 0) {
            selectedCSVFile = inputCSV.files[0];
            document.getElementById("lblCSV").innerText = selectedCSVFile.name;
            document.getElementById("lblCSV").style.color = "#4CAF50";
            log("CSV Set: " + selectedCSVFile.name);
        }
    });
    document.getElementById("btnCSV").addEventListener("click", function() {
        inputCSV.click();
    });

    // Select Output Folder
    document.getElementById("btnFolder").addEventListener("click", function() {
        var result = window.cep.fs.showOpenDialog(false, true, "Select Output Folder", "", []);
        if (result && result.data && result.data.length > 0) {
            selectedFolder = cleanCEPPath(result.data[0]);
            var parts = selectedFolder.split(/[\\\/]/);
            var folderName = parts[parts.length - 1] || parts[parts.length - 2] || "Output";
            document.getElementById("lblFolder").innerText = folderName;
            document.getElementById("lblFolder").style.color = "#4CAF50";
            log("Output Folder Set: " + selectedFolder);
        }
    });
    
    document.getElementById("btnValidate").onclick = validateCSV; 
    document.getElementById("btnRun").onclick = runEngine;
    document.getElementById("btnSetDefault").onclick = saveDefaults; 
    document.getElementById("btnClearLog").onclick = function() { document.getElementById("logArea").innerText = "Ready."; };
    document.getElementById("btnClearQty").onclick = clearVirtualGrid;

    var sel = document.getElementById("sizeSelector");
    Object.keys(sizeDB).forEach(function(k) {
        var o = document.createElement("option");
        o.value = k;
        o.innerText = "Size " + k;
        sel.appendChild(o);
    });
    sel.addEventListener("change", loadSizeToUI);
    document.getElementById("btnSaveDB").addEventListener("click", saveSizeFromUI);

    var btnAct = document.getElementById("btnActivate");
    btnAct.onclick = async function() {
        if (btnAct.innerText === "LOGOUT") {
            localStorage.removeItem("fivenest_license_key");
            localStorage.removeItem("fivenest_license_email");
            localStorage.removeItem("fivenest_last_verified");
            btnAct.innerText = "ACTIVATE";
            document.getElementById("txtLicenseEmail").value = "";
            document.getElementById("txtLicenseKey").value = "";
            document.getElementById("txtLicenseEmail").style.display = "block";
            document.getElementById("txtLicenseKey").style.display = "block";
            alert("License Removed from this PC.");
            await checkLicenseSystem(); 
            return;
        }

        var email = document.getElementById("txtLicenseEmail").value.trim();
        var key = document.getElementById("txtLicenseKey").value.trim();
        if(email && key) await checkLicenseSystem(email, key, true);
        else alert("Please fill in both Email and License Key.");
    };

    var btnToggleLicense = document.getElementById("btnToggleLicense");
    if (btnToggleLicense) {
        btnToggleLicense.onclick = function() {
            var licContent = document.getElementById("licenseContent");
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
    var chatHistory = document.getElementById("chatHistory");
    var txtChatInput = document.getElementById("txtChatInput");
    var btnChatSend = document.getElementById("btnChatSend");
    var btnClearChat = document.getElementById("btnClearChat");
    var chatSuggestions = document.getElementById("chatSuggestions");

    var helpManual = [
        {
            title: "Blank Kit",
            keywords: ["blank", "kit", "no name", "no number", "name", "number"],
            summary: "Blank Kit exports designs without player names or numbers.",
            details: "When **Blank Kit** is checked, the plugin bypasses name and number layers during front/back exports."
        },
        {
            title: "Half-Sleeve Merge",
            keywords: ["half sleeve", "merge", "join", "sleeve merge", "padding", "white padding"],
            summary: "Half-Sleeve Merge joins left and right sleeves vertically with 0.2\" padding.",
            details: "When **Half-Sleeve Merge** is checked, the plugin exports Left and Right half sleeves as normal, then vertically merges them (Left on top, Right on bottom) with exactly **0.2 inches** of padding. It saves the combined file and deletes the original two separate files."
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
            details: "Click the **Live Size/Qty** tab to open the Virtual Data Entry grid. You can type in the quantity of front/back, half sleeves, and full sleeves per size (18 to 60) directly in Illustrator. This is useful for quickly printing custom adjustments without a CSV file."
        },
        {
            title: "Save Default",
            keywords: ["save default", "default", "save def", "defaults"],
            summary: "Save Default remembers your current settings.",
            details: "Clicking **Save Default** saves your selected checkbox configurations, resolution, format, and compression settings to your local profile."
        },
        {
            title: "How to Run Automation",
            keywords: ["run", "how to use", "start", "automation", "begin", "steps"],
            summary: "Learn the step-by-step guide to run a batch automation job.",
            details: "To run a batch job:\n1. Choose your inputs: select a CSV file or fill out quantities in the *Live Size/Qty* tab.\n2. Choose your outputs: click *Select Output* folder.\n3. Configure options (Format, Resolution, compression, and sleeve merge options).\n4. Click **Run Automation** to process everything automatically."
        },
        {
            title: "Tiers & Usage Limits",
            keywords: ["limit", "usage", "subscription", "starter", "pro", "premium", "enterprise", "pcs", "free trial", "trial"],
            summary: "Learn about product limits and trial activation.",
            details: "Usage limits are calculated *only* when a BACK layer is exported:\n- **Premium Plan**: 10,000 pcs limit.\n- New installations get a **7-Day Free Trial**."
        }
    ];

    function openWhatsAppSupport() {
        var email = localStorage.getItem("fivenest_license_email") || "Unregistered User";
        var clientName = document.getElementById("txtCustomerName") ? document.getElementById("txtCustomerName").value.trim() : "";
        var nameSection = clientName ? clientName + " (" + email + ")" : email;
        var rawMessage = "Hello Vilesh, I need assistance with FN Premium for Illustrator. (User: " + nameSection + ")";
        var encodedMessage = encodeURIComponent(rawMessage);
        var url = "https://wa.me/918879228710?text=" + encodedMessage;
        csInterface.openURLInDefaultBrowser(url);
    }

    function appendMessage(text, sender) {
        var bubble = document.createElement("div");
        bubble.className = "chat-bubble chat-bubble-" + sender;
        bubble.innerText = text;
        chatHistory.appendChild(bubble);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function appendMessageWithWhatsApp(text) {
        var bubble = document.createElement("div");
        bubble.className = "chat-bubble chat-bubble-assistant";
        bubble.innerText = text + "\n\n";
        
        var link = document.createElement("span");
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
        var suggestionTitles = ["Blank Kit", "Half-Sleeve Merge", "Smart Mockup", "Quick Size Entry", "How to Run"];
        suggestionTitles.forEach(function(title) {
            var pill = document.createElement("span");
            pill.className = "chat-suggestion-pill";
            pill.innerText = title;
            pill.onclick = function() {
                appendMessage(title, "user");
                var found = helpManual.find(function(h) { return h.title === title; });
                if (found) {
                    setTimeout(function() {
                        appendMessage(found.summary + "\n\n" + found.details, "assistant");
                    }, 200);
                }
            };
            chatSuggestions.appendChild(pill);
        });

        var supportPill = document.createElement("span");
        supportPill.className = "chat-suggestion-pill";
        supportPill.innerText = "💬 WhatsApp Support";
        supportPill.style.borderColor = "#2ecc71";
        supportPill.style.color = "#2ecc71";
        supportPill.onclick = function() {
            appendMessage("Connect with Support", "user");
            setTimeout(function() {
                appendMessage("Opening WhatsApp to chat with Vilesh...", "assistant");
                openWhatsAppSupport();
            }, 200);
        };
        chatSuggestions.appendChild(supportPill);
    }

    function handleUserInput() {
        var query = txtChatInput.value.trim();
        if (!query) return;
        appendMessage(query, "user");
        txtChatInput.value = "";

        setTimeout(function() {
            var cleanQuery = query.toLowerCase().replace(/[^a-z0-9\s]/g, "");
            var words = cleanQuery.split(/\s+/).filter(function(w) { return w.length > 2; });
            
            if (words.length === 0) {
                appendMessage("I'm sorry, I couldn't catch that. Could you please specify a feature or choose one of the quick suggestions below?", "assistant");
                return;
            }
            
            var bestMatch = null;
            var maxMatches = 0;
            
            for (var i = 0; i < helpManual.length; i++) {
                var item = helpManual[i];
                var matchCount = 0;
                for (var j = 0; j < words.length; j++) {
                    var word = words[j];
                    if (item.keywords.some(function(k) { return k.indexOf(word) > -1 || word.indexOf(k) > -1; }) || 
                        item.title.toLowerCase().indexOf(word) > -1) {
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
                appendMessageWithWhatsApp("I couldn't find a direct match for your question. Try rephrasing or click a suggestion below! If you still need help, click below to chat with Vilesh directly:");
            }
        }, 300);
    }

    btnChatSend.onclick = handleUserInput;
    txtChatInput.onkeydown = function(e) { if (e.key === "Enter") handleUserInput(); };
    btnClearChat.onclick = function() {
        chatHistory.innerHTML = "";
        appendMessage("Hi! I'm your FN Premium offline assistant. Ask me about any feature (e.g. Half-Sleeve Merge, Quick Size Entry) or click a suggestion below!", "assistant");
    };

    appendMessage("Hi! I'm your FN Premium offline assistant. Ask me about any feature (e.g. Half-Sleeve Merge, Quick Size Entry) or click a suggestion below!", "assistant");
    renderSuggestions();

    await checkLicenseSystem();
});

function buildQtyGrid() {
    var grid = document.getElementById("qtyGrid");
    grid.innerHTML = "";
    var sizesToRender = ["18","20","22","24","26","28","30","32","34","36","38","40","42","44","46","48","50","52","54","56","58","60"];
    sizesToRender.forEach(function(sz) {
        var row = document.createElement("div");
        row.className = "row-tiny";
        row.style.marginBottom = "3px";
        row.style.gap = "4px";
        row.style.justifyContent = "flex-start";
        row.style.alignItems = "center";
        row.style.width = "100%";

        var label = document.createElement("span");
        label.innerText = sz;
        label.style.width = "20px";
        label.style.fontWeight = "bold";
        label.style.fontSize = "9px";
        row.appendChild(label);

        var fbInput = document.createElement("input");
        fbInput.type = "number";
        fbInput.id = "qty_fb_" + sz;
        fbInput.className = "qty-input";
        fbInput.placeholder = "0";
        row.appendChild(fbInput);

        var halfInput = document.createElement("input");
        halfInput.type = "number";
        halfInput.id = "qty_half_" + sz;
        halfInput.className = "qty-input";
        halfInput.placeholder = "0";
        row.appendChild(halfInput);

        var fullInput = document.createElement("input");
        fullInput.type = "number";
        fullInput.id = "qty_full_" + sz;
        fullInput.className = "qty-input";
        fullInput.placeholder = "0";
        row.appendChild(fullInput);

        grid.appendChild(row);
    });
}

function clearVirtualGrid() {
    var sizes = ["18","20","22","24","26","28","30","32","34","36","38","40","42","44","46","48","50","52","54","56","58","60"];
    sizes.forEach(function(sz) {
        var fb = document.getElementById("qty_fb_" + sz);
        var half = document.getElementById("qty_half_" + sz);
        var full = document.getElementById("qty_full_" + sz);
        if (fb) fb.value = "";
        if (half) half.value = "";
        if (full) full.value = "";
    });
    log("Live quantity grid cleared.");
}

function updateUIOptions() {
    var fmt = document.getElementById("exportFormat").value;
    var chkEmbed = document.getElementById("chkEmbedProfile");
    var containerLZW = document.getElementById("containerLZW");
    var lblEmbed = document.getElementById("lblEmbed");

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

function saveDefaults() {
    var config = {
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
        mergeHalfSleeves: document.getElementById("chkMergeHalfSleeves").checked
    };
    localStorage.setItem("fivenest_config_premium", JSON.stringify(config));
    log("✅ Settings Saved as Default.");
}

function loadDefaults() {
    try {
        var str = localStorage.getItem("fivenest_config_premium");
        if (str) {
            var config = JSON.parse(str);
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
            if(config.mergeHalfSleeves !== undefined) document.getElementById("chkMergeHalfSleeves").checked = config.mergeHalfSleeves;
            if(config.manualMode !== undefined) {
                document.getElementById("chkManualMode").checked = config.manualMode;
                document.getElementById("chkManualMode").dispatchEvent(new Event('change')); 
            }
            updateUIOptions();
            log("Loaded Default Settings.");
        }
    } catch(e) {}
}

function parseCSV(text) {
    return text.split("\n").map(function(line) {
        return line.split(",");
    });
}

function getVal(row, headers, key) {
    var idx = headers.indexOf(key);
    return (idx > -1 && row[idx]) ? row[idx].trim() : null;
}

async function validateCSV() {
    var isManual = document.getElementById("chkManualMode").checked;
    if (isManual) { log("✅ Live Size Mode Active. CSV is bypassed."); return; }
    if (!selectedCSVFile) { log("❌ Select a CSV first."); return; }
    try {
        var fs = require('fs');
        var csvText = fs.readFileSync(selectedCSVFile.path, 'utf8');
        var rows = parseCSV(csvText);
        var headers = rows[0].map(function(h) { return h.toLowerCase().trim(); });
        var errors = [];

        var required = ["filename", "size"];
        required.forEach(function(req) {
            if (!headers.includes(req) && !headers.includes("front size")) errors.push('Missing Column: "' + req + '"');
        });

        for (var i = 1; i < rows.length; i++) {
            var row = rows[i];
            if (row.length < 2) continue;
            if (!getVal(row, headers, "size") && !getVal(row, headers, "front size")) {
                errors.push("Row " + (i+1) + ": Missing Size info.");
            }
        }

        if (errors.length === 0) {
            log("✅ CSV Validated: No errors found.");
            alert("CSV Looks Good! You are ready to run.");
        } else {
            log("❌ CSV ERRORS:\n" + errors.slice(0, 5).join("\n"));
            alert("CSV has errors. Check the Process Log.");
        }
    } catch(e) {
        log("❌ Validation Error: " + e.message);
    }
}

function log(m) {
    var l = document.getElementById("logArea");
    if (l) {
        l.innerText += "\n" + m;
        l.scrollTop = l.scrollHeight;
    }
}

function updateProgressUI(current, total) {
    var percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
    document.getElementById("progressBar").style.width = percent + "%";
    document.getElementById("progressVal").innerText = percent + "%";
    
    if (current > 0 && current < total) {
        var elapsed = Date.now() - startTime;
        var remaining = (elapsed / current) * (total - current);
        var mins = Math.floor(remaining / 60000);
        var secs = Math.floor((remaining % 60000) / 1000);
        document.getElementById("etaDisplay").innerText = "Remaining: " + mins + "m " + secs + "s";
    } else if (current >= total && total > 0) {
        document.getElementById("etaDisplay").innerText = "Process Completed.";
    }
}

async function runEngine() {
    if (!isSystemReady) {
        alert("Cannot Run: Check Internet connection or License status.");
        await checkLicenseSystem();
        return;
    }

    var currentUsage = parseInt(localStorage.getItem("fivenest_production_usage") || "0");
    if (PRODUCTION_LIMIT > 0 && currentUsage >= PRODUCTION_LIMIT) {
        alert("Limit has been exceeded. You need to upgrade to the Enterprise plan.");
        log("❌ Run blocked: Production limit exceeded.");
        return;
    }

    var sameFB = document.getElementById("chkSameFrontBack").checked;
    var isManual = document.getElementById("chkManualMode").checked;
    var isRaglan = document.getElementById("chkRaglan").checked; 
    var chkMergeHalf = document.getElementById("chkMergeHalfSleeves").checked;

    if (!isManual && !selectedCSVFile) { alert("Please select a CSV File."); return; }
    if (!selectedFolder) { alert("Please select an Output Folder."); return; }
    
    var res = parseInt(document.getElementById("resolution").value);
    var format = document.getElementById("exportFormat").value.toLowerCase();
    var shouldEmbed = document.getElementById("chkEmbedProfile").checked;
    var useLZW = document.getElementById("chkLZW").checked;
    var doMockup = document.getElementById("chkMockup").checked;
    var doNameNum = document.getElementById("chkNameNum").checked; 

    var originalVisibility = null;
    try {
        originalVisibility = await runHostScript("getLayersVisibility()");
        var fs = require('fs');
        var pathMod = require('path');
        
        var csvRows = [];
        var headers = [];
        var totalSteps = 0;
        
        if (isManual) {
            log(">>> Initializing Live Size Mode (CSV Bypassed)...");
            headers = ["front size", "total qty", "half sleeve", "full sleeve"];
            var dataRows = [];
            var sizes = ["18","20","22","24","26","28","30","32","34","36","38","40","42","44","46","48","50","52","54","56","58","60"];
            sizes.forEach(function(sz) {
                var elFB = document.getElementById("qty_fb_" + sz);
                var elHalf = document.getElementById("qty_half_" + sz);
                var elFull = document.getElementById("qty_full_" + sz);
                var fb = (elFB && elFB.value) ? elFB.value.toString() : "0";
                var half = (elHalf && elHalf.value) ? elHalf.value.toString() : "0";
                var full = (elFull && elFull.value) ? elFull.value.toString() : "0";
                
                if (parseInt(fb) > 0 || parseInt(half) > 0 || parseInt(full) > 0) {
                    dataRows.push([sz, fb, half, full]);
                }
            });
            
            if (dataRows.length === 0) {
                alert("No quantities entered! Please fill out numbers in the Live Size tab.");
                return;
            }
            csvRows = [headers].concat(dataRows);
            totalSteps = dataRows.length * (doNameNum ? 7 : 6);
        } else {
            var csvText = fs.readFileSync(selectedCSVFile.path, 'utf8');
            csvRows = parseCSV(csvText);
            var dataRows = csvRows.slice(1).filter(function(r) { return r.length > 0 && r[0] !== ""; });
            if (dataRows.length === 0) { alert("Empty CSV or No Data"); return; }
            headers = csvRows[0].map(function(h) { return h.toLowerCase().trim(); });
            totalSteps = dataRows.length * (doNameNum ? 7 : 6);
        }

        document.getElementById("workCaption").classList.remove("hidden-control");
        startTime = Date.now();
        updateProgressUI(0, totalSteps);

        var frontDir = pathMod.join(selectedFolder, "Front");
        var backDir = pathMod.join(selectedFolder, "Back");
        var sleeveDir = pathMod.join(selectedFolder, "Sleeve");
        var nnDir = doNameNum ? pathMod.join(selectedFolder, "Name_Number") : null;
        
        if (!fs.existsSync(frontDir)) fs.mkdirSync(frontDir);
        if (!fs.existsSync(backDir)) fs.mkdirSync(backDir);
        if (!fs.existsSync(sleeveDir)) fs.mkdirSync(sleeveDir);
        if (doNameNum && !fs.existsSync(nnDir)) fs.mkdirSync(nnDir);

        var layerModes = [
            { name: "Front", mode: "FRONT", dir: frontDir },
            { name: "Back", mode: "BACK", dir: backDir },
            { name: "Half Left SL", mode: "HALF_L", dir: sleeveDir },
            { name: "Half Right SL", mode: "HALF_R", dir: sleeveDir },
            { name: "Full Left SL", mode: "FULL_L", dir: sleeveDir },
            { name: "Full Right SL", mode: "FULL_R", dir: sleeveDir }
        ];
        if (doNameNum) {
            layerModes.push({ name: "Only Name & Number", mode: "NAMENUM", dir: nnDir });
        }

        var stats = { Front: 0, Back: 0, Sleeves: 0, NameNum: 0 };
        var activeRows = csvRows.slice(1).filter(function(r) { return r.length > 0 && r[0] !== ""; });
        var currentStep = 0;

        for (var lmIndex = 0; lmIndex < layerModes.length; lmIndex++) {
            var lm = layerModes[lmIndex];
            log(">>> STARTING LAYER: " + lm.name);
            
            // Hide all other layer modes first
                for (var otherIdx = 0; otherIdx < layerModes.length; otherIdx++) {
                    await runHostScript("toggleLayerVisibility('" + layerModes[otherIdx].name + "', false)");
                }
                var checkVis = await runHostScript("toggleLayerVisibility('" + lm.name + "', true)");
            if (checkVis.indexOf("ERROR") > -1 || checkVis.indexOf("NOT_FOUND") > -1) {
                log("⚠️ Skipping " + lm.name + " (Layer not found/visible)");
                currentStep += activeRows.length;
                updateProgressUI(currentStep, totalSteps);
                continue;
            }

            var exportCount = 0;
            for (var i = 0; i < activeRows.length; i++) {
                var row = activeRows[i];
                if (!row || row.length === 0 || row[0] === "") {
                    currentStep++;
                    updateProgressUI(currentStep, totalSteps);
                    continue;
                }

                var qty = "0", activeSize = "";
                if (lm.mode === "FRONT" || (lm.mode === "BACK" && sameFB)) {
                    activeSize = getVal(row, headers, "front size");
                    qty = getVal(row, headers, "total qty") || getVal(row, headers, "total quantity") || "0";
                } else if (lm.mode === "BACK" || lm.mode === "NAMENUM") {
                    var fname = row[0];
                    activeSize = getVal(row, headers, "size") || (fname.match(/^(\d{2})/) ? fname.match(/^(\d{2})/)[1] : "");
                    qty = "1";
                } else {
                    activeSize = getVal(row, headers, "front size");
                    qty = getVal(row, headers, lm.mode.indexOf("HALF") > -1 ? "half sleeve" : "full sleeve") || "0";
                }

                if (!activeSize || qty === "0" || qty === "") {
                    currentStep++;
                    updateProgressUI(currentStep, totalSteps);
                    continue;
                }

                var finalName = "", w = 0, h = 0;
                var textUpdates = [];
                var fontUpdates = [];
                var compressUpdates = [];

                if (lm.mode === "FRONT" || (lm.mode === "BACK" && sameFB)) {
                    finalName = activeSize + " = " + qty + " " + (lm.mode === "FRONT" ? "F" : "B");
                    if (sizeDB[activeSize]) { w = sizeDB[activeSize].front.w; h = sizeDB[activeSize].front.h; }
                    textUpdates.push({ name: 'SIZE', text: activeSize });
                    textUpdates.push({ name: 'quantity', text: qty });
                } else if (lm.mode === "BACK") {
                    finalName = row[0] + " B";
                    if (sizeDB[activeSize]) { w = sizeDB[activeSize].back.w; h = sizeDB[activeSize].back.h; }
                    for (var c = 0; c < headers.length; c++) {
                        textUpdates.push({ name: headers[c], text: (row[c] ? row[c] : " ") });
                    }
                    var sleeveData = getVal(row, headers, "sleeve");
                    if (sleeveData) textUpdates.push({ name: 'sleeve style', text: sleeveData });
                    var fontName = getVal(row, headers, "font");
                    if (fontName) {
                        fontUpdates.push({ name: 'name', font: fontName });
                        fontUpdates.push({ name: 'number', font: fontName });
                    }
                    var limitName = parseFloat(document.getElementById("limitName").value) || 11;
                    var limitNum = parseFloat(document.getElementById("limitNum").value) || 9;
                    compressUpdates.push({ name: 'name', maxInches: limitName });
                    compressUpdates.push({ name: 'number', maxInches: limitNum });
                } else if (lm.mode === "NAMENUM") {
                    finalName = row[0] + " NN";
                    w = (sizeDB[activeSize] && sizeDB[activeSize].nn) ? sizeDB[activeSize].nn.w : 10;
                    h = (sizeDB[activeSize] && sizeDB[activeSize].nn) ? sizeDB[activeSize].nn.h : 10;
                    for (var c = 0; c < headers.length; c++) {
                        textUpdates.push({ name: headers[c], text: (row[c] ? row[c] : " ") });
                    }
                    var fontName = getVal(row, headers, "font");
                    if (fontName) {
                        fontUpdates.push({ name: 'name', font: fontName });
                        fontUpdates.push({ name: 'number', font: fontName });
                    }
                    var limitName = parseFloat(document.getElementById("limitName").value) || 11;
                    var limitNum = parseFloat(document.getElementById("limitNum").value) || 9;
                    compressUpdates.push({ name: 'name', maxInches: limitName });
                    compressUpdates.push({ name: 'number', maxInches: limitNum });
                } else if (lm.mode.indexOf("HALF") > -1 || lm.mode.indexOf("FULL") > -1) {
                    var suf = lm.mode.indexOf("HALF") > -1 ? (lm.mode.indexOf("_L") > -1 ? " HSL L" : " HSL R") : (lm.mode.indexOf("_L") > -1 ? " FSL L" : " FSL R");
                    if (isRaglan) suf = suf.replace("HSL", "Raglan HSL").replace("FSL", "Raglan FSL");
                    
                    finalName = activeSize + " = " + qty + suf;
                    
                    if (isRaglan) {
                        w = lm.mode.indexOf("HALF") > -1 ? (sizeDB[activeSize].rHalf ? sizeDB[activeSize].rHalf.w : 11) : (sizeDB[activeSize].rFull ? sizeDB[activeSize].rFull.w : 11);
                        h = lm.mode.indexOf("HALF") > -1 ? (sizeDB[activeSize].rHalf ? sizeDB[activeSize].rHalf.h : 9) : (sizeDB[activeSize].rFull ? sizeDB[activeSize].rFull.h : 17);
                    } else {
                        w = lm.mode.indexOf("HALF") > -1 ? sizeDB[activeSize].half.w : sizeDB[activeSize].full.w;
                        h = lm.mode.indexOf("HALF") > -1 ? sizeDB[activeSize].half.h : sizeDB[activeSize].full.h;
                    }
                    textUpdates.push({ name: 'SIZE', text: activeSize });
                    textUpdates.push({ name: 'quantity', text: qty });
                }

                if (w > 0 && h > 0) {
                    var cleanFN = finalName.replace(/[\/\\:*?"<>|]/g, "_");
                    var outPath = pathMod.join(lm.dir, cleanFN + "." + format);
                    
                    var textJSON = JSON.stringify(textUpdates);
                    var fontJSON = JSON.stringify(fontUpdates);
                    var compressJSON = JSON.stringify(compressUpdates);
                    
                    var exportResult = await runHostScript("processRowInTempDoc('" + lm.name + "', " + w + ", " + h + ", " + res + ", '" + format + "', '" + outPath.replace(/\\/g, "\\\\") + "', " + shouldEmbed + ", " + useLZW + ", '" + textJSON.replace(/'/g, "\\'") + "', '" + fontJSON.replace(/'/g, "\\'") + "', '" + compressJSON.replace(/'/g, "\\'") + "')");
                    if (exportResult.indexOf("SUCCESS") > -1) {
                        exportCount++;
                        if (lm.mode === "BACK") {
                            var usage = parseInt(localStorage.getItem("fivenest_production_usage") || "0");
                            usage++;
                            localStorage.setItem("fivenest_production_usage", usage.toString());
                            updateUsageDisplay();
                            if (PRODUCTION_LIMIT > 0 && usage >= PRODUCTION_LIMIT) {
                                alert("Production limit exceeded. Please upgrade.");
                                break;
                            }
                        }
                    } else {
                        log("❌ Export failed for " + lm.name + ": " + exportResult);
                    }
                }

                currentStep++;
                updateProgressUI(currentStep, totalSteps);
            }

            if (lm.mode === "FRONT") stats.Front += exportCount;
            else if (lm.mode === "BACK") stats.Back += exportCount;
            else if (lm.mode === "NAMENUM") stats.NameNum += exportCount;
            else stats.Sleeves += exportCount;
        }

        // Half-Sleeve Merge Logic
        if (chkMergeHalf) {
            log(">>> Merging Half Sleeves...");
            for (var i = 0; i < activeRows.length; i++) {
                var row = activeRows[i];
                var activeSize = getVal(row, headers, "front size");
                var qty = getVal(row, headers, "half sleeve") || "0";
                
                if (!activeSize || parseInt(qty) <= 0 || isNaN(parseInt(qty))) continue;
                
                var sufL = isRaglan ? " Raglan HSL L" : " HSL L";
                var sufR = isRaglan ? " Raglan HSL R" : " HSL R";
                var sufMerged = isRaglan ? " Raglan HSL" : " HSL";

                var nameL = (activeSize + " = " + qty + sufL).replace(/[\/\\:*?"<>|]/g, "_") + "." + format;
                var nameR = (activeSize + " = " + qty + sufR).replace(/[\/\\:*?"<>|]/g, "_") + "." + format;
                var nameMerged = (activeSize + " = " + qty + sufMerged).replace(/[\/\\:*?"<>|]/g, "_") + "." + format;

                var pathL = pathMod.join(sleeveDir, nameL);
                var pathR = pathMod.join(sleeveDir, nameR);
                var pathMerged = pathMod.join(sleeveDir, nameMerged);

                if (fs.existsSync(pathL) && fs.existsSync(pathR)) {
                    log("Merging sleeves for size: " + activeSize);
                    var mergeRes = await runHostScript("mergeSleeves('" + pathL.replace(/\\/g, "\\\\") + "', '" + pathR.replace(/\\/g, "\\\\") + "', '" + pathMerged.replace(/\\/g, "\\\\") + "', '" + format + "', " + res + ", " + useLZW + ")");
                    if (mergeRes.indexOf("SUCCESS") > -1) {
                        log("✅ Merged and saved: " + nameMerged);
                    } else {
                        log("⚠️ Merge failed: " + mergeRes);
                    }
                }
            }
        }

        // Generate mockups
        if (doMockup) {
            log(">>> Generating Mockups...");
            var csvNameClean = isManual ? "ManualOrder" : selectedCSVFile.name.replace(/\.[^/.]+$/, "");
            
            // Output Half Sleeve mockup
            await runHostScript("generateMockups('" + selectedFolder.replace(/\\/g, "\\\\") + "', '" + csvNameClean.replace(/'/g, "\\'") + "', true)");
            // Output Full Sleeve mockup
            await runHostScript("generateMockups('" + selectedFolder.replace(/\\/g, "\\\\") + "', '" + csvNameClean.replace(/'/g, "\\'") + "', false)");
            log("✅ Mockups saved.");
        }

        updateProgressUI(totalSteps, totalSteps);
        var totalTime = Math.round((Date.now() - startTime) / 1000);
        log("--- SUMMARY ---");
        log("Time Taken: " + Math.floor(totalTime/60) + "m " + (totalTime%60) + "s");
        log("F: " + stats.Front + " | B: " + stats.Back + " | SL: " + stats.Sleeves + " | NN: " + stats.NameNum);
        log("✅ JOB COMPLETE!");
        alert("Automation Finished! All files exported.");

    } catch(e) {
        log("❌ Execution Error: " + e.message);
    } finally {
        if (originalVisibility) {
            await runHostScript("restoreLayersVisibility('" + originalVisibility.replace(/'/g, "\\'") + "')");
        }
        document.getElementById("workCaption").classList.add("hidden-control");
    }
}

function loadSizeToUI() {
    var key = document.getElementById("sizeSelector").value;
    var d = sizeDB[key];
    if (!d) return;
    document.getElementById("frontW").value = d.front.w;
    document.getElementById("frontH").value = d.front.h;
    document.getElementById("backW").value = d.back.w;
    document.getElementById("backH").value = d.back.h;
    document.getElementById("halfW").value = d.half.w;
    document.getElementById("halfH").value = d.half.h;
    document.getElementById("fullW").value = d.full.w;
    document.getElementById("fullH").value = d.full.h;
    document.getElementById("rHalfW").value = d.rHalf ? d.rHalf.w : 0;
    document.getElementById("rHalfH").value = d.rHalf ? d.rHalf.h : 0;
    document.getElementById("rFullW").value = d.rFull ? d.rFull.w : 0;
    document.getElementById("rFullH").value = d.rFull ? d.rFull.h : 0;
    document.getElementById("nnW").value = d.nn ? d.nn.w : 0;
    document.getElementById("nnH").value = d.nn ? d.nn.h : 0;
}

function saveSizeFromUI() {
    var key = document.getElementById("sizeSelector").value;
    sizeDB[key] = {
        front: { w: parseFloat(document.getElementById("frontW").value), h: parseFloat(document.getElementById("frontH").value) },
        back: { w: parseFloat(document.getElementById("backW").value), h: parseFloat(document.getElementById("backH").value) },
        half: { w: parseFloat(document.getElementById("halfW").value), h: parseFloat(document.getElementById("halfH").value) },
        full: { w: parseFloat(document.getElementById("fullW").value), h: parseFloat(document.getElementById("fullH").value) },
        rHalf: { w: parseFloat(document.getElementById("rHalfW").value) || 0, h: parseFloat(document.getElementById("rHalfH").value) || 0 },
        rFull: { w: parseFloat(document.getElementById("rFullW").value) || 0, h: parseFloat(document.getElementById("rFullH").value) || 0 },
        nn: { w: parseFloat(document.getElementById("nnW").value), h: parseFloat(document.getElementById("nnH").value) }
    };
    localStorage.setItem("fivenest_sizes_premium", JSON.stringify(sizeDB));
    document.getElementById("saveMsg").innerText = "Saved!";
    setTimeout(function() { document.getElementById("saveMsg").innerText = ""; }, 1500);
}

function loadDatabase() {
    try {
        var str = localStorage.getItem("fivenest_sizes_premium");
        if (str) {
            var loaded = JSON.parse(str);
            for (var k in loaded) {
                sizeDB[k] = Object.assign({}, defaultSizes[k], loaded[k]);
            }
        }
    } catch(e) {}
}

function checkTrialStatus(lbl, runBtn, btnAct, txtEmail, txtKey, btnManage, licContent) {
    var trialStart = localStorage.getItem("fivenest_trial_start");
    if (!trialStart) {
        trialStart = Date.now().toString();
        localStorage.setItem("fivenest_trial_start", trialStart);
    }
    var msElapsed = Date.now() - parseInt(trialStart);
    var daysRemaining = 7 - (msElapsed / (1000 * 60 * 60 * 24));

    if (daysRemaining > 0) {
        lbl.innerText = "TRIAL ACTIVE (" + Math.ceil(daysRemaining) + " Days Left)";
        lbl.style.color = "#00bcd4";
        runBtn.innerText = "▶ RUN AUTOMATION";
        runBtn.disabled = false;
        isSystemReady = true;
        btnAct.innerText = "ACTIVATE";
        txtEmail.style.display = "block";
        txtKey.style.display = "block";
        if (licContent) licContent.style.display = "block";
        if (btnManage) btnManage.classList.remove("collapsed");
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
        if (btnManage) btnManage.classList.remove("collapsed");
    }
}

async function checkLicenseSystem(manualEmail, manualKey, isUserAction) {
    var lbl = document.getElementById("licenseStatus");
    var runBtn = document.getElementById("btnRun");
    var btnAct = document.getElementById("btnActivate");
    var txtEmail = document.getElementById("txtLicenseEmail");
    var txtKey = document.getElementById("txtLicenseKey");
    var btnManage = document.getElementById("btnToggleLicense");
    var licContent = document.getElementById("licenseContent");

    var savedEmail = localStorage.getItem("fivenest_license_email");
    var savedKey = localStorage.getItem("fivenest_license_key");

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

    var authResult = await verifyFiveNestKey(savedEmail, savedKey); 
    
    if (authResult.success) {
        lbl.innerText = "LICENSE ACTIVE";
        lbl.style.color = "#4cd964"; 
        localStorage.setItem("fivenest_license_email", savedEmail);
        localStorage.setItem("fivenest_license_key", savedKey);
        localStorage.setItem("fivenest_last_verified", Date.now().toString());
        btnAct.innerText = "LOGOUT";
        txtEmail.style.display = "block"; 
        txtKey.style.display = "block"; 
        if (licContent) licContent.style.display = "none";
        if (btnManage) btnManage.classList.add("collapsed");
        runBtn.innerText = "▶ RUN AUTOMATION";
        runBtn.disabled = false;
        isSystemReady = true;
        if(isUserAction) alert("License Activated Successfully!");

    } else if (authResult.isOffline) {
        var lastVerified = parseInt(localStorage.getItem("fivenest_last_verified") || "0");
        var daysSinceVerify = (Date.now() - lastVerified) / (1000 * 60 * 60 * 24);

        if (daysSinceVerify <= GRACE_PERIOD_DAYS) {
            lbl.innerText = "OFFLINE - GRACE ACTIVE";
            lbl.style.color = "#ff9500"; 
            btnAct.innerText = "LOGOUT";
            txtEmail.style.display = "block"; 
            txtKey.style.display = "block"; 
            if (licContent) licContent.style.display = "none";
            if (btnManage) btnManage.classList.add("collapsed");
            runBtn.innerText = "▶ RUN (OFFLINE)";
            runBtn.disabled = false;
            isSystemReady = true;
            if(isUserAction) alert("Offline Mode Active.");
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
        if(isUserAction) alert("Activation Failed:\n\n" + authResult.message);
        checkTrialStatus(lbl, runBtn, btnAct, txtEmail, txtKey, btnManage, licContent);
    }
}

function getHardwareId() {
    var hwid = localStorage.getItem("fivenest_hwid");
    if (!hwid) {
        try {
            var osModule = require("os");
            hwid = "FN-" + osModule.hostname().toUpperCase().replace(/[^A-Z0-9]/g, '') + "-ILST";
        } catch(e) {
            hwid = "FN-" + Math.random().toString(36).substr(2, 9).toUpperCase();
        }
        localStorage.setItem("fivenest_hwid", hwid);
    }
    return hwid;
}

async function verifyFiveNestKey(email, key) {
    try {
        var machineId = getHardwareId();
        var payload = { 
            email: email.trim(),
            licenseKey: key.trim(), 
            deviceId: machineId,
            pluginId: PLUGIN_ID
        };

        var resp = await fetch(AUTH_SERVER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        var data = await resp.json();
        return { success: data.success, message: data.message || "Verification response received", isOffline: false };
    } catch(e) {
        return { success: false, message: "Could not connect to authentication server.", isOffline: true };
    }
}

function updateUsageDisplay() {
    var currentUsage = parseInt(localStorage.getItem("fivenest_production_usage") || "0");
    var tag = document.getElementById("versionTag");
    if (tag) {
        tag.innerText = "PREMIUM V1.0 | Usage: " + currentUsage + "/" + PRODUCTION_LIMIT + " pcs";
    }
}
