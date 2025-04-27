import { Button } from "@/components/ui/button";
import { usePanels } from "@/hooks/use-panels";
import { cn } from "@/lib/utils";
import { ListTree } from "lucide-react";

export function StreamsTabTrigger() {
	const { isLeftPanelOpen, toggleLeftPanel } = usePanels();
	return (
		<div className={cn("flex items-center gap-2")}>
			<Button
				size="icon"
				type="button"
				onClick={toggleLeftPanel}
				className={cn(
					"h-auto p-1 rounded-full non-draggable",
					"text-muted-foreground hover:bg-muted",
					isLeftPanelOpen && "text-primary",
				)}
				aria-label={
					isLeftPanelOpen ? "Close AI assistant" : "Open AI assistant"
				}
			>
				<ListTree size="16" />
			</Button>
		</div>
	);
}
