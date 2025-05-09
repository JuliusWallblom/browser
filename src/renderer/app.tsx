import { APP_NAME } from "@/constants/app";
import { TabsProvider, useTabs } from "@/contexts/tabs-context";
import { WebviewProvider, useWebviews } from "@/contexts/webview-context";
import {
	PreferencesProvider,
	usePreferences,
} from "@/contexts/preferences-context";
import { useTheme } from "@/hooks/use-theme";
import {
	SHORTCUTS,
	useKeyboardShortcuts,
} from "@/hooks/use-keyboard-shortcuts";
import { usePanels } from "@/hooks/use-panels";
import { useCallback, useEffect, useRef, useState } from "react";
import { Route, MemoryRouter as Router, Routes } from "react-router-dom";
import AITab from "./components/ai-tab";
import { BrowserContent } from "./components/browser-content";
import StreamsTab from "./components/streams-tab";
import { TitleBar } from "./components/title-bar";
import { HorizontalTabs } from "./components/horizontal-tabs";
import type { Tab } from "@/types/tab";

function Browser() {
	const { tabs, activeTabId, updateTab, addTab, removeTab, setActiveTab } =
		useTabs();
	const { webviewRefs } = useWebviews();
	const { isLeftPanelOpen, setLeftPanelOpen } = usePanels();
	const { tabLayout, isLoadingPreferences } = usePreferences();
	const { isLoadingTheme } = useTheme();
	const [currentUrl, setCurrentUrl] = useState("");
	const urlInputRef = useRef<HTMLInputElement>(null);
	const [shouldFocusAndSelect, setShouldFocusAndSelect] = useState(false);
	const [blurUrlBarOnNextActivation, setBlurUrlBarOnNextActivation] =
		useState(false);

	// Initialize first tab if none exist
	useEffect(() => {
		if (tabs.length === 0) {
			addTab({
				url: "about:blank",
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
					updateTab(activeTabId, {
						isLoading: true,
					});
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
							isLoading: true,
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
							const webview = webviewRefs.current.get(activeTabId);

							if (!webview) {
								console.error(
									`[Renderer] Back from settings: No webview found for activeTabId: ${activeTabId}. Falling back to about:blank state.`,
								);
								updateTab(activeTabId, {
									url: "about:blank",
									title: "New Tab",
									isLoading: false,
									canGoBack: false,
									canGoForward: false,
									canGoForwardToSettings: true,
									view: "webview",
									previousUrl: undefined,
									isError: true,
									favicon: undefined,
								});
								return;
							}

							if (urlToLoad === "about:blank") {
								updateTab(activeTabId, {
									url: "about:blank",
									title: "New Tab",
									isLoading: false,
									canGoBack: false,
									canGoForward: false,
									canGoForwardToSettings: true,
									view: "webview",
									previousUrl: undefined,
									isError: false,
									favicon: undefined,
								});
								// Ensure the webview actually displays about:blank
								webview.src = "about:blank";
							} else {
								// Navigating back to a real URL from settings
								updateTab(activeTabId, {
									url: urlToLoad,
									isLoading: true,
									canGoForwardToSettings: true,
									view: "webview",
									previousUrl: undefined,
									isError: false,
									// Title, favicon, canGoBack, canGoForward will be updated by did-navigate
								});

								webview.loadURL(urlToLoad).catch((err) => {
									console.error(
										`[Renderer] Back from settings: Failed to load URL ${urlToLoad}:`,
										err,
									);
									updateTab(activeTabId, {
										isLoading: false,
										isError: true,
										title: "Navigation Error",
									});
								});

								try {
									webview.setAudioMuted(false);
								} catch (err) {
									console.error(
										"[Renderer] Back from settings: Error unmuting media:",
										err,
									);
								}
							}
						} else {
							// Standard "back" not from settings page
							const webview = webviewRefs.current.get(activeTabId);
							if (webview?.canGoBack()) {
								// Check if webview exists and can go back
								webview.goBack();
							}
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

			const handleLoadURLError = (err: Error, tabId: string | null) => {
				console.error("Failed to load URL:", err);
				if (tabId) {
					updateTab(tabId, {
						isLoading: false,
						isError: true,
						canGoForwardToSettings: false,
						// title: "Navigation Error" // Optional: consider updating title
					});
				}
			};

			if (urlToLoad === `${APP_NAME.toLowerCase()}://settings`) {
				const settingsWebView = webviewRefs.current.get(activeTabId);

				const transitionToSettingsUI = () => {
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
				};

				if (activeTab.url === "about:blank" || !settingsWebView) {
					console.log(
						`[Renderer] Settings: Current URL is '${activeTab.url}' or no webview. Transitioning to settings UI directly for tabId: ${activeTabId}.`,
					);
					transitionToSettingsUI();
				} else {
					console.log(
						`[Renderer] Settings: Current URL is '${activeTab.url}'. Attempting media ops before transitioning for tabId: ${activeTabId}.`,
					);
					try {
						settingsWebView.setAudioMuted(true);
						settingsWebView.executeJavaScript(
							"document.querySelectorAll('video, audio').forEach(media => media.pause())",
						);
						transitionToSettingsUI();
					} catch (err) {
						if (
							err instanceof Error &&
							err.message?.includes("The WebView must be attached")
						) {
							console.warn(
								`[Renderer] Settings: Webview for '${activeTab.url}' (tabId: ${activeTabId}) not fully ready for media ops. Deferring. Error: ${err.message}`,
							);
							const handleDomReadyForSettingsMediaOps = () => {
								settingsWebView.removeEventListener(
									"dom-ready",
									handleDomReadyForSettingsMediaOps,
								);
								const currentWV = webviewRefs.current.get(activeTabId);
								if (currentWV === settingsWebView) {
									try {
										currentWV.setAudioMuted(true);
										currentWV.executeJavaScript(
											"document.querySelectorAll('video, audio').forEach(media => media.pause())",
										);
									} catch (deferredErr) {
										console.error(
											`[Renderer] Settings: Error in deferred media ops for tabId: ${activeTabId}:`,
											deferredErr,
										);
									}
								} else {
									console.warn(
										`[Renderer] Settings: Webview changed for tabId: ${activeTabId} before deferred media ops could run.`,
									);
								}
								transitionToSettingsUI();
							};
							settingsWebView.addEventListener(
								"dom-ready",
								handleDomReadyForSettingsMediaOps,
							);
						} else {
							console.error(
								`[Renderer] Settings: Non-DOM-ready error during media ops for tabId: ${activeTabId}:`,
								err,
							);
							transitionToSettingsUI();
						}
					}
				}
				return; // End of settings navigation path
			}

			const webview = webviewRefs.current.get(activeTabId);

			const tabUpdates: Partial<Tab> = {
				url: urlToLoad,
				isLoading: true,
				canGoForwardToSettings: false,
				view: "webview",
			};

			updateTab(activeTabId, tabUpdates);

			if (!webview) return;

			try {
				if (webview.src === "") {
					webview.src = "about:blank";
					const handleDomReady = () => {
						webview.removeEventListener("dom-ready", handleDomReady);
						// Check if the webview instance is still valid and refers to the active tab's webview
						const currentWebviewStillMatches =
							webviewRefs.current.get(activeTabId) === webview;
						if (currentWebviewStillMatches) {
							webview
								.loadURL(urlToLoad)
								.catch((err) => handleLoadURLError(err, activeTabId));
						} else {
							console.warn(
								"Webview became invalid or changed before URL could be loaded in dom-ready.",
							);
							if (activeTabId) {
								updateTab(activeTabId, {
									isLoading: false,
									isError: true,
									canGoForwardToSettings: false,
									title: "Navigation Cancelled",
								});
							}
						}
					};
					webview.addEventListener("dom-ready", handleDomReady);
				} else {
					webview
						.loadURL(urlToLoad)
						.catch((err) => handleLoadURLError(err, activeTabId));
				}
			} catch (err) {
				console.error("Error preparing to load URL:", err);
				updateTab(activeTabId, {
					isLoading: false,
					isError: true,
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
		// Clear selection in the current URL bar (soon to be old tab)
		if (urlInputRef.current) {
			urlInputRef.current.selectionStart = urlInputRef.current.selectionEnd;
		}

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

	const handleCloseTab = useCallback(() => {
		if (activeTabId) {
			setBlurUrlBarOnNextActivation(true);
			removeTab(activeTabId);
		}
	}, [activeTabId, removeTab]);

	const handleNextTab = useCallback(() => {
		if (!activeTabId) return;
		const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
		const nextIndex = (currentIndex + 1) % tabs.length;
		const nextTab = tabs[nextIndex];
		if (nextTab) {
			setActiveTab(nextTab.id);
		}
	}, [activeTabId, tabs, setActiveTab]);

	const handlePreviousTab = useCallback(() => {
		if (!activeTabId) return;
		const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
		const previousIndex = (currentIndex - 1 + tabs.length) % tabs.length;
		const previousTab = tabs[previousIndex];
		if (previousTab) {
			setActiveTab(previousTab.id);
		}
	}, [activeTabId, tabs, setActiveTab]);

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
			handler: () => {
				if (tabLayout === "vertical") {
					setLeftPanelOpen(!isLeftPanelOpen);
				}
			},
		},
	]);

	useEffect(() => {
		if (activeTab) {
			setCurrentUrl(activeTab.url);

			if (blurUrlBarOnNextActivation) {
				if (urlInputRef.current) {
					urlInputRef.current.blur();
					urlInputRef.current.selectionStart = urlInputRef.current.selectionEnd;
				}
				setBlurUrlBarOnNextActivation(false);
			}
		}
	}, [activeTab, blurUrlBarOnNextActivation]);

	// Effect to signal main process when ready to show
	useEffect(() => {
		console.log(
			`[Renderer] Loading states: preferences=${isLoadingPreferences}, theme=${isLoadingTheme}`,
		);
		if (!isLoadingPreferences && !isLoadingTheme) {
			console.log(
				"[Renderer] Both loaded. Sending 'renderer-ready-to-show' IPC message via window.electron.",
			);
			if (window.electron?.ipcRenderer) {
				window.electron.ipcRenderer.sendMessage(
					"renderer-ready-to-show" as Parameters<
						typeof window.electron.ipcRenderer.sendMessage
					>[0],
				);
			} else {
				console.error(
					"[Renderer] window.electron.ipcRenderer is not available. Check preload script exposure.",
				);
			}
		}
	}, [isLoadingPreferences, isLoadingTheme]);

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

			{tabLayout === "horizontal" && <HorizontalTabs onAddTab={handleAddTab} />}

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
				{tabLayout === "vertical" && <StreamsTab />}
				<BrowserContent />
				<AITab />
			</div>
		</div>
	);
}

export default function App() {
	return (
		<Router>
			<PreferencesProvider>
				<WebviewProvider>
					<TabsProvider>
						<Routes>
							<Route path="/" element={<Browser />} />
						</Routes>
					</TabsProvider>
				</WebviewProvider>
			</PreferencesProvider>
		</Router>
	);
}
