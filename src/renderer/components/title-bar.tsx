import { cn } from "@/lib/utils";
import { AITabTrigger } from "./ai-tab-trigger";
import { NavigationControls } from "./navigation-controls";
import SettingsMenu from "./settings-menu";
import { StreamsTabTrigger } from "./streams-tab-trigger";
import { URLBar } from "./url-bar";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RefObject } from "react";

type Theme = "system" | "light" | "dark";

interface TitleBarProps {
	url: string;
	favicon?: string;
	isLoading: boolean;
	currentView: "webview" | "settings";
	theme: Theme;
	canGoBack: boolean;
	canGoForward: boolean;
	onUrlChange: (url: string) => void;
	onUrlSubmit: (e: React.FormEvent) => void;
	onNavigate: (action: "back" | "forward" | "refresh" | "stop") => void;
	onThemeChange: () => void;
	onViewChange: (view: "webview" | "settings") => void;
	onAddTab: () => void;
	urlInputRef?: RefObject<HTMLInputElement | null>;
	shouldFocusAndSelect?: boolean;
}

export function TitleBar({
	url,
	favicon,
	isLoading,
	currentView,
	theme,
	canGoBack,
	canGoForward,
	onUrlChange,
	onUrlSubmit,
	onNavigate,
	onThemeChange,
	onViewChange,
	onAddTab,
	urlInputRef,
	shouldFocusAndSelect,
}: TitleBarProps) {
	return (
		<div
			className={cn(
				"h-10 flex items-center gap-2 px-2 bg-background draggable",
			)}
		>
			<div className="w-[65px]" />
			<StreamsTabTrigger />
			<NavigationControls
				onNavigate={onNavigate}
				isLoading={isLoading}
				canGoBack={canGoBack}
				canGoForward={canGoForward}
			/>
			<URLBar
				url={url}
				favicon={favicon}
				isLoading={isLoading}
				currentView={currentView}
				onChange={onUrlChange}
				onSubmit={onUrlSubmit}
				urlInputRef={urlInputRef}
				shouldFocusAndSelect={shouldFocusAndSelect}
			/>
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 p-1 rounded-full non-draggable"
				onClick={onAddTab}
				aria-label="New Tab"
			>
				<Plus className="h-4 w-4" />
			</Button>
			<div className="w-8" />
			<AITabTrigger />
			<SettingsMenu onViewChange={onViewChange} onUrlChange={onUrlChange} />
		</div>
	);
}
