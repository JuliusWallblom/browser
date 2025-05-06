import { cn } from "@/lib/utils";
import { useTabs } from "@/contexts/tabs-context";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area"; // Assuming ScrollArea can be horizontal
import { X, Loader2, Globe, Plus } from "lucide-react";
import { ErrorFavicon } from "./error-favicon";
import type { Tab } from "../../types/tab"; // Import Tab type

interface HorizontalTabsProps {
	onAddTab: () => void;
}

export function HorizontalTabs({ onAddTab }: HorizontalTabsProps) {
	const { tabs, activeTabId, setActiveTab, removeTab, addTab } = useTabs();

	const getTabTitle = (tab: Tab) => {
		if (tab.url === "" || tab.url === "about:blank") {
			return "New Tab";
		}
		return tab.title || tab.url || "New Tab";
	};

	return (
		<div className="h-10 bg-background border-b flex items-center pl-1 pr-2 draggable">
			<div className="w-[70px] shrink-0" />
			<ScrollArea className="w-full whitespace-nowrap h-full">
				<div className="flex items-center h-full py-1 space-x-1">
					{tabs.map((tab) => (
						<div
							key={tab.id}
							className={cn(
								"non-draggable flex-1 text-muted-foreground hover:bg-secondary/50 group transition-all rounded-lg h-[30px] mt-[1px] px-2 text-sm relative min-w-[100px] max-w-[200px] flex items-center justify-between gap-2 group cursor-pointer",
								activeTabId === tab.id &&
									"!bg-secondary border-primary/50 text-foreground",
							)}
							onClick={() => setActiveTab(tab.id)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									setActiveTab(tab.id);
								}
							}}
							title={getTabTitle(tab)}
						>
							<div className="shrink-0 w-4 h-4">
								{tab.url !== "about:blank" && tab.isLoading ? (
									<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
								) : tab.isError ? (
									<ErrorFavicon />
								) : tab.favicon ? (
									<img src={tab.favicon} alt="" className="w-4 h-4" />
								) : (
									<Globe className="w-4 h-4 text-muted-foreground" />
								)}
							</div>
							<span className="select-none group-hover:text-foreground truncate flex-1 text-left">
								{getTabTitle(tab)}
							</span>
							<Button
								variant="ghost"
								size="icon"
								className={cn("h-4 w-4 p-0.5 group-hover:text-foreground")}
								onClick={(e) => {
									e.stopPropagation();
									if (tabs.length === 1) {
										window.electron.ipcRenderer.sendMessage("close-window");
									} else {
										removeTab(tab.id);
									}
								}}
								aria-label={`Close tab ${getTabTitle(tab)}`}
							>
								<X className="h-3 w-3" />
							</Button>
						</div>
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
