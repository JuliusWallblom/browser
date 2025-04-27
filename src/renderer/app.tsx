import { usePanels } from "@/hooks/use-panels";
import { useTheme } from "@/hooks/use-theme";
import { useCallback, useEffect, useRef, useState } from "react";
import { Route, MemoryRouter as Router, Routes } from "react-router-dom";
import AITab from "./components/ai-tab";
import { SidePanel } from "./components/side-panel";
import StreamsTab from "./components/streams-tab";
import { TitleBar } from "./components/title-bar";
import { SettingsPage } from "./pages/settings";

function Browser() {
	const [inputUrl, setInputUrl] = useState("https://www.google.com");
	const [favicon, setFavicon] = useState<string>();
	const [isWebviewReady, setIsWebviewReady] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [canGoBack, setCanGoBack] = useState(false);
	const [canGoForward, setCanGoForward] = useState(false);
	const [currentView, setCurrentView] = useState<"webview" | "settings">(
		"webview",
	);
	const [webviewKey, setWebviewKey] = useState(0);
	const { theme, cycleTheme } = useTheme();
	const {
		isLeftPanelOpen,
		isRightPanelOpen,
		setLeftPanelOpen,
		setRightPanelOpen,
	} = usePanels();
	const webviewRef = useRef<Electron.WebviewTag | null>(null);
	const lastValidUrlRef = useRef("https://www.google.com");
	const lastNavigationTimeRef = useRef(0);
	const NAVIGATION_DEBOUNCE_MS = 100; // Prevent multiple navigations within 100ms

	const updateFavicon = useCallback(async (webview: Electron.WebviewTag) => {
		try {
			// Wait a short moment to ensure the page is ready
			await new Promise((resolve) => setTimeout(resolve, 100));

			const faviconUrl = await webview.executeJavaScript(`
				(function() {
					// First try to find explicit favicon links
					const favicon = document.querySelector('link[rel~="icon"], link[rel="shortcut icon"]') ||
						Array.from(document.getElementsByTagName('link'))
							.find(link => link.href && (link.href.includes('favicon') || link.href.includes('icon')));
					
					if (favicon && favicon.href) {
						return favicon.href;
					}

					// If no explicit favicon, try the root favicon.ico
					const rootFavicon = new URL('/favicon.ico', window.location.href).href;
					
					// Create an Image to test if the favicon exists
					return new Promise((resolve) => {
						const img = new Image();
						img.onload = () => resolve(rootFavicon);
						img.onerror = () => resolve('');
						img.src = rootFavicon;
					});
				})()
			`);

			if (faviconUrl) {
				setFavicon(faviconUrl);
			} else {
				setFavicon(undefined);
			}
		} catch (error) {
			console.error("Error updating favicon:", error);
			setFavicon(undefined);
		}
	}, []);

	useEffect(() => {
		if (currentView === "webview") {
			const webview = webviewRef.current;
			if (webview) {
				webview.addEventListener("dom-ready", () => {
					setIsWebviewReady(true);
				});
			}
		}
	}, [currentView]);

	const handleUrlSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!inputUrl.trim()) {
			return;
		}

		let formattedUrl = inputUrl;

		// Handle merlin:// URLs
		if (formattedUrl.startsWith("merlin://")) {
			setIsLoading(true);
			try {
				// Get the path after merlin://
				const path = formattedUrl.replace("merlin://", "").trim();

				switch (path) {
					case "settings":
						setCurrentView("settings");
						setInputUrl(formattedUrl);
						break;
					default:
						console.error("Unknown merlin:// path:", path);
				}
			} catch (err) {
				console.error("Error handling merlin URL:", err);
			}
			setIsLoading(false);
			return;
		}

		// Format the URL if needed
		const hasProtocol = formattedUrl.match(/^[a-zA-Z]+:\/\//);
		const isDomain = formattedUrl.match(
			/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/,
		);
		const containsDot = formattedUrl.includes(".");
		const containsSpace = formattedUrl.includes(" ");

		if (!hasProtocol) {
			if (isDomain || (!containsSpace && containsDot)) {
				formattedUrl = `https://${formattedUrl}`;
			} else {
				formattedUrl = `https://www.google.com/search?q=${encodeURIComponent(formattedUrl)}`;
			}
		}

		// Switch to webview first if coming from settings
		if (currentView === "settings") {
			setCurrentView("webview");
			// Give the webview a moment to initialize
			setTimeout(() => {
				const webview = webviewRef.current;
				if (webview) {
					setInputUrl(formattedUrl);
					webview.loadURL(formattedUrl).catch((err) => {
						console.error("Failed to load URL after settings transition:", err);
						setIsLoading(false);
					});
				}
			}, 100);
			return;
		}

		// Handle regular URLs in webview mode
		const webview = webviewRef.current;
		if (webview) {
			try {
				// Set the URL immediately to update UI
				setInputUrl(formattedUrl);

				// Load the URL
				webview.loadURL(formattedUrl).catch((err) => {
					console.error("Failed to load URL:", err);
					setIsLoading(false);
				});
			} catch (err) {
				console.error("Error loading URL:", err);
				setIsLoading(false);
			}
		} else {
			console.error("No webview reference available");
		}
	};

	const handleNavigationClick = (
		action: "back" | "forward" | "refresh" | "stop",
	) => {
		const webview = webviewRef.current;
		if (!webview || !isWebviewReady) {
			return;
		}

		try {
			switch (action) {
				case "back":
					webview.goBack();
					break;
				case "forward":
					webview.goForward();
					break;
				case "refresh":
					webview.reload();
					break;
				case "stop": {
					// Call our aggressive stop method
					window.electron.webview.stopLoading();

					// Also try to stop the webview directly
					webview.stop();

					setIsLoading(false);
					break;
				}
			}
		} catch (err) {
			console.error("Error during navigation:", err);
			if (action === "stop") {
				setIsLoading(false);
			}
		}
	};

	// Add function to update navigation state
	const updateNavigationState = () => {
		const webview = webviewRef.current;
		if (webview) {
			setCanGoBack(webview.canGoBack());
			setCanGoForward(webview.canGoForward());
		}
	};

	// Initialize webview
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const webview = webviewRef.current;

		if (!webview || currentView !== "webview") {
			return;
		}

		const handleDOMReady = () => {
			setIsWebviewReady(true);
			updateNavigationState();
		};

		const handleDidStartLoading = () => {
			console.log("Resource loading started");
		};

		const handleDidStopLoading = () => {
			console.log("Resource loading stopped");
		};

		const handleDidFinishLoad = () => {
			console.log("Page finished loading");
			setIsLoading(false);
			if (webview) {
				const newUrl = webview.getURL();
				if (newUrl && newUrl !== "about:blank") {
					updateFavicon(webview);
					updateNavigationState();
				}
			}
		};

		const handleDidStartNavigation = (
			event: Electron.DidStartNavigationEvent,
		) => {
			if (event.isMainFrame && event.url !== "about:blank") {
				const now = Date.now();
				if (now - lastNavigationTimeRef.current > NAVIGATION_DEBOUNCE_MS) {
					console.log("Main frame navigation started");
					setIsLoading(true);
					setInputUrl(event.url);
					setFavicon(undefined);
					lastNavigationTimeRef.current = now;
				} else {
					console.log("Ignoring duplicate navigation event");
				}
			}
		};

		const handleDidNavigate = (event: Electron.DidNavigateEvent) => {
			if (event.url !== "about:blank") {
				setInputUrl(event.url);
			}
		};

		const handleDidNavigateInPage = (
			event: Electron.DidNavigateInPageEvent,
		) => {
			if (event.url !== "about:blank") {
				setInputUrl(event.url);
				setIsLoading(false);
				if (webview) {
					updateNavigationState();
				}
			}
		};

		const handleDidFailLoad = (event: Electron.DidFailLoadEvent) => {
			console.error("Webview did fail load", {
				url: event.validatedURL,
				isLoading: isLoading,
			});
			if (event.validatedURL !== "about:blank") {
				setInputUrl(event.validatedURL);
				setFavicon(undefined);
				if (isWebviewReady && webview) {
					updateFavicon(webview);
				}
			}
		};

		const handleDidAttach = () => {
			console.log("Webview attached");
		};

		webview.addEventListener("dom-ready", handleDOMReady);
		webview.addEventListener("did-start-loading", handleDidStartLoading);
		webview.addEventListener("did-stop-loading", handleDidStopLoading);
		webview.addEventListener("did-finish-load", handleDidFinishLoad);
		webview.addEventListener("did-navigate", handleDidNavigate);
		webview.addEventListener("did-navigate-in-page", handleDidNavigateInPage);
		webview.addEventListener("did-start-navigation", handleDidStartNavigation);
		webview.addEventListener("did-fail-load", handleDidFailLoad);
		webview.addEventListener("did-attach", handleDidAttach);

		return () => {
			webview.removeEventListener("dom-ready", handleDOMReady);
			webview.removeEventListener("did-start-loading", handleDidStartLoading);
			webview.removeEventListener("did-stop-loading", handleDidStopLoading);
			webview.removeEventListener("did-finish-load", handleDidFinishLoad);
			webview.removeEventListener("did-navigate", handleDidNavigate);
			webview.removeEventListener(
				"did-navigate-in-page",
				handleDidNavigateInPage,
			);
			webview.removeEventListener(
				"did-start-navigation",
				handleDidStartNavigation,
			);
			webview.removeEventListener("did-fail-load", handleDidFailLoad);
			webview.removeEventListener("did-attach", handleDidAttach);
		};
	}, [updateFavicon, currentView, isLoading, isWebviewReady]);

	return (
		<div className="flex flex-col h-screen">
			<style>
				{`
					.draggable {
						-webkit-app-region: drag;
					}
					.non-draggable {
						-webkit-app-region: no-drag;
					}
				`}
			</style>

			<TitleBar
				url={inputUrl}
				favicon={favicon}
				isLoading={isLoading}
				currentView={currentView}
				theme={theme}
				canGoBack={canGoBack}
				canGoForward={canGoForward}
				onUrlChange={setInputUrl}
				onUrlSubmit={handleUrlSubmit}
				onNavigate={handleNavigationClick}
				onThemeChange={cycleTheme}
			/>

			<div className="flex-1 flex overflow-hidden">
				<StreamsTab />
				{currentView === "webview" ? (
					<webview
						key={webviewKey}
						ref={webviewRef}
						src={lastValidUrlRef.current}
						className="flex-1 bg-background-primary"
						webpreferences="contextIsolation=yes, nodeIntegration=no, sandbox=yes, javascript=yes, webSecurity=yes"
						partition="persist:main"
						httpreferrer="strict-origin-when-cross-origin"
					/>
				) : currentView === "settings" ? (
					<div className="flex-1 bg-background-primary overflow-auto">
						<SettingsPage />
					</div>
				) : null}
				<AITab />
			</div>
		</div>
	);
}

export default function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Browser />} />
			</Routes>
		</Router>
	);
}
