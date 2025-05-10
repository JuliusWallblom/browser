import { cn } from "@/lib/utils";
import { useTabs } from "@/contexts/tabs-context";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { useCallback, useState, useEffect, useRef } from "react";
import type { Tab } from "../../types/tab";
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
	horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";

interface HorizontalTabsProps {
	onAddTab: () => void;
}

const dropAnimationConfig = {
	duration: 250,
	easing: "ease",
};

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
		reorderTabs,
		orderedTabIds,
	} = useTabs();
	const { previewTabs } = usePreferences();

	const [activeDraggedTab, setActiveDraggedTab] = useState<Tab | null>(null);

	const previousActiveTabIdRef = useRef<string | null>(null);

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
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				modifiers={[restrictToHorizontalAxis]}
			>
				<ScrollArea className="w-full whitespace-nowrap h-full">
					<SortableContext
						items={orderedTabIds}
						strategy={horizontalListSortingStrategy}
					>
						<div className="flex items-center h-full py-1 space-x-1">
							{orderedTabIds.map((tabId) => {
								const tab = tabs.find((t) => t.id === tabId);
								if (!tab) return null;
								return (
									<HorizontalTab
										key={tab.id}
										tab={tab}
										isActive={activeTabId === tab.id}
										onSelect={setActiveTab}
										onClose={(closedTabId) => {
											if (orderedTabIds.length === 1) {
												window.electron.ipcRenderer.sendMessage("close-window");
											} else {
												removeTab(closedTabId);
											}
										}}
										previewEnabled={previewTabs}
										previewImage={previewImages[tab.id]}
										onHover={handleTabHover}
										blockAllHovers={!!activeDraggedTab}
									/>
								);
							})}
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
					</SortableContext>
				</ScrollArea>
				<DragOverlay dropAnimation={dropAnimationConfig}>
					{activeDraggedTab ? (
						<div style={{ marginTop: "-1px" }}>
							<HorizontalTab
								key={activeDraggedTab.id}
								tab={activeDraggedTab}
								isActive={activeDraggedTab.id === activeTabId}
								onSelect={() => {}}
								onClose={() => {}}
								previewEnabled={previewTabs}
								previewImage={previewImages[activeDraggedTab.id]}
								onHover={() => {}}
								isOverlayInstance={true}
								blockAllHovers={!!activeDraggedTab}
							/>
						</div>
					) : null}
				</DragOverlay>
			</DndContext>
		</div>
	);
}
