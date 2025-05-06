import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CircleFadingPlus, CirclePlus, Plus } from "lucide-react";
import type { RefObject } from "react";
import { AITabTrigger } from "./ai-tab-trigger";
import { NavigationControls } from "./navigation-controls";
import SettingsMenu from "./settings-menu";
import { StreamsTabTrigger } from "./streams-tab-trigger";
import { URLBar } from "./url-bar";

type Theme = "system" | "light" | "dark";

interface TitleBarProps {
	url: string;
	activeUrl: string;
	favicon?: string;
	isLoading: boolean;
	currentView: "webview" | "settings";
	theme: Theme;
	canGoBack: boolean;
	canGoForward: boolean;
	canGoForwardToSettings?: boolean;
	onUrlChange: (url: string) => void;
	onUrlSubmit: (e: React.FormEvent) => void;
	onNavigate: (
		action: "back" | "forward" | "refresh" | "stop" | "force-refresh",
	) => void;
	onThemeChange: () => void;
	onViewChange: (view: "webview" | "settings") => void;
	onAddTab: () => void;
	urlInputRef?: RefObject<HTMLInputElement | null>;
	shouldFocusAndSelect?: boolean;
	isError?: boolean;
	onNavigateTo: (url: string) => void;
}

export function TitleBar({
	url,
	activeUrl,
	favicon,
	isLoading,
	currentView,
	theme,
	canGoBack,
	canGoForward,
	canGoForwardToSettings,
	onUrlChange,
	onUrlSubmit,
	onNavigate,
	onThemeChange,
	onViewChange,
	onAddTab,
	urlInputRef,
	shouldFocusAndSelect,
	isError,
	onNavigateTo,
}: TitleBarProps) {
	return (
		<div
			className={cn(
				"h-10 flex items-center justify-start gap-2 px-2 bg-background draggable",
			)}
		>
			<div className="w-[65px] shrink-0" />
			<StreamsTabTrigger />
			<NavigationControls
				onNavigate={onNavigate}
				isLoading={isLoading}
				canGoBack={canGoBack}
				canGoForward={canGoForward}
				canGoForwardToSettings={canGoForwardToSettings}
				url={url}
				activeUrl={activeUrl}
				currentView={currentView}
			/>
			<div className="flex items-center gap-2 w-full min-w-[146px]">
				<URLBar
					url={url}
					favicon={favicon}
					isLoading={isLoading}
					currentView={currentView}
					onChange={onUrlChange}
					onSubmit={onUrlSubmit}
					urlInputRef={urlInputRef}
					shouldFocusAndSelect={shouldFocusAndSelect}
					isError={isError}
				/>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 p-1 rounded-full non-draggable z-40 text-muted-foreground"
					onClick={onAddTab}
					aria-label="New Tab"
				>
					<Plus className="!w-4 !h-4" />
				</Button>
			</div>
			<div className="w-[20%]" />
			<AITabTrigger />
			<SettingsMenu onNavigateTo={onNavigateTo} />
		</div>
	);
}
