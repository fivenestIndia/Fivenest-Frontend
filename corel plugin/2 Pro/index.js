// index.js for CorelDRAW Pro Plugin

// --- 🔥 STRICT VERSIONING & SECURITY 🔥 ---
var PLUGIN_VERSION = "pro_v1.0";
var PLUGIN_ID = "92c18352";
var AUTH_SERVER_URL = "https://fivenest-backend.onrender.com/api/license/verify";
var GRACE_PERIOD_DAYS = 3;
var isSystemReady = false;
var PRODUCTION_LIMIT = 2000;

// --- DATA ---
var defaultSizes = {"18":{front:{w:11,h:15}, back:{w:11,h:15}, half:{w:9.5,h:5}, full:{w:9,h:14}, nn:{w:10,h:10}},"20":{front:{w:12,h:16}, back:{w:12,h:16}, half:{w:10,h:5.5}, full:{w:10,h:15}, nn:{w:10,h:10}},"22":{front:{w:13,h:17}, back:{w:13,h:17}, half:{w:11,h:6}, full:{w:11,h:16}, nn:{w:10,h:10}},"24":{front:{w:14,h:20}, back:{w:14,h:20}, half:{w:12,h:6}, full:{w:12,h:17.5}, nn:{w:10,h:10}},"26":{front:{w:15,h:21}, back:{w:15,h:21}, half:{w:12.5,h:7.5}, full:{w:12.5,h:18}, nn:{w:10,h:10}},"28":{front:{w:15.8,h:23}, back:{w:15.8,h:23}, half:{w:14,h:8}, full:{w:14,h:19}, nn:{w:10,h:10}},"30":{front:{w:17,h:25}, back:{w:17,h:25}, half:{w:14.5,h:8.5}, full:{w:14.5,h:20.5}, nn:{w:10,h:10}},"32":{front:{w:18,h:26}, back:{w:18,h:26}, half:{w:15,h:9}, full:{w:15,h:21}, nn:{w:10,h:10}},"34":{front:{w:19,h:27}, back:{w:19,h:27}, half:{w:16,h:9.5}, full:{w:16,h:22.5}, nn:{w:10,h:10}},"36":{front:{w:20,h:28}, back:{w:20,h:28}, half:{w:17,h:10.5}, full:{w:17,h:23.5}, nn:{w:10,h:10}},"38":{front:{w:21,h:29}, back:{w:21,h:29}, half:{w:18,h:10.5}, full:{w:18,h:24}, nn:{w:10,h:10}},"40":{front:{w:22,h:30}, back:{w:22,h:30}, half:{w:19,h:10.5}, full:{w:19,h:25}, nn:{w:10,h:10}},"42":{front:{w:23,h:31}, back:{w:23,h:31}, half:{w:20,h:11.5}, full:{w:20,h:25}, nn:{w:10,h:10}},"44":{front:{w:24,h:31.8}, back:{w:24,h:31.8}, half:{w:21,h:12.5}, full:{w:21,h:26}, nn:{w:10,h:10}},"46":{front:{w:25,h:33}, back:{w:25,h:33}, half:{w:22,h:13}, full:{w:22,h:27}, nn:{w:10,h:10}},"48":{front:{w:26,h:33.5}, back:{w:26,h:33.5}, half:{w:23.5,h:13.5}, full:{w:23.5,h:27.5}, nn:{w:10,h:10}},"50":{front:{w:27,h:34}, back:{w:27,h:34}, half:{w:23,h:14}, full:{w:24,h:28}, nn:{w:10,h:10}},"52":{front:{w:28,h:34.5}, back:{w:28,h:34.5}, half:{w:23,h:14.5}, full:{w:24.5,h:28.5}, nn:{w:10,h:10}},"54":{front:{w:29,h:34.5}, back:{w:29,h:34.5}, half:{w:24,h:15}, full:{w:25.5,h:29}, nn:{w:10,h:10}},"56":{front:{w:30,h:35}, back:{w:30,h:35}, half:{w:25,h:15}, full:{w:26,h:29}, nn:{w:10,h:10}},"58":{front:{w:31,h:36}, back:{w:31,h:36}, half:{w:25.5,h:15.5}, full:{w:26,h:29}, nn:{w:10,h:10}},"60":{front:{w:32,h:37}, back:{w:32,h:37}, half:{w:26,h:16}, full:{w:26,h:29}, nn:{w:10,h:10}}};
var sizeDB = defaultSizes; 
var selectedCSVPath = "";
var selectedFolderPath = "";
var startTime = 0;

function sendPostRequest(url, payload) {
    return new Promise(function(resolve, reject) {
        try {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", url, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            var data = JSON.parse(xhr.responseText);
                            resolve(data);
                        } catch(e) {
                            reject(new Error("Invalid JSON response"));
                        }
                    } else {
                        reject(new Error("Request failed with status " + xhr.status));
                    }
                }
            };
            xhr.onerror = function() {
                reject(new Error("Network error"));
            };
            xhr.send(JSON.stringify(payload));
        } catch(e) {
            reject(e);
        }
    });
}

document.addEventListener("DOMContentLoaded", async function() {
    loadDatabase();
    loadDefaults(); 
    updateUsageDisplay(); 
    
    // Theme Switch
    document.getElementById("btnThemeToggle").onclick = function() {
        document.body.classList.toggle("light-tool");
    };
    
    // Toggle Config Content
    document.getElementById("btnToggleConfig").onclick = function() {
        var content = document.getElementById("configContent");
        var icon = document.getElementById("btnToggleConfig");
        content.classList.toggle("hidden-control");
        icon.classList.toggle("collapsed");
    };

    document.getElementById("exportFormat").addEventListener("change", updateUIOptions);

    // --- 🤖 3-TAB LOGIC 🤖 ---
    var tabs = ["Run", "Edit", "Help"];
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
    document.getElementById("tabHelp").onclick = function() { switchTab("Help"); };

    // FiveNest Web Studio 1-Click Send
    if (document.getElementById("btnSendToFiveNest")) {
        document.getElementById("btnSendToFiveNest").onclick = exportAndSendToFiveNest;
    }
    if (document.getElementById("btnTagFront")) {
        document.getElementById("btnTagFront").onclick = function() { tagSelectionAs("front"); };
        document.getElementById("btnTagBack").onclick = function() { tagSelectionAs("back"); };
        document.getElementById("btnTagLeftSlv").onclick = function() { tagSelectionAs("sleeve_left"); };
        document.getElementById("btnTagRightSlv").onclick = function() { tagSelectionAs("sleeve_right"); };
        document.getElementById("btnTagCollar").onclick = function() { tagSelectionAs("collar"); };
    }

    // Select CSV
    document.getElementById("btnCSV").addEventListener("click", function() {
        try {
            var cst = new ActiveXObject("CorelScriptTools");
            var path = cst.GetFileBox("CSV Files (*.csv)|*.csv|Text Files (*.txt)|*.txt", "Select CSV File", 0);
            if (path) {
                selectedCSVPath = path;
                var parts = path.split(/[\\\/]/);
                var fName = parts[parts.length - 1];
                document.getElementById("lblCSV").innerText = fName;
                document.getElementById("lblCSV").style.color = "#4CAF50";
                log("CSV Set: " + path);
            }
        } catch(e) {
            log("CSV Selection Error: " + e.message);
        }
    });

    // Select Output Folder
    document.getElementById("btnFolder").addEventListener("click", function() {
        try {
            var shell = new ActiveXObject("Shell.Application");
            var folder = shell.BrowseForFolder(0, "Select Output Folder", 0x0040 | 0x0010 | 0x0001, 17);
            if (folder) {
                selectedFolderPath = folder.Self.Path;
                var parts = selectedFolderPath.split(/[\\\/]/);
                var fName = parts[parts.length - 1] || parts[parts.length - 2] || "Output";
                document.getElementById("lblFolder").innerText = fName;
                document.getElementById("lblFolder").style.color = "#4CAF50";
                log("Output Folder Set: " + selectedFolderPath);
            }
        } catch(e) {
            log("Folder Selection Error: " + e.message);
        }
    });
    
    document.getElementById("btnValidate").onclick = validateCSV; 
    document.getElementById("btnRun").onclick = runEngine;
    document.getElementById("btnSetDefault").onclick = saveDefaults; 
    document.getElementById("btnClearLog").onclick = function() { document.getElementById("logArea").innerText = "Ready."; };
    
    var sel = document.getElementById("sizeSelector");
    Object.keys(sizeDB).forEach(function(k) {
        var o = document.createElement("option");
        o.value = k;
        o.innerText = "Size " + k;
        sel.appendChild(o);
    });
    sel.addEventListener("change", loadSizeToUI);
    document.getElementById("btnSaveDB").addEventListener("click", saveSizeFromUI);

    // --- Activate / Logout Button ---
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
            details: "When **Blank Kit** is checked, the plugin bypasses name and number layers during front/back exports. This is ideal for generating stock team wear."
        },
        {
            title: "A4-Back Print",
            keywords: ["a4", "back", "print", "only name", "only number"],
            summary: "A4-Back Print exports ONLY name & number details.",
            details: "When **A4-Back Print** is checked, the plugin outputs separate files containing *only* player names and numbers inside the `Name_Number` subdirectory."
        },
        {
            title: "Smart Mockup",
            keywords: ["mockup", "mockups", "smart mockup", "preview"],
            summary: "Smart Mockup automatically generates preview images of your designs.",
            details: "When **Smart Mockup** is checked, the plugin automatically toggles the mockup template background groups and saves JPG previews of the designs in a designated `Mockups` subdirectory."
        },
        {
            title: "Save Default",
            keywords: ["save default", "default", "save def", "defaults"],
            summary: "Save Default remembers your current settings.",
            details: "Clicking **Save Default** saves your selected resolution, format, and compression settings to your local profile."
        },
        {
            title: "How to Run Automation",
            keywords: ["run", "how to use", "start", "automation", "begin", "steps"],
            summary: "Learn the step-by-step guide to run a batch automation job.",
            details: "To run a batch job:\n1. Choose your inputs: select a CSV file.\n2. Choose your outputs: select an output folder.\n3. Configure options (Format, Resolution).\n4. Click **Run Automation** to process everything."
        },
        {
            title: "Tiers & Usage Limits",
            keywords: ["limit", "usage", "subscription", "starter", "pro", "premium", "enterprise", "pcs", "free trial", "trial"],
            summary: "Learn about product limits and trial status.",
            details: "Usage limits are calculated *only* when a BACK layer is exported:\n- **Pro Plan**: 2,000 pcs limit.\n- New installations get a **7-Day Free Trial**."
        }
    ];

    function openWhatsAppSupport() {
        var email = localStorage.getItem("fivenest_license_email") || "Unregistered User";
        var clientName = document.getElementById("txtCustomerName") ? document.getElementById("txtCustomerName").value.trim() : "";
        var nameSection = clientName ? clientName + " (" + email + ")" : email;
        var rawMessage = "Hello Vilesh, I need assistance with FN Pro for CorelDRAW. (User: " + nameSection + ")";
        var encodedMessage = encodeURIComponent(rawMessage);
        var url = "https://wa.me/918879228710?text=" + encodedMessage;
        try {
            var sh = new ActiveXObject("WScript.Shell");
            sh.Run(url);
        } catch(e) {
            log("Failed to open support link: " + e.message);
        }
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
        var suggestionTitles = ["Blank Kit", "Smart Mockup", "A4-Back Print", "Limits & Trial", "How to Run"];
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
        appendMessage("Hi! I'm your FN Pro offline assistant for CorelDRAW. Ask me about any feature (e.g. Blank Kit, Smart Mockup) or click a suggestion below!", "assistant");
    };

    appendMessage("Hi! I'm your FN Pro offline assistant for CorelDRAW. Ask me about any feature (e.g. Blank Kit, Smart Mockup) or click a suggestion below!", "assistant");
    renderSuggestions();

    await checkLicenseSystem();
});

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
        nameNum: document.getElementById("chkNameNum").checked
    };
    localStorage.setItem("fivenest_config_pro", JSON.stringify(config));
    log("✅ Settings Saved as Default.");
}

function loadDefaults() {
    try {
        var str = localStorage.getItem("fivenest_config_pro");
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

function readLocalFile(path) {
    try {
        var fso = new ActiveXObject("Scripting.FileSystemObject");
        var file = fso.OpenTextFile(path, 1);
        var text = file.ReadAll();
        file.Close();
        return text;
    } catch(e) {
        log("File read error: " + e.message);
    }
    return "";
}

async function validateCSV() {
    if (!selectedCSVPath) { log("❌ Select a CSV first."); return; }
    try {
        var csvText = readLocalFile(selectedCSVPath);
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

function findShapeRecursive(container, name) {
    var search = name.toLowerCase();
    var traverse = function(shapes) {
        if (!shapes) return null;
        var count = shapes.Count;
        for (var i = 1; i <= count; i++) {
            var sh = shapes.Item(i);
            if (sh.Name.toLowerCase() === search) {
                return sh;
            }
            if (sh.Type === 7) { // cdrGroupShape
                var found = traverse(sh.Shapes);
                if (found) return found;
            }
        }
        return null;
    };
    return traverse(container.Shapes);
}

function updateTextShape(sh, text) {
    try {
        if (sh && sh.Type === 6) { // cdrTextShape
            sh.Text.Story = (text && text.replace(/^\s+|\s+$/g, '') !== "") ? text : " ";
        }
    } catch(e) {
        log("Error updating shape text: " + e.message);
    }
}

function updateShapeFont(sh, fontName) {
    try {
        if (sh && sh.Type === 6) { // cdrTextShape
            sh.Text.Story.Font = fontName;
        }
    } catch(e) {
        log("Font update warning: " + fontName);
    }
}

function compressTextWidth(sh, maxInches) {
    try {
        if (!sh) return;
        var currentWidth = sh.SizeWidth;
        if (currentWidth > maxInches) {
            sh.SizeWidth = maxInches;
        }
    } catch(e) {
        log("Error compressing shape: " + e.message);
    }
}

function toggleLayerVisibility(name, visible) {
    try {
        var app = window.external.Application;
        var doc = app.ActiveDocument;
        var layers = doc.ActivePage.Layers;
        var count = layers.Count;
        for (var i = 1; i <= count; i++) {
            var l = layers.Item(i);
            if (l.Name.toLowerCase() === name.toLowerCase()) {
                l.Visible = visible;
                return "SUCCESS";
            }
        }
        return "NOT_FOUND";
    } catch(e) {
        return "ERROR: " + e.message;
    }
}

function generateMockups(outputFolder, csvNameClean) {
    try {
        var app = window.external.Application;
        var doc = app.ActiveDocument;
        
        var layers = doc.ActivePage.Layers;
        var bgLayer = null;
        for (var idx = 1; idx <= layers.Count; idx++) {
            if (layers.Item(idx).Name.toLowerCase() === "mockup bg") {
                bgLayer = layers.Item(idx);
                break;
            }
        }
        if (!bgLayer) return "MOCKUP_BG_LAYER_NOT_FOUND";
        
        bgLayer.Visible = true;
        
        var shapes = bgLayer.Shapes;
        var count = shapes.Count;
        if (count > 0) {
            for (var i = 1; i <= count; i++) {
                var sh = shapes.Item(i);
                sh.Visible = true;
                for (var j = 1; j <= count; j++) {
                    if (j !== i) shapes.Item(j).Visible = false;
                }
                
                var cleanSuffix = sh.Name.replace(/[\/\\:*?"<>|]/g, "_");
                var fName = csvNameClean + " " + cleanSuffix + ".jpg";
                var fPath = outputFolder + "\\" + fName;
                doc.ExportBitmap(fPath, 774, 0, 4, 0, 0, 150, 150, 1, false, false, true, false, 0);
            }
            for (var k = 1; k <= count; k++) {
                shapes.Item(k).Visible = true;
            }
        }
        
        bgLayer.Visible = false;
        var pngName = csvNameClean + " NoBG.png";
        var pngPath = outputFolder + "\\" + pngName;
        doc.ExportBitmap(pngPath, 802, 0, 4, 0, 0, 150, 150, 1, false, true, true, false, 0);
        
        bgLayer.Visible = true;
        return "SUCCESS";
    } catch(e) {
        return "ERROR: " + e.message;
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
        alert("Limit has been exceeded. You need to upgrade to the Premium plan.");
        log("❌ Run blocked: Production limit exceeded.");
        return;
    }

    if (!selectedCSVPath || !selectedFolderPath) { log("Error: Select files first."); return; }
    
    var res = parseInt(document.getElementById("resolution").value);
    var format = document.getElementById("exportFormat").value.toLowerCase();
    var shouldEmbed = document.getElementById("chkEmbedProfile").checked;
    var useLZW = document.getElementById("chkLZW").checked;
    var doMockup = document.getElementById("chkMockup").checked;
    var sameFB = document.getElementById("chkSameFrontBack").checked;
    var doNameNum = document.getElementById("chkNameNum").checked;

    try {
        var app = window.external.Application;
        var doc = app.ActiveDocument;
        if (!doc) { alert("Please open a document in CorelDRAW first."); return; }

        var fso = new ActiveXObject("Scripting.FileSystemObject");
        var csvText = readLocalFile(selectedCSVPath);
        var csvRows = parseCSV(csvText);
        var dataRows = csvRows.slice(1).filter(function(r) { return r.length > 0 && r[0] !== ""; });
        
        if (dataRows.length === 0) { log("Error: Empty CSV or No Data"); return; }
        var headers = csvRows[0].map(function(h) { return h.toLowerCase().trim(); });

        var totalSteps = dataRows.length * 6; 
        if (doNameNum) totalSteps += dataRows.length;
        var currentStep = 0;
        
        document.getElementById("workCaption").classList.remove("hidden-control");
        startTime = Date.now();
        updateProgressUI(0, totalSteps);

        var frontDir = selectedFolderPath + "\\Front";
        var backDir = selectedFolderPath + "\\Back";
        var sleeveDir = selectedFolderPath + "\\Sleeve";
        var nnDir = doNameNum ? selectedFolderPath + "\\Name_Number" : null;

        if (!fso.FolderExists(frontDir)) fso.CreateFolder(frontDir);
        if (!fso.FolderExists(backDir)) fso.CreateFolder(backDir);
        if (!fso.FolderExists(sleeveDir)) fso.CreateFolder(sleeveDir);
        if (doNameNum && !fso.FolderExists(nnDir)) fso.CreateFolder(nnDir);

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
        var originalUnits = doc.Unit;
        doc.Unit = 1;

        for (var lmIndex = 0; lmIndex < layerModes.length; lmIndex++) {
            var lm = layerModes[lmIndex];
            log(">>> STARTING LAYER: " + lm.name);
            
            var checkVis = toggleLayerVisibility(lm.name, true);
            if (checkVis === "ERROR" || checkVis === "NOT_FOUND") {
                log("⚠️ Skipping " + lm.name + " (Layer not found/visible)");
                currentStep += dataRows.length;
                updateProgressUI(currentStep, totalSteps);
                continue;
            }

            for (var otherIdx = 0; otherIdx < layerModes.length; otherIdx++) {
                if (otherIdx !== lmIndex) {
                    toggleLayerVisibility(layerModes[otherIdx].name, false);
                }
            }

            var exportCount = 0;
            for (var i = 0; i < dataRows.length; i++) {
                var row = dataRows[i];
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

                if (lm.mode === "FRONT" || (lm.mode === "BACK" && sameFB)) {
                    finalName = activeSize + " = " + qty + " " + (lm.mode === "FRONT" ? "F" : "B");
                    if (sizeDB[activeSize]) { w = sizeDB[activeSize].front.w; h = sizeDB[activeSize].front.h; }
                    var shSize = findShapeRecursive(doc.ActivePage, "SIZE");
                    if (shSize) updateTextShape(shSize, activeSize);
                    var shQty = findShapeRecursive(doc.ActivePage, "quantity");
                    if (shQty) updateTextShape(shQty, qty);
                } else if (lm.mode === "BACK") {
                    finalName = row[0] + " B";
                    if (sizeDB[activeSize]) { w = sizeDB[activeSize].back.w; h = sizeDB[activeSize].back.h; }
                    for (var c = 0; c < headers.length; c++) {
                        var shObj = findShapeRecursive(doc.ActivePage, headers[c]);
                        if (shObj) updateTextShape(shObj, row[c] ? row[c] : " ");
                    }
                    var sleeveStyle = getVal(row, headers, "sleeve");
                    if (sleeveStyle) {
                        var shSl = findShapeRecursive(doc.ActivePage, "sleeve style");
                        if (shSl) updateTextShape(shSl, sleeveStyle);
                    }
                    var fontName = getVal(row, headers, "font");
                    if (fontName) {
                        var shName = findShapeRecursive(doc.ActivePage, "name");
                        if (shName) updateShapeFont(shName, fontName);
                        var shNum = findShapeRecursive(doc.ActivePage, "number");
                        if (shNum) updateShapeFont(shNum, fontName);
                    }
                    var limitName = parseFloat(document.getElementById("limitName").value) || 11;
                    var limitNum = parseFloat(document.getElementById("limitNum").value) || 9;
                    var shNameComp = findShapeRecursive(doc.ActivePage, "name");
                    if (shNameComp) compressTextWidth(shNameComp, limitName);
                    var shNumComp = findShapeRecursive(doc.ActivePage, "number");
                    if (shNumComp) compressTextWidth(shNumComp, limitNum);
                } else if (lm.mode === "NAMENUM") {
                    finalName = row[0] + " NN";
                    w = (sizeDB[activeSize] && sizeDB[activeSize].nn) ? sizeDB[activeSize].nn.w : 10;
                    h = (sizeDB[activeSize] && sizeDB[activeSize].nn) ? sizeDB[activeSize].nn.h : 10;
                    for (var c = 0; c < headers.length; c++) {
                        var shObj = findShapeRecursive(doc.ActivePage, headers[c]);
                        if (shObj) updateTextShape(shObj, row[c] ? row[c] : " ");
                    }
                    var fontName = getVal(row, headers, "font");
                    if (fontName) {
                        var shName = findShapeRecursive(doc.ActivePage, "name");
                        if (shName) updateShapeFont(shName, fontName);
                        var shNum = findShapeRecursive(doc.ActivePage, "number");
                        if (shNum) updateShapeFont(shNum, fontName);
                    }
                    var limitName = parseFloat(document.getElementById("limitName").value) || 11;
                    var limitNum = parseFloat(document.getElementById("limitNum").value) || 9;
                    var shNameComp = findShapeRecursive(doc.ActivePage, "name");
                    if (shNameComp) compressTextWidth(shNameComp, limitName);
                    var shNumComp = findShapeRecursive(doc.ActivePage, "number");
                    if (shNumComp) compressTextWidth(shNumComp, limitNum);
                } else if (lm.mode.indexOf("HALF") > -1 || lm.mode.indexOf("FULL") > -1) {
                    var suf = lm.mode.indexOf("HALF") > -1 ? (lm.mode.indexOf("_L") > -1 ? " HSL L" : " HSL R") : (lm.mode.indexOf("_L") > -1 ? " FSL L" : " FSL R");
                    finalName = activeSize + " = " + qty + suf;
                    w = lm.mode.indexOf("HALF") > -1 ? sizeDB[activeSize].half.w : sizeDB[activeSize].full.w;
                    h = lm.mode.indexOf("HALF") > -1 ? sizeDB[activeSize].half.h : sizeDB[activeSize].full.h;
                    var shSize = findShapeRecursive(doc.ActivePage, "SIZE");
                    if (shSize) updateTextShape(shSize, activeSize);
                    var shQty = findShapeRecursive(doc.ActivePage, "quantity");
                    if (shQty) updateTextShape(shQty, qty);
                }

                if (w > 0 && h > 0) {
                    var cleanFN = finalName.replace(/[\/\\:*?"<>|]/g, "_");
                    var outPath = lm.dir + "\\" + cleanFN + "." + format;
                    
                    doc.ActivePage.SetSize(w, h);
                    
                    var filter = 774;
                    if (format === "png") filter = 802;
                    else if (format === "tiff") filter = 772;
                    
                    var comp = 0;
                    if (format === "tiff" && useLZW) {
                        comp = 1;
                    }
                    
                    var isTransparent = (format === "png");
                    try {
                        doc.ExportBitmap(outPath, filter, 0, 4, 0, 0, res, res, 1, false, isTransparent, shouldEmbed, false, comp);
                        exportCount++;
                        
                        if (lm.mode === "BACK") {
                            var usage = parseInt(localStorage.getItem("fivenest_production_usage") || "0");
                            usage++;
                            localStorage.setItem("fivenest_production_usage", usage.toString());
                            updateUsageDisplay();
                            if (PRODUCTION_LIMIT > 0 && usage >= PRODUCTION_LIMIT) {
                                alert("Production limit of " + PRODUCTION_LIMIT + " pcs exceeded. Please upgrade.");
                                break;
                            }
                        }
                    } catch(exportErr) {
                        log("⚠️ Export failed for: " + finalName + " (" + exportErr.message + ")");
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

        if (doMockup) {
            log(">>> Generating Mockups...");
            var parts = selectedCSVPath.split(/[\\\/]/);
            var csvNameClean = parts[parts.length - 1].replace(/\.[^/.]+$/, "");
            var mockupResult = generateMockups(selectedFolderPath, csvNameClean);
            if (mockupResult === "SUCCESS") {
                log("✅ Mockups saved successfully.");
            } else {
                log("⚠️ Mockup generation warning: " + mockupResult);
            }
        }

        doc.Unit = originalUnits;

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
        nn: { w: parseFloat(document.getElementById("nnW").value), h: parseFloat(document.getElementById("nnH").value) }
    };
    localStorage.setItem("fivenest_sizes_pro", JSON.stringify(sizeDB));
    document.getElementById("saveMsg").innerText = "Saved!";
    setTimeout(function() { document.getElementById("saveMsg").innerText = ""; }, 1500);
}

function loadDatabase() {
    try {
        var str = localStorage.getItem("fivenest_sizes_pro");
        if (str) sizeDB = JSON.parse(str);
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
            var ax = new ActiveXObject("WScript.Network");
            var computerName = ax.ComputerName;
            hwid = "FN-" + computerName.toUpperCase().replace(/[^A-Z0-9]/g, '') + "-CDR";
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

        var data = await sendPostRequest(AUTH_SERVER_URL, payload);
        return { success: data.success, message: data.message || "Verification response received", isOffline: false };
    } catch(e) {
        return { success: false, message: "Could not connect to authentication server.", isOffline: true };
    }
}

function updateUsageDisplay() {
    var currentUsage = parseInt(localStorage.getItem("fivenest_production_usage") || "0");
    var tag = document.getElementById("versionTag");
    if (tag) {
        tag.innerText = "PRO V1.0 | Usage: " + currentUsage + "/" + PRODUCTION_LIMIT + " pcs";
    }
}

// --- 🌐 FIVENEST 1-CLICK STUDIO EXPORTER (OPTION B) ---

function tagSelectionAs(panelKey) {
    try {
        var app = window.external.Application;
        var doc = app.ActiveDocument;
        if (!doc) {
            alert("Please open an artwork document in CorelDRAW first.");
            return;
        }
        var sel = doc.ActiveSelection;
        if (!sel || sel.Shapes.Count === 0) {
            alert("Please select the " + panelKey + " shape or group in CorelDRAW first.");
            return;
        }
        var sh = sel.Shapes.Item(1);
        sh.Name = "FN_" + panelKey.toUpperCase();
        log("✅ Selected shape tagged as: " + panelKey + " (Name: " + sh.Name + ")");
    } catch(e) {
        log("❌ Error tagging selection: " + e.message);
    }
}

async function exportAndSendToFiveNest() {
    try {
        var app = window.external.Application;
        var doc = app.ActiveDocument;
        if (!doc) {
            alert("Please open an artwork document in CorelDRAW first.");
            return;
        }

        log("\n>>> 🚀 STARTING 1-CLICK EXPORT TO FIVENEST STUDIO...");
        var fso = new ActiveXObject("Scripting.FileSystemObject");
        var sh = new ActiveXObject("WScript.Shell");

        var tempBase = fso.GetSpecialFolder(2).Path; // %TEMP%
        var timestamp = Date.now();
        var tempExportDir = tempBase + "\\FiveNest_Export_" + timestamp;
        if (!fso.FolderExists(tempExportDir)) {
            fso.CreateFolder(tempExportDir);
        }

        var sleeveType = document.getElementById("selStudioSleeveType") ? document.getElementById("selStudioSleeveType").value : "half";
        log("Export Specs: Format = JPG | Color Profile = RGB (cdrRGBColorImage) | DPI = 300 | Sleeve = " + sleeveType);

        var cdrJPEG = 774;
        var cdrRGBColorImage = 4; // 24-bit RGB
        var res = 300; // 300 DPI
        var antiAlias = 1; // Normal Antialiasing
        var shouldEmbed = true; // Embed RGB color profile

        var panelDefs = [
            {
                key: "front",
                filename: "front.jpg",
                w: 22,
                h: 30,
                layerNames: ["Front", "front", "FRONT", "Front Layer"],
                tagNames: ["FN_FRONT", "FRONT", "front"]
            },
            {
                key: "back",
                filename: "back.jpg",
                w: 22,
                h: 30,
                layerNames: ["Back", "back", "BACK", "Back Layer"],
                tagNames: ["FN_BACK", "BACK", "back"]
            },
            {
                key: "sleeve_left",
                filename: "sleeve_left.jpg",
                w: 19,
                h: sleeveType === "full" ? 25 : 11,
                layerNames: [
                    sleeveType === "full" ? "Full Left SL" : "Half Left SL",
                    "Left Sleeve", "Sleeve Left", "Half Left SL", "Full Left SL", "Left SL", "HSL L", "FSL L"
                ],
                tagNames: ["FN_SLEEVE_LEFT", "SLEEVE_LEFT", "LEFT_SLEEVE", "left_sleeve"]
            },
            {
                key: "sleeve_right",
                filename: "sleeve_right.jpg",
                w: 19,
                h: sleeveType === "full" ? 25 : 11,
                layerNames: [
                    sleeveType === "full" ? "Full Right SL" : "Half Right SL",
                    "Right Sleeve", "Sleeve Right", "Half Right SL", "Full Right SL", "Right SL", "HSL R", "FSL R"
                ],
                tagNames: ["FN_SLEEVE_RIGHT", "SLEEVE_RIGHT", "RIGHT_SLEEVE", "right_sleeve"]
            },
            {
                key: "collar",
                filename: "collar.jpg",
                w: 18,
                h: 4.5,
                layerNames: ["Collar", "collar", "COLLAR", "Rib", "Neck", "Collar Band"],
                tagNames: ["FN_COLLAR", "COLLAR", "collar", "RIB", "rib"]
            }
        ];

        var origVis = {};
        var layers = doc.ActivePage.Layers;
        for (var l = 1; l <= layers.Count; l++) {
            var lyr = layers.Item(l);
            origVis[lyr.Name] = lyr.Visible;
        }

        var exportedCount = 0;
        var exportedList = [];

        function findLayerByCandidates(candidates) {
            for (var i = 0; i < candidates.length; i++) {
                var c = candidates[i].toLowerCase();
                for (var j = 1; j <= layers.Count; j++) {
                    var lItem = layers.Item(j);
                    if (lItem.Name.toLowerCase() === c || lItem.Name.toLowerCase().indexOf(c) > -1) {
                        return lItem;
                    }
                }
            }
            return null;
        }

        function findTaggedShape(candidates) {
            for (var i = 0; i < candidates.length; i++) {
                var shFound = findShapeRecursive(doc.ActivePage, candidates[i]);
                if (shFound) return shFound;
            }
            return null;
        }

        function findPageByCandidates(candidates) {
            for (var p = 1; p <= doc.Pages.Count; p++) {
                var page = doc.Pages.Item(p);
                for (var i = 0; i < candidates.length; i++) {
                    if (page.Name.toLowerCase().indexOf(candidates[i].toLowerCase()) > -1) {
                        return page;
                    }
                }
            }
            return null;
        }

        for (var pIdx = 0; pIdx < panelDefs.length; pIdx++) {
            var pDef = panelDefs[pIdx];
            var outPath = tempExportDir + "\\" + pDef.filename;
            var success = false;

            var taggedShape = findTaggedShape(pDef.tagNames);
            if (taggedShape) {
                try {
                    doc.ClearSelection();
                    taggedShape.Selected = true;
                    doc.ExportBitmap(outPath, cdrJPEG, 1 /* cdrSelection */, cdrRGBColorImage, 0, 0, res, res, antiAlias, false, false, shouldEmbed, false, 0);
                    success = true;
                    log("✓ Exported " + pDef.key + " (Tagged Shape) to JPG 300 DPI RGB");
                } catch(e) {
                    log("⚠️ Failed export selection for " + pDef.key + ": " + e.message);
                }
            }

            if (!success) {
                var targetLayer = findLayerByCandidates(pDef.layerNames);
                if (targetLayer) {
                    try {
                        for (var k = 1; k <= layers.Count; k++) {
                            layers.Item(k).Visible = false;
                        }
                        targetLayer.Visible = true;
                        doc.ActivePage.SetSize(pDef.w, pDef.h);

                        doc.ExportBitmap(outPath, cdrJPEG, 0 /* cdrCurrentPage */, cdrRGBColorImage, 0, 0, res, res, antiAlias, false, false, shouldEmbed, false, 0);
                        success = true;
                        log("✓ Exported " + pDef.key + " (Layer: " + targetLayer.Name + ") to JPG 300 DPI RGB");
                    } catch(e) {
                        log("⚠️ Failed layer export for " + pDef.key + ": " + e.message);
                    }
                }
            }

            if (!success && doc.Pages.Count > 1) {
                var targetPage = findPageByCandidates(pDef.layerNames);
                if (targetPage) {
                    try {
                        var origPage = doc.ActivePage;
                        targetPage.Activate();
                        doc.ExportBitmap(outPath, cdrJPEG, 0 /* cdrCurrentPage */, cdrRGBColorImage, 0, 0, res, res, antiAlias, false, false, shouldEmbed, false, 0);
                        origPage.Activate();
                        success = true;
                        log("✓ Exported " + pDef.key + " (Page: " + targetPage.Name + ") to JPG 300 DPI RGB");
                    } catch(e) {
                        log("⚠️ Failed page export for " + pDef.key + ": " + e.message);
                    }
                }
            }

            if (success) {
                exportedCount++;
                exportedList.push(pDef.key + " (" + pDef.filename + ")");
            } else if (pDef.key !== "collar") {
                log("ℹ️ Panel '" + pDef.key + "' not detected by layer name or tag.");
            }
        }

        for (var r = 1; r <= layers.Count; r++) {
            var rLyr = layers.Item(r);
            if (origVis[rLyr.Name] !== undefined) {
                rLyr.Visible = origVis[rLyr.Name];
            }
        }

        if (exportedCount === 0) {
            alert("No panels could be exported!\n\nPlease make sure:\n1. Your layers are named 'Front', 'Back', 'Half Left SL', 'Half Right SL', etc.\nOR\n2. Select your panel graphics and click the 'Tag Selection' buttons (Front, Back, etc.).");
            return;
        }

        var manifestPath = tempExportDir + "\\manifest.json";
        var manifestContent = JSON.stringify({
            generator: "FiveNest CorelDRAW Plugin",
            version: "5.2",
            exportDate: new Date().toISOString(),
            format: "JPG",
            colorProfile: "RGB",
            dpi: 300,
            sleeveType: sleeveType,
            exportedPanels: exportedList
        }, null, 2);
        
        var mFile = fso.CreateTextFile(manifestPath, true);
        mFile.Write(manifestContent);
        mFile.Close();

        var desktopPath = sh.SpecialFolders("Desktop");
        var docTitle = (doc.FileName && doc.FileName !== "") ? doc.FileName.replace(/\.[^/.]+$/, "") : "FiveNest_Jersey";
        docTitle = docTitle.replace(/[\/\\:*?"<>|]/g, "_");
        var zipPath = desktopPath + "\\" + docTitle + "_FiveNest.zip";

        log("📦 Creating pre-formatted ZIP package on Desktop: " + zipPath);
        var psCmd = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path \'' + tempExportDir + '\\*\' -DestinationPath \'' + zipPath + '\' -Force"';
        sh.Run(psCmd, 0, true);

        log("🌐 Launching FiveNest Web Studio in browser...");
        var studioUrl = "https://canvas.fivenest.com";
        sh.Run(studioUrl);

        try {
            sh.Run('explorer.exe /select,"' + zipPath + '"');
        } catch(e) {}

        log("🎉 SUCCESS! Exported " + exportedCount + " panels in 300 DPI RGB JPG.");
        log("ZIP Saved: " + zipPath);
        alert(
            "🎉 1-Click Export Complete!\n\n" +
            "• " + exportedCount + " panels exported in JPG (RGB @ 300 DPI):\n" +
            exportedList.map(function(n) { return "  ✔ " + n; }).join("\n") + "\n\n" +
            "• ZIP Package saved to Desktop:\n  " + zipPath + "\n\n" +
            "• FiveNest Studio is opening in your browser!\n" +
            "Simply DRAG & DROP the ZIP file into the studio to load your 3D jersey model & print roll."
        );

    } catch(err) {
        log("❌ Export to FiveNest failed: " + err.message);
        alert("Error during 1-click export: " + err.message);
    }
}
