import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import type { RefObject } from "react";
import { AITabTrigger } from "./ai-tab-trigger";
import { NavigationControls } from "./navigation-controls";
import SettingsMenu from "./settings-menu";
import { StreamsTabTrigger } from "./streams-tab-trigger";
import { URLBar } from "./url-bar";
import { usePreferences } from "@/contexts/preferences-context";

interface TitleBarProps {
	url: string;
	activeUrl: string;
	favicon?: string;
	isLoading: boolean;
	currentView: "webview" | "settings";
	canGoBack: boolean;
	canGoForward: boolean;
	canGoForwardToSettings?: boolean;
	onUrlChange: (url: string) => void;
	onUrlSubmit: (e: React.FormEvent) => void;
	onNavigate: (
		action: "back" | "forward" | "refresh" | "stop" | "force-refresh",
	) => void;
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
	canGoBack,
	canGoForward,
	canGoForwardToSettings,
	onUrlChange,
	onUrlSubmit,
	onNavigate,
	onAddTab,
	urlInputRef,
	shouldFocusAndSelect,
	isError,
	onNavigateTo,
}: TitleBarProps) {
	const { tabLayout } = usePreferences();

	return (
		<div
			className={cn(
				"h-10 flex w-full items-center justify-start gap-2 px-2 bg-background draggable",
			)}
		>
			{tabLayout === "vertical" && <div className="w-[65px] shrink-0" />}
			<StreamsTabTrigger />
			<NavigationControls
				onNavigate={onNavigate}
				isLoading={isLoading}
				canGoBack={canGoBack}
				canGoForward={canGoForward}
				canGoForwardToSettings={canGoForwardToSettings}
				activeUrl={activeUrl}
				currentView={currentView}
			/>
			<div className="flex flex-1 items-center justify-start gap-2 w-full">
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
				{tabLayout === "vertical" && (
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6 p-1 non-draggable z-40 text-muted-foreground"
						onClick={onAddTab}
						aria-label="New Tab"
					>
						<Plus className="!w-4 !h-4" />
					</Button>
				)}
			</div>
			<AITabTrigger />
			<SettingsMenu onNavigateTo={onNavigateTo} />
		</div>
	);
}
