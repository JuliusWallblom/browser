import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { useTabs } from "../../contexts/tabs-context";
import { useWebviews } from "../../contexts/webview-context";
import { SettingsPage } from "../pages/settings";
import { WebView } from "./browser-webview";

export function BrowserContent() {
	// Removed props from destructuring
	const { tabs, activeTabId, updateTab } = useTabs();
	const { webviewRefs } = useWebviews();

	const activeTab = tabs.find((tab) => tab.id === activeTabId);

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
				className={cn(
					"flex-1 relative",
					activeTab?.view !== "webview" && "hidden",
				)}
			>
				{tabs.map((tab) => (
					<WebView
						key={tab.id}
						tab={tab}
						isActive={tab.id === activeTabId}
						onWebviewRef={handleWebviewRef}
						updateTab={updateTab}
						// onViewChange will be removed from WebViewProps later
					/>
				))}
			</div>
			{activeTab?.view === "settings" && (
				<div className="flex-1 bg-background-primary overflow-auto">
					<SettingsPage />
				</div>
			)}
		</>
	);
}
