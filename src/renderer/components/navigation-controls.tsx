import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, RotateCcw, X } from "lucide-react";

interface NavigationControlsProps {
	onNavigate: (action: "back" | "forward" | "refresh" | "stop") => void;
	isLoading: boolean;
	canGoBack: boolean;
	canGoForward: boolean;
	url: string;
}

export function NavigationControls({
	onNavigate,
	isLoading,
	canGoBack,
	canGoForward,
	url,
}: NavigationControlsProps) {
	const isBlankPage = url === "about:blank";

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
				disabled={isBlankPage}
				className={cn(
					"h-auto w-auto p-1 rounded-full non-draggable",
					isBlankPage && "opacity-50 cursor-not-allowed",
				)}
				aria-label={isLoading ? "Stop loading" : "Refresh page"}
			>
				{isLoading ? <X size="16" /> : <RotateCcw size="16" />}
			</Button>
		</div>
	);
}
