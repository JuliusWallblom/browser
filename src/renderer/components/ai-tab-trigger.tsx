import { Button } from "@/components/ui/button";
import { usePanels } from "@/hooks/use-panels";
import { cn } from "@/lib/utils";
import { WandSparkles } from "lucide-react";

export function AITabTrigger() {
	const { isRightPanelOpen, toggleRightPanel } = usePanels();

	return (
		<div className={cn("flex items-center gap-2")}>
			<Button
				size="icon"
				type="button"
				onClick={toggleRightPanel}
				className={cn(
					"h-auto p-1 rounded-full non-draggable",
					"text-muted-foreground hover:bg-muted",
					isRightPanelOpen && "text-primary",
				)}
				aria-label={
					isRightPanelOpen ? "Close AI assistant" : "Open AI assistant"
				}
			>
				<WandSparkles size="16" />
			</Button>
		</div>
	);
}
