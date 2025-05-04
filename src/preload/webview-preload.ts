// Set Content Security Policy
const csp = {
	"default-src": ["'self'", "https:", "http:", "data:", "ws:", "wss:"],
	"script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
	"style-src": ["'self'", "'unsafe-inline'"],
	"img-src": ["'self'", "data:", "https:", "http:"],
	"connect-src": ["'self'", "https:", "http:", "ws:", "wss:"],
};

const cspString = Object.entries(csp)
	.map(([key, values]) => `${key} ${values.join(" ")}`)
	.join("; ");

// Add CSP meta tag
const meta = document.createElement("meta");
meta.httpEquiv = "Content-Security-Policy";
meta.content = cspString;
document.head.appendChild(meta);

// Expose a minimal set of APIs to the webview
window.addEventListener("DOMContentLoaded", () => {
	console.log(
		"[webview-preload] DOMContentLoaded - Setting up keyboard event listener",
	);

	// Forward only our custom keyboard shortcuts to the main window
	window.addEventListener(
		"keydown",
		(event) => {
			console.log("[webview-preload] Keydown event:", {
				key: event.key,
				metaKey: event.metaKey,
				ctrlKey: event.ctrlKey,
				altKey: event.altKey,
				shiftKey: event.shiftKey,
				target: event.target,
				currentTarget: event.currentTarget,
			});

			// Only forward our custom shortcuts
			if (event.metaKey || event.ctrlKey) {
				const key = event.key.toLowerCase();
				// List of our custom shortcuts
				const customShortcuts = ["t", "w", "[", "]", "l"];

				console.log(
					"[webview-preload] Checking if shortcut should be forwarded:",
					{
						key,
						isCustomShortcut: customShortcuts.includes(key),
					},
				);

				if (customShortcuts.includes(key)) {
					console.log(
						"[webview-preload] Forwarding custom shortcut to main window",
					);
					// Create a custom event that will be handled by the main process
					window.parent.postMessage(
						{
							type: "forward-shortcut",
							event: {
								key: event.key,
								metaKey: event.metaKey,
								ctrlKey: event.ctrlKey,
								altKey: event.altKey,
								shiftKey: event.shiftKey,
							},
						},
						"*",
					);

					// Prevent the webview from handling these specific shortcuts
					event.preventDefault();
					event.stopPropagation();
					console.log(
						"[webview-preload] Prevented default behavior for custom shortcut",
					);
				} else {
					console.log(
						"[webview-preload] Allowing native shortcut to pass through:",
						key,
					);
				}
			}
		},
		true,
	);
});
