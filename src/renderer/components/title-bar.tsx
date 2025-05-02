import { cn } from "@/lib/utils";
import { AITabTrigger } from "./ai-tab-trigger";
import { NavigationControls } from "./navigation-controls";
import SettingsMenu from "./settings-menu";
import { StreamsTabTrigger } from "./streams-tab-trigger";
import { URLBar } from "./url-bar";

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
			/>
			<div className="w-8" />
			<AITabTrigger />
			<SettingsMenu onViewChange={onViewChange} onUrlChange={onUrlChange} />
		</div>
	);
}
