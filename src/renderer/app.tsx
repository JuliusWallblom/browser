import { DEFAULT_URL } from "@/constants/app";
import { TabsProvider, useTabs } from "@/contexts/tabs-context";
import { WebviewProvider, useWebviews } from "@/contexts/webview-context";
import {
	SHORTCUTS,
	useKeyboardShortcuts,
} from "@/hooks/use-keyboard-shortcuts";
import { useTheme } from "@/hooks/use-theme";
import { usePanels } from "@/hooks/use-panels";
import { useCallback, useEffect, useRef, useState } from "react";
import { Route, MemoryRouter as Router, Routes } from "react-router-dom";
import AITab from "./components/ai-tab";
import { BrowserContent } from "./components/browser-content";
import StreamsTab from "./components/streams-tab";
import { TitleBar } from "./components/title-bar";

type View = "webview" | "settings";

function Browser() {
	const { theme, cycleTheme } = useTheme();
	const { tabs, activeTabId, updateTab, addTab, removeTab } = useTabs();
	const { webviewRefs } = useWebviews();
	const { isLeftPanelOpen, setLeftPanelOpen } = usePanels();
	const [currentView, setCurrentView] = useState<View>("webview");
	const [currentUrl, setCurrentUrl] = useState("");
	const urlInputRef = useRef<HTMLInputElement>(null);
	const [shouldFocusAndSelect, setShouldFocusAndSelect] = useState(false);

	// Initialize first tab if none exist
	useEffect(() => {
		if (tabs.length === 0) {
			addTab({
				url: "",
				title: "New Tab",
				isLoading: false,
				canGoBack: false,
				canGoForward: false,
				webviewKey: Date.now(),
			});
		}
	}, [addTab, tabs.length]);

	const handleNavigationClick = useCallback(
		(action: "back" | "forward" | "refresh" | "stop" | "force-refresh") => {
			if (!activeTabId) return;

			const webview = webviewRefs.current.get(activeTabId);
			if (!webview) return;

			try {
				switch (action) {
					case "back":
						webview.goBack();
						updateTab(activeTabId, { isLoading: true });
						break;
					case "forward":
						webview.goForward();
						updateTab(activeTabId, { isLoading: true });
						break;
					case "refresh":
						webview.reload();
						updateTab(activeTabId, { isLoading: true });
						break;
					case "force-refresh":
						webview.reloadIgnoringCache();
						updateTab(activeTabId, { isLoading: true });
						break;
					case "stop":
						webview.stop();
						window.electron.webview.stopLoading();
						updateTab(activeTabId, { isLoading: false });
						break;
				}

				// Update navigation state after action
				if (action !== "stop") {
					setTimeout(() => {
						updateTab(activeTabId, {
							canGoBack: webview.canGoBack(),
							canGoForward: webview.canGoForward(),
						});
					}, 100);
				}
			} catch (err) {
				console.error("Navigation action failed:", err);
				if (action === "stop") {
					updateTab(activeTabId, { isLoading: false });
				}
			}
		},
		[activeTabId, updateTab, webviewRefs],
	);

	const handleUrlChange = useCallback((url: string) => {
		setCurrentUrl(url);
	}, []);

	const handleUrlSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (!activeTabId) return;

			const input = currentUrl.trim();

			// Special handling for empty input - load about:blank
			if (!input) {
				updateTab(activeTabId, { url: "about:blank", isLoading: false });
				return;
			}

			// Check if input is a URL or search term
			const isUrl =
				/^[a-zA-Z]+:\/\//.test(input) || // Has protocol
				/^[\w-]+\.([\w-]+\.)*[\w-]+$/.test(input) || // Domain name pattern
				/^localhost(:\d+)?$/.test(input); // Localhost

			// Create the URL to load
			const urlToLoad = isUrl
				? !input.includes("://")
					? `https://${input}`
					: input
				: `https://www.google.com/search?q=${encodeURIComponent(input)}`;

			updateTab(activeTabId, { url: urlToLoad, isLoading: true });

			const webview = webviewRefs.current.get(activeTabId);
			if (!webview) return;

			try {
				// For new tabs or blank pages, first load about:blank
				if (webview.src === "") {
					webview.src = "about:blank";
					// Wait for dom-ready before loading the actual URL
					const handleDomReady = () => {
						webview.loadURL(urlToLoad).catch((err) => {
							console.error("Failed to load URL:", err);
							updateTab(activeTabId, { isLoading: false });
						});
						webview.removeEventListener("dom-ready", handleDomReady);
					};
					webview.addEventListener("dom-ready", handleDomReady);
				} else {
					// For already initialized webviews, load directly
					webview.loadURL(urlToLoad).catch((err) => {
						console.error("Failed to load URL:", err);
						updateTab(activeTabId, { isLoading: false });
					});
				}
			} catch (err) {
				console.error("Error loading URL:", err);
				updateTab(activeTabId, { isLoading: false });
			}
		},
		[activeTabId, currentUrl, updateTab, webviewRefs],
	);

	const handleViewChange = useCallback((view: View) => {
		setCurrentView(view);
	}, []);

	const handleAddTab = useCallback(() => {
		// Update URL state first
		setCurrentUrl("");
		addTab({
			url: "about:blank",
			title: "New Tab",
			isLoading: false,
			canGoBack: false,
			canGoForward: false,
			webviewKey: Date.now(),
		});
		// Set focus flag after URL is updated
		setShouldFocusAndSelect(true);
	}, [addTab]);

	// Reset shouldFocusAndSelect after it's been handled
	useEffect(() => {
		if (shouldFocusAndSelect) {
			setShouldFocusAndSelect(false);
		}
	}, [shouldFocusAndSelect]);

	// Focus and select URL bar text when switching to a blank tab
	useEffect(() => {
		if (currentUrl === "") {
			setTimeout(() => {
				urlInputRef.current?.focus();
				urlInputRef.current?.select();
			}, 0);
		}
	}, [currentUrl]);

	const handleCloseTab = useCallback(() => {
		if (activeTabId) {
			removeTab(activeTabId);
		}
	}, [activeTabId, removeTab]);

	const handleNextTab = useCallback(() => {
		if (!activeTabId) return;
		const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
		const nextIndex = (currentIndex + 1) % tabs.length;
		const nextTab = tabs[nextIndex];
		if (nextTab) {
			updateTab(nextTab.id, {});
		}
	}, [activeTabId, tabs, updateTab]);

	const handlePreviousTab = useCallback(() => {
		if (!activeTabId) return;
		const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
		const previousIndex = (currentIndex - 1 + tabs.length) % tabs.length;
		const previousTab = tabs[previousIndex];
		if (previousTab) {
			updateTab(previousTab.id, {});
		}
	}, [activeTabId, tabs, updateTab]);

	const handleFocusUrlBar = useCallback(() => {
		urlInputRef.current?.focus();
		urlInputRef.current?.select();
	}, []);

	// Set up keyboard shortcuts
	useKeyboardShortcuts([
		{ ...SHORTCUTS.NEW_TAB, handler: handleAddTab },
		{ ...SHORTCUTS.CLOSE_TAB, handler: handleCloseTab },
		{ ...SHORTCUTS.NEXT_TAB, handler: handleNextTab },
		{ ...SHORTCUTS.PREVIOUS_TAB, handler: handlePreviousTab },
		{ ...SHORTCUTS.FOCUS_URL_BAR, handler: handleFocusUrlBar },
		{
			...SHORTCUTS.TOGGLE_STREAMS_TAB,
			handler: () => setLeftPanelOpen(!isLeftPanelOpen),
		},
	]);

	const activeTab = tabs.find((tab) => tab.id === activeTabId);

	// Keep currentUrl in sync with active tab's URL
	useEffect(() => {
		if (activeTab) {
			setCurrentUrl(activeTab.url);
		}
	}, [activeTab]);

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
				url={currentUrl}
				favicon={activeTab?.favicon}
				isLoading={activeTab?.isLoading || false}
				currentView={currentView}
				theme={theme}
				canGoBack={activeTab?.canGoBack || false}
				canGoForward={activeTab?.canGoForward || false}
				onUrlChange={handleUrlChange}
				onUrlSubmit={handleUrlSubmit}
				onNavigate={handleNavigationClick}
				onThemeChange={cycleTheme}
				onViewChange={handleViewChange}
				onAddTab={handleAddTab}
				urlInputRef={urlInputRef}
				shouldFocusAndSelect={shouldFocusAndSelect}
				isError={activeTab?.isError || false}
			/>

			<div className="flex-1 flex overflow-hidden">
				<StreamsTab />
				<BrowserContent
					currentView={currentView}
					onViewChange={handleViewChange}
				/>
				<AITab />
			</div>
		</div>
	);
}

export default function App() {
	return (
		<Router>
			<TabsProvider>
				<WebviewProvider>
					<Routes>
						<Route path="/" element={<Browser />} />
					</Routes>
				</WebviewProvider>
			</TabsProvider>
		</Router>
	);
}
