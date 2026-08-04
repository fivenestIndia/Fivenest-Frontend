const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');

console.log("Launching Opera in debug headless mode...");
const opera = spawn(
  "/Applications/Opera.app/Contents/MacOS/Opera",
  [
    "--headless",
    "--disable-gpu",
    "--remote-debugging-port=9222",
    "--no-first-run",
    "--no-default-browser-check",
    "--user-data-dir=/tmp/opera-debug-profile-" + Date.now(),
    "https://www.fivenest.in/studio"
  ]
);

// Wait 5 seconds for page load
setTimeout(() => {
  console.log("Fetching target list from http://localhost:9222/json/list...");
  http.get('http://localhost:9222/json/list', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const targets = JSON.parse(data);
        const target = targets.find(t => t.url.includes('fivenest.in') || t.type === 'page');
        if (!target) {
          console.error("No suitable page target found.");
          cleanup();
          return;
        }

        console.log(`Connecting to WebSocket: ${target.webSocketDebuggerUrl}`);
        const ws = new WebSocket(target.webSocketDebuggerUrl);

        ws.on('open', () => {
          console.log("WebSocket connected. Enabling protocols...");
          ws.send(JSON.stringify({ id: 1, method: "Console.enable" }));
          ws.send(JSON.stringify({ id: 2, method: "Log.enable" }));
          ws.send(JSON.stringify({ id: 3, method: "Runtime.enable" }));
          ws.send(JSON.stringify({ id: 4, method: "Network.enable" }));

          // Trigger "3D View" click
          setTimeout(() => {
            console.log("Triggering 3D View button click...");
            ws.send(JSON.stringify({
              id: 10,
              method: "Runtime.evaluate",
              params: {
                expression: `(() => {
                  const buttons = Array.from(document.querySelectorAll('button'));
                  const btn3d = buttons.find(b => b.textContent.includes('3D View'));
                  if (btn3d) {
                    btn3d.click();
                    return 'Button found and clicked';
                  } else {
                    return 'Button NOT found';
                  }
                })()`,
                returnByValue: true
              }
            }));
          }, 2000);
        });

        ws.on('message', (message) => {
          const payload = JSON.parse(message.toString());
          const { id, method, params, result } = payload;
          
          if (id === 10) {
            console.log(`[CLICK RESULT]:`, result.result.value);
          }

          if (method === 'Runtime.consoleAPICalled') {
            const args = params.args.map(a => a.value !== undefined ? a.value : (a.description || JSON.stringify(a)));
            console.log(`[CONSOLE ${params.type.toUpperCase()}]:`, ...args);
          } else if (method === 'Runtime.exceptionThrown') {
            const details = params.exceptionDetails;
            const errorMsg = details.exception ? (details.exception.description || details.exception.value) : details.text;
            console.error(`[UNCAUGHT EXCEPTION]: ${errorMsg}`);
          } else if (method === 'Log.entryAdded') {
            const entry = params.entry;
            console.log(`[LOG ${entry.level.toUpperCase()}]: ${entry.text}`);
          } else if (method === 'Network.responseReceived') {
            const response = params.response;
            if (response.url.includes('tshirt.glb') || response.url.includes('TShirt_NRM.jpg')) {
              console.log(`[NETWORK RESPONSE]: ${response.url} Status: ${response.status} MIME: ${response.mimeType}`);
            }
          } else if (method === 'Network.loadingFailed') {
            console.error(`[NETWORK FAIL]: ${params.errorText}`);
          }
        });

        ws.on('error', (err) => {
          console.error("WebSocket error:", err);
        });

      } catch (err) {
        console.error("Failed to parse targets JSON:", err);
        cleanup();
      }
    });
  }).on('error', (err) => {
    console.error("HTTP error fetching targets:", err);
    cleanup();
  });
}, 5000);

function cleanup() {
  console.log("Killing Opera process...");
  opera.kill();
  process.exit(0);
}

// Run for 35 seconds to allow full load
setTimeout(cleanup, 35000);
