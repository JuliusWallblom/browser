import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, ListTree, RotateCcw, X } from "lucide-react";

interface NavigationControlsProps {
	onNavigate: (action: "back" | "forward" | "refresh" | "stop") => void;
	isLoading: boolean;
	canGoBack: boolean;
	canGoForward: boolean;
}

export function NavigationControls({
	onNavigate,
	isLoading,
	canGoBack,
	canGoForward,
}: NavigationControlsProps) {
	return (
		<div className={cn("flex items-center gap-2")}>
			<Button
				type="button"
				onClick={() => onNavigate("back")}
				disabled={!canGoBack}
				className={cn(
					"h-auto p-1 rounded-full non-draggable",
					"text-foreground",
					canGoBack ? "hover:bg-muted" : "opacity-50 cursor-not-allowed",
				)}
				aria-label="Go back"
			>
				<ArrowLeft size="16" />
			</Button>
			<Button
				type="button"
				onClick={() => onNavigate("forward")}
				disabled={!canGoForward}
				className={cn(
					"h-auto p-1 rounded-full non-draggable",
					"text-foreground",
					canGoForward ? "hover:bg-muted" : "opacity-50 cursor-not-allowed",
				)}
				aria-label="Go forward"
			>
				<ArrowRight size="16" />
			</Button>
			<Button
				type="button"
				onClick={() => {
					onNavigate(isLoading ? "stop" : "refresh");
				}}
				className={cn(
					"h-auto p-1 rounded-full non-draggable",
					"text-foreground hover:bg-muted",
				)}
				aria-label={isLoading ? "Stop loading" : "Refresh page"}
			>
				{isLoading ? <X size="16" /> : <RotateCcw size="16" />}
			</Button>
		</div>
	);
}
