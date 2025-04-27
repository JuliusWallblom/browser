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
	// You can add any webview-specific initialization here
});
