import { cn } from "@/lib/utils";
import { historyService } from "@/lib/history";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Tab } from "../../types/tab";
import { ErrorPage } from "./error-page";
import { APP_NAME } from "@/constants/app";

type View = "webview" | "settings";

interface WebViewProps {
	tab: Tab;
	isActive: boolean;
	onWebviewRef: (webview: Electron.WebviewTag | null, tabId: string) => void;
	updateTab: (tabId: string, updates: Partial<Tab>) => void;
}

export function WebView({
	tab,
	isActive,
	onWebviewRef,
	updateTab,
}: WebViewProps) {
	const webviewRef = useRef<Electron.WebviewTag | null>(null);
	const isReadyRef = useRef(false);
	const initialLoadDoneRef = useRef(false);
	const isRefreshingRef = useRef(false);
	const isMainFrameLoadingRef = useRef(false);
	const [errorEvent, setErrorEvent] =
		useState<Electron.DidFailLoadEvent | null>(null);

	const handleWebviewRef = useCallback(
		(webview: Electron.WebviewTag | null) => {
			if (webview !== webviewRef.current) {
				webviewRef.current = webview;
				onWebviewRef(webview, tab.id);
			}
		},
		[tab.id, onWebviewRef],
	);

	const updateNavigationState = useCallback(() => {
		const webview = webviewRef.current;
		if (!webview) return;

		updateTab(tab.id, {
			canGoBack: webview.canGoBack(),
			canGoForward: webview.canGoForward(),
		});
	}, [tab.id, updateTab]);

	const updateFavicon = useCallback(async () => {
		const webview = webviewRef.current;
		if (!webview) return;

		try {
			const faviconUrl = await webview.executeJavaScript(`
				(function() {
					// Try to find favicon from link elements
					const icons = Array.from(document.querySelectorAll('link[rel*="icon"]'));
					
					// Sort by size preference if specified
					const sortedIcons = icons.sort((a, b) => {
						const sizeA = parseInt(a.getAttribute('sizes')?.split('x')[0] || '0');
						const sizeB = parseInt(b.getAttribute('sizes')?.split('x')[0] || '0');
						return sizeB - sizeA;
					});

					// Get the best icon or fall back to Google's favicon service
					const bestIcon = sortedIcons[0]?.href;
					if (bestIcon) {
						return new URL(bestIcon, window.location.href).href;
					}
					
					// If no icons found, use Google's favicon service
					return window.location.hostname ? 'https://www.google.com/s2/favicons?sz=32&domain=' + window.location.hostname : null;
				})()
			`);

			if (typeof faviconUrl === "string") {
				updateTab(tab.id, { favicon: faviconUrl });
				// Also update history entry with the new favicon
				const url = webview.getURL();
				if (url && url !== "about:blank") {
					historyService.addVisit(url, tab.title || url, faviconUrl);
				}
				return true;
			}
			updateTab(tab.id, { favicon: undefined });
			return false;
		} catch (error) {
			console.error("Error updating favicon:", error);
			updateTab(tab.id, { favicon: undefined });
			return false;
		}
	}, [tab.id, tab.title, updateTab]);

	// Effect to track refresh state
	useEffect(() => {
		if (tab.isLoading) {
			isRefreshingRef.current = true;
		}
	}, [tab.isLoading]);

	useEffect(() => {
		const webview = webviewRef.current;
		if (!webview) return;

		// Reset state when URL changes
		// initialLoadDoneRef.current = false; // Moved to handleDidNavigate

		const handleDomReady = () => {
			console.log("[WebView] dom-ready", {
				url: webview.getURL(),
				isReady: isReadyRef.current,
				initialLoadDone: initialLoadDoneRef.current,
				isRefreshing: isRefreshingRef.current,
			});

			isReadyRef.current = true;
			updateNavigationState();
		};

		const handleDidStartLoading = () => {
			const webview = webviewRef.current;
			if (!webview) return;

			const currentUrl = isReadyRef.current ? webview.getURL() : tab.url;
			console.log("[WebView] did-start-loading", {
				url: currentUrl,
				isReady: isReadyRef.current,
				initialLoadDone: initialLoadDoneRef.current,
				isRefreshing: isRefreshingRef.current,
			});

			// Loading state is now primarily handled by did-navigate and did-stop-loading
			// for main frame. isRefreshingRef handles explicit refreshes.
			if (isRefreshingRef.current && !initialLoadDoneRef.current) {
				updateTab(tab.id, {
					isLoading: true,
					isError: false,
				});
			}
		};

		const handleDidStopLoading = async () => {
			const webview = webviewRef.current;
			if (!webview) return;
			const currentWebviewUrl = webview.getURL();

			console.log("[WebView] did-stop-loading", {
				eventUrl: currentWebviewUrl,
				tabUrl: tab.url,
				tabIsLoading: tab.isLoading,
				initialLoadDone: initialLoadDoneRef.current,
			});

			// Check for placeholder scenario stop
			if (
				currentWebviewUrl === "about:blank" &&
				!initialLoadDoneRef.current &&
				tab.isLoading &&
				tab.url !== "about:blank"
			) {
				console.log(
					"[WebView] did-stop-loading: Placeholder about:blank stopped. Preserving isLoading for target URL:",
					tab.url,
				);
				isRefreshingRef.current = false; // Can reset this if needed
				// DO NOT UPDATE STATE, DO NOT SET initialLoadDoneRef
				return;
			}

			// For all other stops (actual target page, or genuine about:blank):
			if (!initialLoadDoneRef.current) {
				// Mark the main load cycle as done if it wasn't already
				initialLoadDoneRef.current = true;
			}
			isRefreshingRef.current = false; // Reset refresh flag

			if (isReadyRef.current) {
				updateNavigationState();
				if (currentWebviewUrl !== "about:blank") {
					await updateFavicon();
				}
			}

			const updatesForTab: Partial<Tab> = { isLoading: false };

			if (currentWebviewUrl === "about:blank") {
				// Genuine stop on about:blank
				updatesForTab.url = "about:blank";
				updatesForTab.title = "New Tab";
				updatesForTab.favicon = undefined;
				updatesForTab.canGoBack = webview.canGoBack();
				updatesForTab.canGoForward = webview.canGoForward();
			}

			updateTab(tab.id, updatesForTab);

			if (
				isReadyRef.current &&
				tab.url !== `${APP_NAME.toLowerCase()}://settings`
			) {
				updateNavigationState();
			}
		};

		const handleDidNavigate = (event: Electron.DidNavigateEvent) => {
			const webview = webviewRef.current;
			if (!webview) return;

			console.log("[WebView] did-navigate", {
				eventUrl: event.url,
				tabUrl: tab.url,
				tabIsLoading: tab.isLoading,
				initialLoadDone: initialLoadDoneRef.current,
			});

			if (event.url === "about:blank") {
				// Check for placeholder scenario
				if (
					!initialLoadDoneRef.current &&
					tab.isLoading &&
					tab.url !== "about:blank"
				) {
					console.log(
						"[WebView] did-navigate: Placeholder about:blank detected. Preserving state for target:",
						tab.url,
					);
					setErrorEvent(null);
					// DO NOT UPDATE STATE, DO NOT SET initialLoadDoneRef
					return;
				}
				// Genuine navigation TO about:blank
				console.log("[WebView] did-navigate: Genuine about:blank navigation.");
				// Treat about:blank as instantly loaded.
				initialLoadDoneRef.current = true; // Set true since this navigation is done.
				isRefreshingRef.current = false;

				updateTab(tab.id, {
					url: "about:blank",
					title: "New Tab",
					favicon: undefined,
					isLoading: false, // <<< Key: Set loading false
					isError: false,
					canGoBack: webview.canGoBack(),
					canGoForward: webview.canGoForward(),
					view: "webview",
				});
				setErrorEvent(null);
				return;
			}

			// If we reach here, event.url is NOT about:blank.
			initialLoadDoneRef.current = false; // Reset for new real page load cycle.

			if (event.url === `${APP_NAME.toLowerCase()}://settings`) {
				updateTab(tab.id, {
					url: event.url,
					title: "Settings",
					favicon: undefined,
					isLoading: false,
					isError: false,
					canGoBack: true,
					canGoForward: false,
					view: "settings",
				});
				setErrorEvent(null);
				return;
			}

			if (tab.view === "settings") {
				updateTab(tab.id, { view: "webview" });
			}

			// For any other real webpage URL
			updateTab(tab.id, {
				url: event.url,
				isError: false,
				isLoading: true,
			});
			setErrorEvent(null);
		};

		const handlePageTitleUpdated = (event: Electron.PageTitleUpdatedEvent) => {
			console.log("[WebView] page-title-updated", {
				title: event.title,
				url: webview.getURL(),
			});

			updateTab(tab.id, { title: event.title });

			// Add to history when title is updated
			const url = webview.getURL();
			if (url && url !== "about:blank") {
				historyService.addVisit(url, event.title, tab.favicon);
			}
		};

		const handleDidNavigateInPage = (
			event: Electron.DidNavigateInPageEvent,
		) => {
			const webview = webviewRef.current;
			if (!webview) return;

			console.log("[WebView] did-navigate-in-page", {
				url: event.url,
				isMainFrame: event.isMainFrame,
				currentUrl: isReadyRef.current ? webview.getURL() : tab.url,
				isReady: isReadyRef.current,
				initialLoadDone: initialLoadDoneRef.current,
				isRefreshing: isRefreshingRef.current,
			});

			if (event.isMainFrame && event.url !== "about:blank") {
				updateTab(tab.id, {
					url: event.url,
					isError: false, // Clear error state for in-page navigation
				});
				if (isReadyRef.current) {
					updateNavigationState();
					updateFavicon();
				}
			}
		};

		const handleDidFailLoad = (event: Electron.DidFailLoadEvent) => {
			console.log("[WebView] did-fail-load", {
				url: event.validatedURL,
				errorCode: event.errorCode,
				errorDescription: event.errorDescription,
				isMainFrame: event.isMainFrame,
				isReady: isReadyRef.current,
				initialLoadDone: initialLoadDoneRef.current,
				isRefreshing: isRefreshingRef.current,
			});

			if (event.isMainFrame) {
				// Don't show error for cancelled requests or when navigating to about:blank
				if (event.errorCode !== -3 && event.validatedURL !== "about:blank") {
					setErrorEvent(event);
					updateTab(tab.id, {
						isLoading: false,
						title: event.validatedURL,
						favicon: undefined,
						url: event.validatedURL,
						isError: true,
					});
					initialLoadDoneRef.current = true;
					isRefreshingRef.current = false;
				}
			}
		};

		const handleWillNavigate = (event: Electron.WillNavigateEvent) => {
			console.log("[WebView] Will navigate to:", event.url);
			updateTab(tab.id, {
				isLoading: true,
			});
		};

		webview.addEventListener("dom-ready", handleDomReady);
		webview.addEventListener("did-start-loading", handleDidStartLoading);
		webview.addEventListener("did-stop-loading", handleDidStopLoading);
		webview.addEventListener("did-navigate", handleDidNavigate);
		webview.addEventListener("did-navigate-in-page", handleDidNavigateInPage);
		webview.addEventListener("did-fail-load", handleDidFailLoad);
		webview.addEventListener("page-title-updated", handlePageTitleUpdated);
		webview.addEventListener("will-navigate", handleWillNavigate);

		return () => {
			isReadyRef.current = false;
			initialLoadDoneRef.current = false;
			isRefreshingRef.current = false;
			webview.removeEventListener("dom-ready", handleDomReady);
			webview.removeEventListener("did-start-loading", handleDidStartLoading);
			webview.removeEventListener("did-stop-loading", handleDidStopLoading);
			webview.removeEventListener("did-navigate", handleDidNavigate);
			webview.removeEventListener(
				"did-navigate-in-page",
				handleDidNavigateInPage,
			);
			webview.removeEventListener("did-fail-load", handleDidFailLoad);
			webview.removeEventListener("page-title-updated", handlePageTitleUpdated);
			webview.removeEventListener("will-navigate", handleWillNavigate);
		};
	}, [
		tab.id,
		tab.url,
		tab.favicon,
		tab.view,
		tab.isLoading,
		updateTab,
		updateNavigationState,
		updateFavicon,
	]);

	useEffect(() => {
		const webview = webviewRef.current;
		if (!webview) return;

		interface ShortcutEvent {
			key: string;
			metaKey: boolean;
			ctrlKey: boolean;
			altKey: boolean;
			shiftKey: boolean;
		}

		// Handle forwarded shortcuts from webview
		const handleMessage = (event: { channel: string; args: unknown[] }) => {
			if (event.channel === "forward-shortcut") {
				const shortcutEvent = event.args[0] as ShortcutEvent;
				// Create and dispatch a new keyboard event
				const keyEvent = new KeyboardEvent("keydown", {
					key: shortcutEvent.key,
					metaKey: shortcutEvent.metaKey,
					ctrlKey: shortcutEvent.ctrlKey,
					altKey: shortcutEvent.altKey,
					shiftKey: shortcutEvent.shiftKey,
					bubbles: true,
				});
				window.dispatchEvent(keyEvent);
			}
		};

		webview.addEventListener("ipc-message", handleMessage);

		return () => {
			webview.removeEventListener("ipc-message", handleMessage);
		};
	}, []);

	const handleRetry = () => {
		const webview = webviewRef.current;
		if (!webview) return;

		setErrorEvent(null);
		updateTab(tab.id, {
			isLoading: true,
			isError: false,
		});
		webview.loadURL(tab.url);
	};

	const handleGoBack = () => {
		const webview = webviewRef.current;
		if (!webview) return;

		setErrorEvent(null);
		updateTab(tab.id, {
			isLoading: true,
			isError: false,
		});
		webview.goBack();
	};

	const handleGoHome = () => {
		const webview = webviewRef.current;
		if (!webview) return;

		setErrorEvent(null);
		updateTab(tab.id, {
			url: "about:blank",
			title: "New Tab",
			isLoading: false,
			isError: false,
		});
		webview.loadURL("about:blank");
	};

	return (
		<>
			<webview
				key={tab.id}
				ref={handleWebviewRef}
				className={cn(
					"absolute inset-0 bg-background-primary",
					(!isActive || errorEvent) && "hidden",
				)}
				webpreferences="contextIsolation=yes, nodeIntegration=no, sandbox=yes, javascript=yes, webSecurity=yes, enableWebviewTag=yes"
				partition="persist:main"
				httpreferrer="strict-origin-when-cross-origin"
				useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
			/>
			{errorEvent !== null && isActive && (
				<div className="absolute inset-0">
					<ErrorPage
						url={tab.url}
						errorEvent={errorEvent}
						onRetry={handleRetry}
						onGoBack={handleGoBack}
						onGoHome={handleGoHome}
						canGoBack={tab.canGoBack}
					/>
				</div>
			)}
		</>
	);
}
