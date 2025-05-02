import { useCallback } from "react";
import { WebView } from "./browser-webview";
import { useTabs } from "../contexts/tabs-context";
import { SettingsPage } from "../pages/settings";
import { cn } from "@/lib/utils";
import { useWebviews } from "../contexts/webview-context";

interface BrowserContentProps {
	currentView: "webview" | "settings";
	onViewChange: (view: "webview" | "settings") => void;
}

export function BrowserContent({
	currentView,
	onViewChange,
}: BrowserContentProps) {
	const { tabs, activeTabId, updateTab } = useTabs();
	const { webviewRefs } = useWebviews();

	const handleWebviewRef = useCallback(
		(webview: Electron.WebviewTag | null, tabId: string) => {
			if (webview) {
				webviewRefs.current.set(tabId, webview);
			} else {
				webviewRefs.current.delete(tabId);
			}
		},
		[webviewRefs],
	);

	return (
		<>
			<div
				className={cn("flex-1 relative", currentView !== "webview" && "hidden")}
			>
				{tabs.map((tab) => (
					<WebView
						key={tab.id}
						tab={tab}
						isActive={tab.id === activeTabId}
						onWebviewRef={handleWebviewRef}
						updateTab={updateTab}
					/>
				))}
			</div>
			{currentView === "settings" && (
				<div className="flex-1 bg-background-primary overflow-auto">
					<SettingsPage
						onViewChange={onViewChange}
						onUrlChange={(url) => {
							if (activeTabId) {
								updateTab(activeTabId, { url });
							}
						}}
					/>
				</div>
			)}
		</>
	);
}
