import { Button } from "@/components/ui/button";
import { usePanels } from "@/hooks/use-panels";
import { cn } from "@/lib/utils";
import {
	BotMessageSquare,
	Brain,
	Command,
	Ghost,
	MousePointer,
	MousePointer2,
	PanelRight,
	Shield,
} from "lucide-react";
// We'll use our custom icon instead of the one from lucide-react directly here.
// import { BotMessageSquare } from "lucide-react";
// import { GradientBotMessageSquareIcon } from "./gradient-bot-message-square-icon";

export function AITabTrigger() {
	const { isRightPanelOpen, toggleRightPanel } = usePanels();
	const gradientId = "ai-tab-trigger-gradient";

	return (
		<>
			<svg
				width="0"
				height="0"
				style={{ position: "absolute", visibility: "hidden" }}
			>
				<title>Gradient Definitions</title>
				<defs>
					<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="#007eff" /> {/* Deep Purple */}
						<stop offset="100%" stopColor="#00d2ff" /> {/* Vibrant Blue */}
					</linearGradient>
				</defs>
			</svg>
			<Button
				variant="ghost"
				size="icon"
				type="button"
				onClick={toggleRightPanel}
				className={cn(
					"h-auto w-auto p-1 non-draggable",
					"text-muted-foreground",
					isRightPanelOpen && "text-primary",
				)}
				aria-label={
					isRightPanelOpen ? "Close AI assistant" : "Open AI assistant"
				}
			>
				<BotMessageSquare
					className="!w-4 !h-4"
					color={`url(#${gradientId})`}
					fill={`url(#${gradientId})`}
				/>
			</Button>
		</>
	);
}
