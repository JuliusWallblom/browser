import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePanels } from "@/hooks/use-panels";
import { cn } from "@/lib/utils";
import { Globe, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTabs } from "../../contexts/tabs-context";
import type { Tab } from "../../types/tab";
import { SidePanel } from "./side-panel";

export default function StreamsTab() {
	const { isLeftPanelOpen, setLeftPanelOpen } = usePanels();
	const { tabs, activeTabId, removeTab, setActiveTab } = useTabs();
	const [hasScrollbar, setHasScrollbar] = useState(false);
	const scrollAreaRef = useRef<HTMLDivElement>(null);

	const handleKeyDown = (e: React.KeyboardEvent, tab: Tab) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			setActiveTab(tab.id);
		}
	};

	const getTabTitle = (tab: Tab) => {
		if (tab.url === "about:blank") {
			return "New Tab";
		}
		return tab.title || tab.url || "New Tab";
	};

	useEffect(() => {
		const checkScrollbar = () => {
			const viewport = scrollAreaRef.current?.querySelector(
				"[data-radix-scroll-area-viewport]",
			) as HTMLElement;
			if (viewport) {
				const viewportHeight = viewport.clientHeight;
				const scrollHeight = viewport.scrollHeight;
				const needsScrollbar = scrollHeight > viewportHeight + 2;
				setHasScrollbar(needsScrollbar);
			}
		};

		checkScrollbar();
		const timeoutId = setTimeout(checkScrollbar, 100);

		const observer = new MutationObserver(() => {
			checkScrollbar();
			setTimeout(checkScrollbar, 100);
		});

		const viewport = scrollAreaRef.current?.querySelector(
			"[data-radix-scroll-area-viewport]",
		);
		if (viewport) {
			observer.observe(viewport, {
				childList: true,
				subtree: true,
				characterData: true,
				attributes: true,
			});
		}

		const resizeObserver = new ResizeObserver(() => {
			checkScrollbar();
			setTimeout(checkScrollbar, 100);
		});
		if (viewport) {
			resizeObserver.observe(viewport);
		}

		return () => {
			clearTimeout(timeoutId);
			observer.disconnect();
			resizeObserver.disconnect();
		};
	}, []);

	return (
		<SidePanel
			isOpen={isLeftPanelOpen}
			onClose={() => setLeftPanelOpen(false)}
			position="left"
		>
			<ScrollArea ref={scrollAreaRef} className="h-full w-full">
				<div
					className={cn(
						"space-y-1 w-full pb-2 px-1 min-w-0",
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
								"!h-8 rounded group flex items-center gap-2 px-2 cursor-pointer hover:bg-muted transition-colors text-left w-full min-w-0",
								activeTabId === tab.id && "bg-muted",
							)}
							onClick={() => setActiveTab(tab.id)}
							onKeyDown={(e) => handleKeyDown(e, tab)}
						>
							<div className="shrink-0 w-4 h-4">
								{tab.isLoading ? (
									<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
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
										"h-8 w-4 bg-transparent opacity-0 group-hover:opacity-100 transition-opacity",
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
