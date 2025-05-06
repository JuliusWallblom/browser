import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, RotateCcw, X } from "lucide-react";
import { useEffect } from "react";

interface NavigationControlsProps {
	onNavigate: (
		action: "back" | "forward" | "refresh" | "stop" | "force-refresh",
	) => void;
	isLoading: boolean;
	canGoBack: boolean;
	canGoForward: boolean;
	canGoForwardToSettings?: boolean;
	activeUrl: string;
	currentView: "webview" | "settings";
}

export function NavigationControls({
	onNavigate,
	isLoading,
	canGoBack,
	canGoForward,
	canGoForwardToSettings,
	activeUrl,
	currentView,
}: NavigationControlsProps) {
	const isBlankPage = activeUrl === "about:blank";
	useEffect(() => {
		if (!window.electron?.ipcRenderer) {
			console.error("IPC renderer not available");
			return;
		}

		const cleanup = window.electron.ipcRenderer.on(
			"navigation-action",
			(...args) => {
				const [action] = args;
				if (typeof action === "string") {
					onNavigate(
						action as "back" | "forward" | "refresh" | "stop" | "force-refresh",
					);
				}
			},
		);

		return cleanup;
	}, [onNavigate]);

	const handleContextMenu =
		(type: "back" | "forward" | "refresh") => (e: React.MouseEvent) => {
			e.preventDefault();

			if (!window.electron?.navigation) {
				console.error("Electron navigation API not available");
				return;
			}

			window.electron.navigation.showContextMenu(type, {
				canGoBack,
				canGoForward,
				isLoading,
			});
		};

	return (
		<div className={cn("flex items-center gap-2")}>
			<Button
				variant="ghost"
				type="button"
				onClick={() => {
					if (isLoading) {
						onNavigate("stop");
					}
					onNavigate("back");
				}}
				onContextMenu={handleContextMenu("back")}
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
				onClick={() => {
					if (isLoading) {
						onNavigate("stop");
					}
					onNavigate("forward");
				}}
				onContextMenu={handleContextMenu("forward")}
				disabled={!(canGoForward || canGoForwardToSettings)}
				className={cn(
					"h-auto w-auto p-1 rounded-full non-draggable",
					canGoForward || canGoForwardToSettings
						? "hover:bg-muted"
						: "opacity-50 cursor-not-allowed",
				)}
				aria-label="Go forward"
			>
				<ArrowRight size="16" />
			</Button>
			<Button
				variant="ghost"
				type="button"
				disabled={isBlankPage || currentView === "settings"}
				onClick={() => onNavigate(isLoading ? "stop" : "refresh")}
				onContextMenu={handleContextMenu("refresh")}
				className={cn("h-auto w-auto p-1 rounded-full non-draggable")}
				aria-label={isLoading ? "Stop loading" : "Refresh page"}
			>
				{isLoading ? <X size="16" /> : <RotateCcw size="16" />}
			</Button>
		</div>
	);
}
