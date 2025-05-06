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
import type { Tab } from "@/types/tab";

function Browser() {
	const { theme, cycleTheme } = useTheme();
	const { tabs, activeTabId, updateTab, addTab, removeTab } = useTabs();
	const { webviewRefs } = useWebviews();
	const { isLeftPanelOpen, setLeftPanelOpen } = usePanels();
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
				view: "webview",
			});
		}
	}, [addTab, tabs.length]);

	const activeTab = tabs.find((tab) => tab.id === activeTabId);

	const handleNavigationClick = useCallback(
		(action: "back" | "forward" | "refresh" | "stop" | "force-refresh") => {
			if (!activeTabId || !activeTab) return;

			const wasOnSettingsPage =
				activeTab.view === "settings" ||
				activeTab.url === `${APP_NAME.toLowerCase()}://settings`;

			const webview = webviewRefs.current.get(activeTabId);
			if (!webview) return;

			try {
				if (
					wasOnSettingsPage &&
					(action === "refresh" ||
						action === "stop" ||
						action === "force-refresh")
				) {
					updateTab(activeTabId, { canGoForwardToSettings: false });
					return;
				}

				if (action === "forward") {
					const currentUrlBeforeNavToSettings = activeTab.url;

					if (activeTab.canGoForwardToSettings && !webview.canGoForward()) {
						updateTab(activeTabId, {
							url: `${APP_NAME.toLowerCase()}://settings`,
							title: "Settings",
							favicon: undefined,
							isLoading: false,
							isError: false,
							canGoForward: false,
							canGoForwardToSettings: false,
							canGoBack: true,
							view: "settings",
							previousUrl:
								currentUrlBeforeNavToSettings ===
								`${APP_NAME.toLowerCase()}://settings`
									? activeTab.previousUrl
									: currentUrlBeforeNavToSettings,
						});
						return;
					}

					if (webview.canGoForward()) {
						webview.goForward();
						updateTab(activeTabId, {
							canGoForwardToSettings: false,
							view: "webview",
						});
					} else {
						console.log(
							"Forward clicked, but no place to go (webview or settings).",
						);
					}
					return;
				}

				switch (action) {
					case "back":
						if (wasOnSettingsPage) {
							const urlToLoad = activeTab.previousUrl || "about:blank";
							const tabUpdates: Partial<Tab> = {
								url: urlToLoad,
								isLoading: urlToLoad !== "about:blank",
								canGoForwardToSettings: true,
								previousUrl: undefined,
								view: "webview",
							};

							if (urlToLoad === "about:blank") {
								tabUpdates.canGoBack = false;
								tabUpdates.canGoForward = false;
								tabUpdates.title = "New Tab";
								tabUpdates.favicon = undefined;
							}

							updateTab(activeTabId, tabUpdates);

							requestAnimationFrame(() => {
								const currentWebview = webviewRefs.current.get(activeTabId);
								if (currentWebview) {
									try {
										if (urlToLoad === "about:blank") {
											currentWebview.stop();
											currentWebview.loadURL("about:blank");
										} else {
											currentWebview.loadURL(urlToLoad);
										}
									} catch (err) {
										console.error(`Error loading ${urlToLoad} (rAF):`, err);
										if (tabUpdates.isLoading) {
											updateTab(activeTabId, { isLoading: false });
										}
									}
								}
							});
						} else {
							updateTab(activeTabId, {
								isLoading: false,
							});
							webview.goBack();
						}
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
		[activeTabId, activeTab, updateTab, webviewRefs],
	);

	const handleUrlChange = useCallback((url: string) => {
		setCurrentUrl(url);
	}, []);

	const navigateToUrl = useCallback(
		(urlToLoad: string) => {
			if (!activeTabId || !activeTab) return;

			if (urlToLoad === `${APP_NAME.toLowerCase()}://settings`) {
				const currentUrlBeforeNav = activeTab.url;
				updateTab(activeTabId, {
					url: `${APP_NAME.toLowerCase()}://settings`,
					title: "Settings",
					isLoading: false,
					isError: false,
					favicon: undefined,
					canGoForward: false,
					canGoBack: true,
					canGoForwardToSettings: false,
					view: "settings",
					previousUrl:
						currentUrlBeforeNav === `${APP_NAME.toLowerCase()}://settings`
							? activeTab.previousUrl
							: currentUrlBeforeNav,
				});
				return;
			}

			const tabUpdates: Partial<Tab> = {
				url: urlToLoad,
				isLoading: true,
				canGoForwardToSettings: false,
				view: "webview",
			};

			updateTab(activeTabId, tabUpdates);

			const webview = webviewRefs.current.get(activeTabId);
			if (!webview) return;

			try {
				if (webview.src === "") {
					webview.src = "about:blank";
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
		[activeTabId, activeTab, updateTab, webviewRefs],
	);

	const handleUrlSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (!activeTabId) return;

			const input = (e.target as HTMLFormElement)
				?.elements?.[0] as HTMLInputElement;
			const value = input?.value || currentUrl;
			const trimmedInput = value.trim();

			if (!trimmedInput) {
				navigateToUrl("about:blank");
				return;
			}

			const isUrl =
				/^([a-zA-Z]+:\/\/)|(localhost(:\d+)?$)|([\w-]+\.[\w-]+)/.test(
					trimmedInput,
				);
			const finalUrl = isUrl
				? trimmedInput.includes("://") || trimmedInput.startsWith("localhost")
					? trimmedInput
					: `https://${trimmedInput}`
				: `https://www.google.com/search?q=${encodeURIComponent(trimmedInput)}`;

			input?.blur();
			navigateToUrl(finalUrl);
		},
		[activeTabId, currentUrl, navigateToUrl],
	);

	const handleAddTab = useCallback(() => {
		setCurrentUrl("");
		addTab({
			url: "about:blank",
			title: "New Tab",
			isLoading: false,
			canGoBack: false,
			canGoForward: false,
			webviewKey: Date.now(),
			view: "webview",
		});
		setShouldFocusAndSelect(true);
	}, [addTab]);

	useEffect(() => {
		if (shouldFocusAndSelect) {
			setShouldFocusAndSelect(false);
		}
	}, [shouldFocusAndSelect]);

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
				currentView={activeTab?.view || "webview"}
				canGoBack={activeTab?.canGoBack || false}
				canGoForward={activeTab?.canGoForward || false}
				canGoForwardToSettings={activeTab?.canGoForwardToSettings || false}
				onUrlChange={handleUrlChange}
				onUrlSubmit={handleUrlSubmit}
				onNavigate={handleNavigationClick}
				onAddTab={handleAddTab}
				urlInputRef={urlInputRef}
				shouldFocusAndSelect={shouldFocusAndSelect}
				isError={activeTab?.isError || false}
				onNavigateTo={navigateToUrl}
			/>

			<div className="flex-1 flex overflow-hidden">
				<StreamsTab />
				<BrowserContent />
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
