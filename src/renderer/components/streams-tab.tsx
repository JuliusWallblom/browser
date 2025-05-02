import { usePanels } from "@/hooks/use-panels";
import { useTabs } from "../contexts/tabs-context";
import type { Tab } from "../types/tab";
import { SidePanel } from "./side-panel";
import { cn } from "@/lib/utils";
import { Plus, X, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StreamsTab() {
	const { isLeftPanelOpen, setLeftPanelOpen } = usePanels();
	const { tabs, activeTabId, addTab, removeTab, setActiveTab } = useTabs();

	const handleAddTab = () => {
		addTab({
			url: "about:blank",
			title: "New Tab",
			isLoading: false,
			webviewKey: Date.now(),
		});
	};

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

	return (
		<SidePanel
			isOpen={isLeftPanelOpen}
			onClose={() => setLeftPanelOpen(false)}
			position="left"
		>
			<div className="flex flex-col h-full">
				<div className="flex items-center justify-between p-2 border-b border-border">
					<h2 className="text-primary font-medium">Tabs</h2>
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6"
						onClick={handleAddTab}
					>
						<Plus className="h-4 w-4" />
					</Button>
				</div>
				<div className="flex-1 overflow-y-auto">
					{tabs.map((tab: Tab) => (
						<div
							key={tab.id}
							// biome-ignore lint/a11y/useSemanticElements: <explanation>
							role="button"
							tabIndex={0}
							className={cn(
								"group flex w-full items-center gap-2 p-2 cursor-pointer hover:bg-muted transition-colors text-left",
								activeTabId === tab.id && "bg-muted",
							)}
							onClick={() => setActiveTab(tab.id)}
							onKeyDown={(e) => handleKeyDown(e, tab)}
						>
							<div className="flex-shrink-0 w-4 h-4">
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
							<div className="flex-1 min-w-0">
								<div className="truncate text-sm">{getTabTitle(tab)}</div>
							</div>
							<Button
								variant="ghost"
								size="icon"
								className={cn(
									"h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
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
					))}
				</div>
			</div>
		</SidePanel>
	);
}
