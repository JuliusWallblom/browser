import { cn } from "@/lib/utils";
import { useTabs } from "@/contexts/tabs-context";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { useCallback, useState, useEffect, useRef } from "react";
import type { Tab } from "../../types/tab";
import { HorizontalTab } from "./horizontal-tab";
import { usePreferences } from "@/contexts/preferences-context";

interface HorizontalTabsProps {
	onAddTab: () => void;
}

export function HorizontalTabs({ onAddTab }: HorizontalTabsProps) {
	const {
		tabs,
		activeTabId,
		setActiveTab,
		removeTab,
		previewImages,
		loadingPreviews,
		capturedUrlsForTabs,
		captureAndStoreTabPreview,
	} = useTabs();
	const { previewTabs } = usePreferences();

	const previousActiveTabIdRef = useRef<string | null>(null);

	const handleTabHover = useCallback(
		async (tab: Tab) => {
			if (tab.id !== activeTabId) {
				captureAndStoreTabPreview(tab);
			}
		},
		[activeTabId, captureAndStoreTabPreview],
	);

	useEffect(() => {
		for (const tab of tabs) {
			const shouldConsiderCapture =
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
						captureAndStoreTabPreview(tab);
					}
				}
			}
		}
	}, [
		tabs,
		previewImages,
		capturedUrlsForTabs,
		loadingPreviews,
		captureAndStoreTabPreview,
	]);

	useEffect(() => {
		const previousActiveTabId = previousActiveTabIdRef.current;
		if (previousActiveTabId && previousActiveTabId !== activeTabId) {
			const previousTab = tabs.find((t) => t.id === previousActiveTabId);
			if (previousTab) {
				captureAndStoreTabPreview(previousTab);
			}
		}
		previousActiveTabIdRef.current = activeTabId;
	}, [activeTabId, tabs, captureAndStoreTabPreview]);

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
						className="!ml-2 h-6 w-6 p-1 non-draggable z-40 text-muted-foreground"
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
