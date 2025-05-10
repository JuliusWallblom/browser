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
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
	DragOverlay,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

// Define the drop animation configuration
const dropAnimationConfig = {
	duration: 250, // Standard duration
	easing: "ease", // Standard, non-bouncy easing
};

export default function StreamsTab() {
	const { isLeftPanelOpen, setLeftPanelOpen } = usePanels();
	const {
		tabs,
		activeTabId,
		removeTab,
		setActiveTab,
		previewImages,
		captureAndStoreTabPreview,
		reorderTabs,
		orderedTabIds,
	} = useTabs();
	const { previewTabs, tabLayout } = usePreferences();

	const [activeDraggedTab, setActiveDraggedTab] = useState<Tab | null>(null);

	const [hasScrollbar, setHasScrollbar] = useState(false);
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragStart = useCallback(
		(event: DragEndEvent) => {
			const { active } = event;
			const tab = tabs.find((t) => t.id === active.id);
			if (tab) {
				setActiveDraggedTab(tab);
			}
		},
		[tabs],
	);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;
			if (over && active.id !== over.id) {
				reorderTabs(active.id as string, over.id as string);
			}
			setActiveDraggedTab(null);
		},
		[reorderTabs],
	);

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
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				modifiers={[restrictToVerticalAxis]}
			>
				<ScrollArea ref={scrollAreaRef} className="h-full w-full pl-[2px]">
					<SortableContext
						items={orderedTabIds}
						strategy={verticalListSortingStrategy}
					>
						<div
							ref={contentRef}
							className={cn(
								"space-y-1 w-full pb-[6px] pt-[6px] px-1 min-w-0",
								hasScrollbar ? "pr-3" : "pr-[5px]",
							)}
						>
							{orderedTabIds.map((tabId) => {
								const tab = tabs.find((t) => t.id === tabId);
								if (!tab) return null;
								return (
									<HorizontalTab
										key={tab.id}
										tab={tab}
										isActive={activeTabId === tab.id}
										onSelect={setActiveTab}
										onClose={(tabIdToClose) => {
											if (orderedTabIds.length === 1) {
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
										blockAllHovers={!!activeDraggedTab}
									/>
								);
							})}
						</div>
					</SortableContext>
				</ScrollArea>
				<DragOverlay dropAnimation={dropAnimationConfig}>
					{activeDraggedTab ? (
						<HorizontalTab
							key={activeDraggedTab.id}
							tab={activeDraggedTab}
							isActive={activeDraggedTab.id === activeTabId}
							onSelect={() => {}}
							onClose={() => {}}
							previewEnabled={previewTabs}
							closeButtonVisibility="onHoverOrActive"
							onHover={() => {}}
							previewImage={previewImages[activeDraggedTab.id]}
							previewCardSide="right"
							variant="streamItem"
							isOverlayInstance={true}
							blockAllHovers={!!activeDraggedTab}
						/>
					) : null}
				</DragOverlay>
			</DndContext>
		</SidePanel>
	);
}
