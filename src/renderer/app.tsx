import { APP_NAME, DEFAULT_URL } from "@/constants/app";
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

			const activeTab = tabs.find((tab) => tab.id === activeTabId);
			if (!activeTab) return;

			// Store if the current view/url is settings *before* potential navigation
			const wasOnSettingsPage =
				currentView === "settings" ||
				activeTab.url === `${APP_NAME.toLowerCase()}://settings`;

			const webview = webviewRefs.current.get(activeTabId);
			if (!webview) return;

			try {
				// If on settings page, ignore refresh/stop actions
				if (
					wasOnSettingsPage &&
					(action === "refresh" ||
						action === "stop" ||
						action === "force-refresh")
				) {
					// Also reset the forward flag if refreshing from settings (shouldn't happen often)
					updateTab(activeTabId, { canGoForwardToSettings: false });
					return;
				}

				// Handle forward action specifically if the target is the settings page
				if (
					action === "forward" &&
					activeTab.canGoForwardToSettings &&
					!webview.canGoForward()
				) {
					const currentUrlBeforeNav = activeTab.url;
					updateTab(activeTabId, {
						url: `${APP_NAME.toLowerCase()}://settings`,
						title: "Settings",
						favicon: undefined,
						isLoading: false,
						isError: false,
						canGoForward: false,
						canGoForwardToSettings: false,
						canGoBack: true,
						previousUrl:
							currentUrlBeforeNav === `${APP_NAME.toLowerCase()}://settings`
								? activeTab.previousUrl
								: currentUrlBeforeNav,
					});
					setCurrentView("settings");
					return;
				}

				switch (action) {
					case "back":
						if (wasOnSettingsPage) {
							// Navigate back from settings MANUALLY using previousUrl
							const urlToLoad = activeTab.previousUrl || "about:blank";
							updateTab(activeTabId, {
								url: urlToLoad,
								isLoading: urlToLoad !== "about:blank",
								canGoForwardToSettings: true, // Allow forwarding back to settings
								previousUrl: undefined, // Clear previous URL
							});
							setCurrentView("webview");

							// Use requestAnimationFrame to ensure view is updated before loading URL
							requestAnimationFrame(() => {
								// Re-check webview ref in case tab changed rapidly
								const currentWebview = webviewRefs.current.get(activeTabId);
								if (currentWebview && urlToLoad !== "about:blank") {
									try {
										currentWebview.loadURL(urlToLoad);
									} catch (err) {
										console.error("Error loading previous URL (rAF):", err);
										updateTab(activeTabId, { isLoading: false });
									}
								} else if (currentWebview && urlToLoad === "about:blank") {
									try {
										currentWebview.loadURL("about:blank");
									} catch (err) {
										// No action needed if about:blank is already loaded
									}
								}
							});
						} else {
							// Normal back navigation
							webview.goBack();
							console.log("HEREEEEEEE:", activeTab.previousUrl);

							updateTab(activeTabId, {
								url: activeTab.previousUrl || "about:blank",
								isLoading: true,
								// No change to canGoForwardToSettings here
							});
						}
						break;
					case "forward":
						// Note: This block is only reached if canGoForwardToSettings was false
						webview.goForward();
						updateTab(activeTabId, {
							isLoading: true,
							canGoForwardToSettings: false,
						});
						break;
					case "refresh":
						webview.reload();
						updateTab(activeTabId, {
							isLoading: true,
							canGoForwardToSettings: false,
						});
						break;
					case "force-refresh":
						webview.reloadIgnoringCache();
						updateTab(activeTabId, {
							isLoading: true,
							canGoForwardToSettings: false,
						});
						break;
					case "stop":
						webview.stop();
						window.electron.webview.stopLoading();
						updateTab(activeTabId, { isLoading: false });
						break;
				}
			} catch (err) {
				console.error("Navigation action failed:", err);
				if (action === "stop") {
					updateTab(activeTabId, { isLoading: false });
				}
			}
		},
		[activeTabId, updateTab, webviewRefs, currentView, tabs],
	);

	const handleUrlChange = useCallback((url: string) => {
		setCurrentUrl(url);
	}, []);

	const navigateToUrl = useCallback(
		(urlToLoad: string) => {
			if (!activeTabId) return;
			const activeTab = tabs.find((tab) => tab.id === activeTabId);
			if (!activeTab) return;

			// Special handling for settings
			if (urlToLoad === `${APP_NAME.toLowerCase()}://settings`) {
				const currentUrlBeforeNav = activeTab.url;
				updateTab(activeTabId, {
					url: `${APP_NAME.toLowerCase()}://settings`,
					title: "Settings",
					isLoading: false,
					isError: false,
					favicon: undefined,
					canGoForward: false, // Explicitly set
					canGoBack: true, // Explicitly set
					canGoForwardToSettings: false, // Reset flag
					previousUrl:
						currentUrlBeforeNav === `${APP_NAME.toLowerCase()}://settings`
							? activeTab.previousUrl
							: currentUrlBeforeNav,
				});
				setCurrentView("settings");
				return;
			}

			// If currently in settings view, switch back to webview before navigating
			if (currentView === "settings") {
				setCurrentView("webview");
			}

			// Proceed with loading the URL in the webview
			updateTab(activeTabId, {
				url: urlToLoad,
				isLoading: true,
				canGoForwardToSettings: false, // Reset flag for any new navigation
			});

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
							updateTab(activeTabId, {
								isLoading: false,
								canGoForwardToSettings: false,
							});
						});
						webview.removeEventListener("dom-ready", handleDomReady);
					};
					webview.addEventListener("dom-ready", handleDomReady);
				} else {
					// For already initialized webviews, load directly
					webview.loadURL(urlToLoad).catch((err) => {
						console.error("Failed to load URL:", err);
						updateTab(activeTabId, {
							isLoading: false,
							canGoForwardToSettings: false,
						});
					});
				}
			} catch (err) {
				console.error("Error loading URL:", err);
				updateTab(activeTabId, {
					isLoading: false,
					canGoForwardToSettings: false,
				});
			}
		},
		[activeTabId, updateTab, webviewRefs, currentView, tabs],
	);

	const handleUrlSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (!activeTabId) return;

			// Get the input value from the form event
			const input = (e.target as HTMLFormElement)
				?.elements?.[0] as HTMLInputElement;
			const value = input?.value || currentUrl;
			const trimmedInput = value.trim();

			// Special handling for empty input - load about:blank
			if (!trimmedInput) {
				updateTab(activeTabId, { url: "about:blank", isLoading: true });
				return;
			}

			// Determine the final URL (handle search, add protocol)
			const isUrl =
				/^([a-zA-Z]+:\/\/)|(localhost(:\d+)?$)|([\w-]+\.[\w-]+)/.test(
					trimmedInput,
				);
			const finalUrl = isUrl
				? trimmedInput.includes("://") || trimmedInput.startsWith("localhost")
					? trimmedInput
					: `https://${trimmedInput}`
				: `https://www.google.com/search?q=${encodeURIComponent(trimmedInput)}`;

			// Blur the input
			input?.blur();

			// Navigate using the centralized function
			navigateToUrl(finalUrl);
		},
		[activeTabId, currentUrl, updateTab, navigateToUrl],
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
				activeUrl={activeTab?.url || ""}
				favicon={activeTab?.favicon}
				isLoading={activeTab?.isLoading || false}
				currentView={currentView}
				theme={theme}
				canGoBack={activeTab?.canGoBack || false}
				canGoForward={activeTab?.canGoForward || false}
				canGoForwardToSettings={activeTab?.canGoForwardToSettings || false}
				onUrlChange={handleUrlChange}
				onUrlSubmit={handleUrlSubmit}
				onNavigate={handleNavigationClick}
				onThemeChange={cycleTheme}
				onViewChange={handleViewChange}
				onAddTab={handleAddTab}
				urlInputRef={urlInputRef}
				shouldFocusAndSelect={shouldFocusAndSelect}
				isError={activeTab?.isError || false}
				onNavigateTo={navigateToUrl}
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
