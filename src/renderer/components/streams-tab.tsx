import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePanels } from "@/hooks/use-panels";
import { cn } from "@/lib/utils";
import { Globe, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTabs } from "../../contexts/tabs-context";
import type { Tab } from "../../types/tab";
import { SidePanel } from "./side-panel";
import { ErrorFavicon } from "./error-favicon";

export default function StreamsTab() {
	const { isLeftPanelOpen, setLeftPanelOpen } = usePanels();
	const { tabs, activeTabId, removeTab, setActiveTab } = useTabs();
	const [hasScrollbar, setHasScrollbar] = useState(false);
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);

	const handleKeyDown = (e: React.KeyboardEvent, tab: Tab) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			setActiveTab(tab.id);
		}
	};

	const getTabTitle = (tab: Tab) => {
		if (tab.url === "") {
			return "New Tab";
		}
		return tab.title || tab.url || "New Tab";
	};

	useEffect(() => {
		const checkScrollbar = () => {
			const content = contentRef.current;
			const viewport = scrollAreaRef.current?.querySelector(
				"[data-radix-scroll-area-viewport]",
			) as HTMLElement;

			console.log("[StreamsTab] Checking scrollbar:", {
				contentExists: !!content,
				viewportExists: !!viewport,
				contentHeight: content?.scrollHeight,
				contentClientHeight: content?.clientHeight,
				viewportHeight: viewport?.scrollHeight,
				viewportClientHeight: viewport?.clientHeight,
				numTabs: tabs.length,
			});

			if (!content || !viewport) {
				console.log("[StreamsTab] Missing refs, skipping check");
				return;
			}

			// Check both content and viewport
			const contentHasOverflow = content.scrollHeight > content.clientHeight;
			const viewportHasOverflow = viewport.scrollHeight > viewport.clientHeight;

			console.log("[StreamsTab] Overflow status:", {
				contentHasOverflow,
				viewportHasOverflow,
				currentHasScrollbar: hasScrollbar,
			});

			// Update if either has overflow
			const needsScrollbar = contentHasOverflow || viewportHasOverflow;
			if (needsScrollbar !== hasScrollbar) {
				console.log("[StreamsTab] Updating scrollbar state:", {
					needsScrollbar,
				});
				setHasScrollbar(needsScrollbar);
			}
		};

		// Initial check
		console.log("[StreamsTab] Running initial check");
		checkScrollbar();

		// Check after a short delay to allow layout to settle
		const timeoutId = setTimeout(() => {
			console.log("[StreamsTab] Running delayed check");
			checkScrollbar();
		}, 100);

		// Create a ResizeObserver to watch for size changes
		const resizeObserver = new ResizeObserver((entries) => {
			console.log("[StreamsTab] ResizeObserver triggered:", {
				numEntries: entries.length,
			});
			checkScrollbar();
		});

		if (contentRef.current) {
			resizeObserver.observe(contentRef.current);
		}

		// Create a MutationObserver to watch for content changes
		const mutationObserver = new MutationObserver((mutations) => {
			console.log("[StreamsTab] MutationObserver triggered:", {
				numMutations: mutations.length,
				types: mutations.map((m) => m.type),
			});
			checkScrollbar();
		});

		if (contentRef.current) {
			mutationObserver.observe(contentRef.current, {
				childList: true,
				subtree: true,
				characterData: true,
			});
		}

		return () => {
			clearTimeout(timeoutId);
			resizeObserver.disconnect();
			mutationObserver.disconnect();
		};
	}, [hasScrollbar, tabs.length]);

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
						"space-y-1 w-full pb-[6px] px-1 min-w-0",
						hasScrollbar ? "pr-3" : "",
					)}
				>
					{tabs.map((tab: Tab) => (
						<div
							key={tab.id}
							// biome-ignore lint/a11y/useSemanticElements: <explanation>
							role="button"
							tabIndex={0}
							className={cn(
								"!h-8 rounded group flex items-center gap-2 px-2 cursor-pointer hover:bg-muted text-left w-full min-w-0",
								activeTabId === tab.id && "bg-muted",
							)}
							onClick={() => setActiveTab(tab.id)}
							onKeyDown={(e) => handleKeyDown(e, tab)}
						>
							<div className="shrink-0 w-4 h-4">
								{tab.url !== "about:blank" && tab.isLoading ? (
									<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
								) : tab.isError ? (
									<ErrorFavicon />
								) : tab.favicon ? (
									<img
										src={tab.favicon}
										alt=""
										className="w-4 h-4"
										onError={(e) => {
											e.currentTarget.src = "";
											e.currentTarget.style.display = "none";
										}}
									/>
								) : (
									<Globe className="w-4 h-4 text-muted-foreground" />
								)}
							</div>
							<div className="truncate w-[1px] flex-1">
								<div className="truncate text-sm leading-none">
									{getTabTitle(tab)}
								</div>
							</div>
							<div className="shrink-0">
								<Button
									variant="ghost"
									size="icon"
									className={cn(
										"h-8 w-4 bg-transparent opacity-0 group-hover:opacity-100",
										tabs.length === 1 && "hidden",
									)}
									onClick={(e) => {
										e.stopPropagation();
										removeTab(tab.id);
									}}
									aria-label={`Close tab ${getTabTitle(tab)}`}
								>
									<X className="h-3 w-3" />
								</Button>
							</div>
						</div>
					))}
				</div>
			</ScrollArea>
		</SidePanel>
	);
}
