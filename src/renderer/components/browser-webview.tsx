import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Tab } from "../../types/tab";
import { WebviewContextMenu } from "./webview-context-menu";

interface WebViewProps {
	tab: Tab;
	isActive: boolean;
	onWebviewRef: (webview: Electron.WebviewTag | null, tabId: string) => void;
	updateTab: (tabId: string, updates: Partial<Tab>) => void;
}

interface ContextMenuState {
	x: number;
	y: number;
	linkURL?: string;
	srcURL?: string;
	selectionText?: string;
	isEditable?: boolean;
}

interface WebviewContextMenuEvent extends Event {
	params: Electron.ContextMenuParams;
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
	const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

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
					
					// If no icons found, try Google's special format
					if (icons.length === 0) {
						const domain = window.location.hostname;
						return domain ? 'https://www.google.com/s2/favicons?domain=' + domain : null;
					}
					
					// Sort by size preference if specified
					const sortedIcons = icons.sort((a, b) => {
						const sizeA = parseInt(a.getAttribute('sizes')?.split('x')[0] || '0');
						const sizeB = parseInt(b.getAttribute('sizes')?.split('x')[0] || '0');
						return sizeB - sizeA;
					});
					
					return sortedIcons[0].href;
				})()
			`);

			updateTab(tab.id, { favicon: faviconUrl || undefined });
			return true;
		} catch (error) {
			console.error("Error updating favicon:", error);
			updateTab(tab.id, { favicon: undefined });
			return false;
		}
	}, [tab.id, updateTab]);

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
		initialLoadDoneRef.current = false;

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

			// Show loading state for initial load or refresh, but not for about:blank
			if (
				(!initialLoadDoneRef.current || isRefreshingRef.current) &&
				currentUrl !== "about:blank"
			) {
				updateTab(tab.id, { isLoading: true });
			}
		};

		const handleDidStopLoading = async () => {
			const webview = webviewRef.current;
			if (!webview) return;

			const currentUrl = isReadyRef.current ? webview.getURL() : tab.url;
			console.log("[WebView] did-stop-loading", {
				url: currentUrl,
				isReady: isReadyRef.current,
				initialLoadDone: initialLoadDoneRef.current,
				isRefreshing: isRefreshingRef.current,
			});

			// Update loading state for initial load or refresh, but not for about:blank
			if (
				(!initialLoadDoneRef.current || isRefreshingRef.current) &&
				currentUrl !== "about:blank"
			) {
				if (isReadyRef.current) {
					updateNavigationState();
					// Try to update favicon before marking as done loading
					await updateFavicon();
				}
				updateTab(tab.id, { isLoading: false });
			}

			initialLoadDoneRef.current = true;
			isRefreshingRef.current = false;
		};

		const handleDidNavigate = (event: Electron.DidNavigateEvent) => {
			const webview = webviewRef.current;
			if (!webview) return;

			console.log("[WebView] did-navigate", {
				url: event.url,
				currentUrl: isReadyRef.current ? webview.getURL() : tab.url,
				isReady: isReadyRef.current,
				initialLoadDone: initialLoadDoneRef.current,
				isRefreshing: isRefreshingRef.current,
			});

			// Always update URL, even for about:blank
			updateTab(tab.id, {
				url: event.url,
				// Clear favicon and title when navigating to blank page
				...(event.url === "about:blank" && {
					favicon: undefined,
					title: "New Tab",
				}),
			});

			// Reset initial load state on actual navigation
			initialLoadDoneRef.current = false;
			if (isReadyRef.current) {
				updateNavigationState();
			}
		};

		const handlePageTitleUpdated = (event: Electron.PageTitleUpdatedEvent) => {
			console.log("[WebView] page-title-updated", {
				title: event.title,
				url: webview.getURL(),
			});

			updateTab(tab.id, { title: event.title });
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
				updateTab(tab.id, { url: event.url });
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
				updateTab(tab.id, {
					isLoading: false,
					title: "Failed to load page",
					favicon: undefined,
				});
				initialLoadDoneRef.current = true;
				isRefreshingRef.current = false;
			}
		};

		webview.addEventListener("dom-ready", handleDomReady);
		webview.addEventListener("did-start-loading", handleDidStartLoading);
		webview.addEventListener("did-stop-loading", handleDidStopLoading);
		webview.addEventListener("did-navigate", handleDidNavigate);
		webview.addEventListener("did-navigate-in-page", handleDidNavigateInPage);
		webview.addEventListener("did-fail-load", handleDidFailLoad);
		webview.addEventListener("page-title-updated", handlePageTitleUpdated);

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
		};
	}, [tab.id, tab.url, updateTab, updateNavigationState, updateFavicon]);

	const handleContextMenu = useCallback((e: Event) => {
		e.preventDefault();
		const event = e as unknown as { params: Electron.ContextMenuParams };
		console.log("[WebView] context-menu event:", {
			x: event.params.x,
			y: event.params.y,
			linkURL: event.params.linkURL,
			srcURL: event.params.srcURL,
			selectionText: event.params.selectionText,
			isEditable: event.params.isEditable,
		});

		// Force close any existing menu first
		setContextMenu(null);

		// Set timeout to ensure the old menu is closed
		requestAnimationFrame(() => {
			setContextMenu({
				x: event.params.x,
				y: event.params.y,
				linkURL: event.params.linkURL,
				srcURL: event.params.srcURL,
				selectionText: event.params.selectionText,
				isEditable: event.params.isEditable,
			});
		});

		return false;
	}, []);

	const handleContextMenuOpenChange = useCallback((open: boolean) => {
		console.log("[WebView] context menu open change:", { open });
		if (!open) {
			setContextMenu(null);
		}
	}, []);

	useEffect(() => {
		const webview = webviewRef.current;
		if (!webview) return;

		console.log("[WebView] Adding context-menu listener");
		webview.addEventListener("context-menu", handleContextMenu);

		return () => {
			console.log("[WebView] Removing context-menu listener");
			webview.removeEventListener("context-menu", handleContextMenu);
		};
	}, [handleContextMenu]);

	useEffect(() => {
		console.log("[WebView] contextMenu state changed:", contextMenu);
	}, [contextMenu]);

	return (
		<>
			<webview
				key={tab.id}
				ref={handleWebviewRef}
				src="about:blank"
				className={cn(
					"absolute inset-0 bg-background-primary",
					!isActive && "hidden",
				)}
				webpreferences="contextIsolation=yes, nodeIntegration=no, sandbox=yes, javascript=yes, webSecurity=yes, enableWebviewTag=yes"
				partition="persist:main"
				httpreferrer="strict-origin-when-cross-origin"
				useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
			/>
			{contextMenu && (
				<WebviewContextMenu
					tabId={tab.id}
					x={contextMenu.x}
					y={contextMenu.y}
					linkURL={contextMenu.linkURL}
					srcURL={contextMenu.srcURL}
					selectionText={contextMenu.selectionText}
					isEditable={contextMenu.isEditable}
					onOpenChange={handleContextMenuOpenChange}
				/>
			)}
		</>
	);
}
