import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePanels } from "@/hooks/use-panels";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, useCallback } from "react";
import { useTabs } from "../../contexts/tabs-context";
import type { Tab } from "../../types/tab";
import { SidePanel } from "./side-panel";
import { HorizontalTab } from "./horizontal-tab";
import { usePreferences } from "@/contexts/preferences-context";

export default function StreamsTab() {
	const { isLeftPanelOpen, setLeftPanelOpen } = usePanels();
	const {
		tabs,
		activeTabId,
		removeTab,
		setActiveTab,
		previewImages,
		captureAndStoreTabPreview,
	} = useTabs();
	const { previewTabs, tabLayout } = usePreferences();

	const [hasScrollbar, setHasScrollbar] = useState(false);
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);

	const checkScrollbar = useCallback(() => {
		const content = contentRef.current;
		const viewport = scrollAreaRef.current?.querySelector(
			"[data-radix-scroll-area-viewport]",
		) as HTMLElement;

		console.log("[StreamsTab] Checking scrollbar:", {
			contentExists: !!content,
			viewportExists: !!viewport,
		});

		if (!content || !viewport) {
			console.log("[StreamsTab] Missing refs, skipping check");
			return;
		}

		const contentHasOverflow = content.scrollHeight > content.clientHeight;
		const viewportHasOverflow = viewport.scrollHeight > viewport.clientHeight;

		console.log("[StreamsTab] Overflow status:", {
			contentHasOverflow,
			viewportHasOverflow,
			currentHasScrollbar: hasScrollbar,
		});

		const needsScrollbar = contentHasOverflow || viewportHasOverflow;
		if (needsScrollbar !== hasScrollbar) {
			console.log("[StreamsTab] Updating scrollbar state:", {
				needsScrollbar,
			});
			setHasScrollbar(needsScrollbar);
		}
	}, [hasScrollbar]);

	useEffect(() => {
		console.log("[StreamsTab] Running initial check (main useEffect)");
		checkScrollbar();

		const timeoutId = setTimeout(() => {
			console.log("[StreamsTab] Running delayed check (main useEffect)");
			checkScrollbar();
		}, 100);

		const currentContentRef = contentRef.current;
		const resizeObserver = new ResizeObserver((entries) => {
			console.log("[StreamsTab] ResizeObserver triggered:", {
				numEntries: entries.length,
			});
			checkScrollbar();
		});

		if (currentContentRef) {
			resizeObserver.observe(currentContentRef);
		}

		const mutationObserver = new MutationObserver((mutations) => {
			console.log("[StreamsTab] MutationObserver triggered:", {
				numMutations: mutations.length,
				types: mutations.map((m) => m.type),
			});
			checkScrollbar();
		});

		if (currentContentRef) {
			mutationObserver.observe(currentContentRef, {
				childList: true,
				subtree: true,
				characterData: true,
			});
		}

		window.addEventListener("resize", checkScrollbar);

		return () => {
			clearTimeout(timeoutId);
			if (currentContentRef) {
				resizeObserver.unobserve(currentContentRef);
				mutationObserver.disconnect();
			}
			window.removeEventListener("resize", checkScrollbar);
		};
	}, [checkScrollbar]);

	useEffect(() => {
		console.log("[StreamsTab] tabLayout changed, running checkScrollbar.", {
			tabLayout,
		});
		checkScrollbar();
	}, [tabLayout, checkScrollbar]);

	return (
		<SidePanel
			isOpen={isLeftPanelOpen}
			onClose={() => setLeftPanelOpen(false)}
			position="left"
		>
			<ScrollArea ref={scrollAreaRef} className="h-full w-full pl-[2px]">
				<div
					ref={contentRef}
					className={cn(
						"space-y-1 w-full pb-[6px] pt-[6px] px-1 min-w-0",
						hasScrollbar ? "pr-3" : "pr-[5px]",
					)}
				>
					{tabs.map((tab: Tab) => (
						<HorizontalTab
							key={tab.id}
							tab={tab}
							isActive={activeTabId === tab.id}
							onSelect={setActiveTab}
							onClose={(tabIdToClose) => {
								if (tabs.length === 1) {
									window.electron.ipcRenderer.sendMessage("close-window");
								} else {
									removeTab(tabIdToClose);
								}
							}}
							previewEnabled={previewTabs}
							closeButtonVisibility="onHoverOrActive"
							onHover={captureAndStoreTabPreview}
							previewImage={previewImages[tab.id]}
							previewCardSide="right"
							variant="streamItem"
						/>
					))}
				</div>
			</ScrollArea>
		</SidePanel>
	);
}
