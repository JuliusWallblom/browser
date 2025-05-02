import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, RotateCcw, X } from "lucide-react";

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
				variant="ghost"
				type="button"
				onClick={() => onNavigate("back")}
				disabled={!canGoBack}
				className={cn(
					"h-auto w-auto p-1 rounded-full non-draggable",
					canGoBack ? "hover:bg-muted" : "opacity-50 cursor-not-allowed",
				)}
				aria-label="Go back"
			>
				<ArrowLeft size="16" />
			</Button>
			<Button
				variant="ghost"
				type="button"
				onClick={() => onNavigate("forward")}
				disabled={!canGoForward}
				className={cn(
					"h-auto w-auto p-1 rounded-full non-draggable",
					canGoForward ? "hover:bg-muted" : "opacity-50 cursor-not-allowed",
				)}
				aria-label="Go forward"
			>
				<ArrowRight size="16" />
			</Button>
			<Button
				variant="ghost"
				type="button"
				onClick={() => onNavigate(isLoading ? "stop" : "refresh")}
				className={cn(
					"h-auto w-auto p-1 rounded-full non-draggable",
					isLoading ? "text-red-500 hover:text-red-600" : "",
				)}
				aria-label={isLoading ? "Stop loading" : "Refresh page"}
			>
				{isLoading ? <X size="16" /> : <RotateCcw size="16" />}
			</Button>
		</div>
	);
}
