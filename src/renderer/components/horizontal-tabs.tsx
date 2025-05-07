import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area"; // Assuming ScrollArea can be horizontal
import { usePreferences } from "@/contexts/preferences-context";
import { useTabs } from "@/contexts/tabs-context";
import { Plus } from "lucide-react";
import { useCallback, useState, useEffect, useRef } from "react";
import { useWebviews } from "../../contexts/webview-context"; // Added
import type { Tab } from "../../types/tab"; // Import Tab type
import { HorizontalTab } from "./horizontal-tab"; // Added

interface HorizontalTabsProps {
	onAddTab: () => void;
}

export function HorizontalTabs({ onAddTab }: HorizontalTabsProps) {
	const { tabs, activeTabId, setActiveTab, removeTab } = useTabs();
	const { webviewRefs } = useWebviews(); // Added
	const { previewTabs } = usePreferences();
	const [previewImages, setPreviewImages] = useState<
		Record<string, string | null>
	>({}); // Added
	const [loadingPreviews, setLoadingPreviews] = useState<
		Record<string, boolean>
	>({}); // Added
	const [capturedUrlsForTabs, setCapturedUrlsForTabs] = useState<
		Record<string, string>
	>({}); // Added
	const previousActiveTabIdRef = useRef<string | null>(null); // Added for tracking previous active tab

	const captureTabPreview = useCallback(
		async (tab: Tab): Promise<boolean> => {
			const tabId = tab.id;
			console.log(
				`[TabPreview] captureTabPreview called for tabId: ${tabId}, url: ${tab.url}, isLoading: ${tab.isLoading}`,
			);

			const shouldAttemptCapture =
				previewTabs &&
				!loadingPreviews[tabId] &&
				!tab.isLoading &&
				tab.url !== "about:blank" &&
				!tab.url.startsWith("manta://");

			if (!shouldAttemptCapture) {
				console.log(
					`[TabPreview] Bailing early from capture for tabId: ${tabId}. Conditions not met: previewTabs=${previewTabs}, isLoadingThisPreview=${loadingPreviews[tabId]}, tab.isLoading=${tab.isLoading}, isBlank=${tab.url === "about:blank"}, isInternal=${tab.url.startsWith("manta://")}`,
				);
				return false;
			}

			const webview = webviewRefs.current.get(tabId);
			console.log(
				`[TabPreview] Webview for tabId ${tabId}:`,
				webview ? "found" : "NOT found",
			);

			if (!webview || typeof webview.capturePage !== "function") {
				console.log(
					`[TabPreview] Webview for tabId ${tabId} not found or capturePage not available.`,
				);
				return false;
			}

			setLoadingPreviews((prev) => ({ ...prev, [tabId]: true }));
			console.log(
				`[TabPreview] Attempting to capture page for tabId: ${tabId}`,
			);
			try {
				const image = await webview.capturePage();
				console.log(
					`[TabPreview] Page captured for tabId: ${tabId}`,
					image ? "Image received" : "NO Image received",
				);
				const dataUrl = image.toDataURL();
				setPreviewImages((prev) => ({ ...prev, [tabId]: dataUrl }));
			} catch (error) {
				console.error(
					`[TabPreview] Failed to capture tab preview for tabId: ${tabId}:`,
					error,
				);
				setPreviewImages((prev) => ({ ...prev, [tabId]: null }));
			} finally {
				console.log(
					`[TabPreview] Finalizing capture attempt for tabId: ${tabId}`,
				);
				setLoadingPreviews((prev) => ({ ...prev, [tabId]: false }));
			}
			return true; // Capture was attempted
		},
		[
			previewTabs,
			webviewRefs,
			loadingPreviews /* Stable setters setLoadingPreviews, setPreviewImages omitted */,
		],
	);

	const handleTabHover = useCallback(
		async (tab: Tab) => {
			console.log(
				`[TabPreview] handleTabHover called for tabId: ${tab.id}, url: ${tab.url}, isLoading: ${tab.isLoading}`,
			);
			if (
				previewTabs &&
				tab.id !== activeTabId &&
				!tab.url.startsWith("manta://")
			) {
				captureTabPreview(tab);
			}
		},
		[previewTabs, activeTabId, captureTabPreview],
	);

	useEffect(() => {
		console.log(
			"[TabPreview] Main useEffect for tabs/state change detected. Tabs count:",
			tabs.length,
			"Captured URLs count:",
			Object.keys(capturedUrlsForTabs).length,
		);
		for (const tab of tabs) {
			const shouldConsiderCapture =
				previewTabs &&
				!tab.isLoading &&
				tab.url &&
				tab.url !== "about:blank" &&
				!tab.url.startsWith("manta://");

			if (shouldConsiderCapture) {
				const hasExistingPreview = !!previewImages[tab.id];
				const previewIsForDifferentUrl =
					capturedUrlsForTabs[tab.id] !== tab.url;

				if (!hasExistingPreview || previewIsForDifferentUrl) {
					if (!loadingPreviews[tab.id]) {
						console.log(
							`[TabPreview] Main useEffect: Triggering capture for tabId: ${tab.id}, url: ${tab.url} (Reason: ${!hasExistingPreview ? "no existing preview" : "URL changed"})`,
						);
						captureTabPreview(tab).then((captureAttempted) => {
							if (captureAttempted) {
								setCapturedUrlsForTabs((prev) => ({
									...prev,
									[tab.id]: tab.url,
								}));
							}
						});
					} else {
						console.log(
							`[TabPreview] Main useEffect: Skipped capture for ${tab.id} (url: ${tab.url}) because loadingPreviews[${tab.id}] is true. (URL mismatch: ${previewIsForDifferentUrl}, No image: ${!hasExistingPreview})`,
						);
					}
				}
			}
		}
	}, [
		tabs,
		previewTabs,
		previewImages,
		capturedUrlsForTabs,
		loadingPreviews,
		captureTabPreview,
	]);

	// Effect to capture preview when switching AWAY from a tab
	useEffect(() => {
		const previousActiveTabId = previousActiveTabIdRef.current;
		if (previousActiveTabId && previousActiveTabId !== activeTabId) {
			const previousTab = tabs.find((t) => t.id === previousActiveTabId);
			if (previousTab) {
				console.log(
					`[TabPreview] Active tab changed. Attempting to capture preview for previously active tab: ${previousTab.id}, URL: ${previousTab.url}`,
				);
				captureTabPreview(previousTab); // No longer updating capturedUrlsForTabs here
			}
		}
		// Update the ref to the current active tab ID for the next change
		previousActiveTabIdRef.current = activeTabId;
	}, [activeTabId, tabs, captureTabPreview]); // setCapturedUrlsForTabs is removed from usage and thus from potential deps here

	return (
		<div className="h-10 bg-background border-b flex items-center pl-1 pr-2 draggable">
			<div className="w-[70px] shrink-0" />
			<ScrollArea className="w-full whitespace-nowrap h-full">
				<div className="flex items-center h-full py-1 space-x-1">
					{tabs.map((tab) => (
						<HorizontalTab
							key={tab.id}
							tab={tab}
							isActive={activeTabId === tab.id}
							onSelect={setActiveTab}
							onClose={(tabId) => {
								if (tabs.length === 1) {
									window.electron.ipcRenderer.sendMessage("close-window");
								} else {
									removeTab(tabId);
								}
							}}
							previewEnabled={previewTabs}
							previewImage={previewImages[tab.id]}
							onHover={handleTabHover}
						/>
					))}
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6 p-1 non-draggable z-40 text-muted-foreground"
						onClick={onAddTab}
						aria-label="New Tab"
					>
						<Plus className="!w-4 !h-4" />
					</Button>
				</div>
			</ScrollArea>
		</div>
	);
}
