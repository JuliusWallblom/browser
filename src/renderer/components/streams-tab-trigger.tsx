import { Button } from "@/components/ui/button";
import { useTabs } from "@/contexts/tabs-context";
import { usePanels } from "@/hooks/use-panels";
import { cn } from "@/lib/utils";
import { ListTree } from "lucide-react";

export function StreamsTabTrigger() {
	const { isLeftPanelOpen, toggleLeftPanel } = usePanels();
	const { tabs } = useTabs();

	return (
		<div className={cn("flex items-center gap-2")}>
			<div className="relative">
				<Button
					variant="ghost"
					size="icon"
					type="button"
					onClick={toggleLeftPanel}
					className={cn(
						"mt-0.5 h-auto w-auto p-1 rounded-full non-draggable",
						"text-muted-foreground",
						isLeftPanelOpen && "text-primary",
					)}
					aria-label={
						isLeftPanelOpen ? "Close AI assistant" : "Open AI assistant"
					}
				>
					<ListTree size="16" />
				</Button>
				{tabs.length > 1 && (
					<div className="pointer-events-none absolute top-0 right-0 h-3 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white px-0.5">
						<span className="-mt-[1px]">{tabs.length}</span>
					</div>
				)}
			</div>
		</div>
	);
}
