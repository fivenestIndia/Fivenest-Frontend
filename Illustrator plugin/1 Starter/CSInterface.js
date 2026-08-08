/**
 * Lightweight CSInterface.js wrapper for Adobe CEP panels.
 * Bridges HTML UI with native ExtendScript host.
 */
function CSInterface() {}

CSInterface.prototype.evalScript = function(script, callback) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.evalScript(script, callback || function() {});
    } else {
        console.warn("CEP environment not detected. Mocking evalScript:", script);
        if (callback) callback("mock_success");
    }
};

CSInterface.prototype.getHostEnvironment = function() {
    if (window.__adobe_cep__) {
        return JSON.parse(window.__adobe_cep__.getHostEnvironment());
    }
    return { appName: "ILST", appVersion: "28.0.0", appLocale: "en_US" };
};

CSInterface.prototype.closeExtension = function() {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.closeExtension();
    } else {
        window.close();
    }
};

CSInterface.prototype.dispatchEvent = function(event) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.dispatchEvent(event);
    }
};

CSInterface.prototype.addEventListener = function(type, listener, obj) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.addEventListener(type, listener, obj);
    }
};

CSInterface.prototype.removeEventListener = function(type, listener, obj) {
    if (window.__adobe_cep__) {
        window.__adobe_cep__.removeEventListener(type, listener, obj);
    }
};

CSInterface.prototype.openURLInDefaultBrowser = function(url) {
    if (window.cep && window.cep.util) {
        window.cep.util.openURLInDefaultBrowser(url);
    } else {
        window.open(url, "_blank");
    }
};

CSInterface.prototype.getApplicationID = function() {
    var env = this.getHostEnvironment();
    return env ? env.appName : "ILST";
};
