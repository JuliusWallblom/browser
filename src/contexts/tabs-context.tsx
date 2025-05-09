import { DEFAULT_URL } from "@/constants/app";
import type { Tab } from "@/types/tab";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useState } from "react";
import { useWebviews } from "./webview-context";
import { usePreferences } from "./preferences-context";

interface TabsContextType {
	tabs: Tab[];
	activeTabId: string | null;
	addTab: (tab: Partial<Tab>) => string;
	removeTab: (id: string) => void;
	updateTab: (id: string, updates: Partial<Tab>) => void;
	setActiveTab: (id: string) => void;
	previewImages: Record<string, string | null>;
	loadingPreviews: Record<string, boolean>;
	capturedUrlsForTabs: Record<string, string>;
	captureAndStoreTabPreview: (tab: Tab) => Promise<boolean>;
}

const TabsContext = createContext<TabsContextType | null>(null);

export function TabsProvider({ children }: { children: ReactNode }) {
	const [tabs, setTabs] = useState<Tab[]>([]);
	const [activeTabId, setActiveTabId] = useState<string | null>(null);

	const [previewImages, setPreviewImages] = useState<
		Record<string, string | null>
	>({});
	const [loadingPreviews, setLoadingPreviews] = useState<
		Record<string, boolean>
	>({});
	const [capturedUrlsForTabs, setCapturedUrlsForTabs] = useState<
		Record<string, string>
	>({});

	const { webviewRefs } = useWebviews();
	const { previewTabs } = usePreferences();

	const addTab = useCallback((tabPartial: Partial<Tab>) => {
		const newTab: Tab = {
			id: crypto.randomUUID(),
			url: tabPartial.url || DEFAULT_URL,
			title: tabPartial.title || "New Tab",
			isLoading: !!tabPartial.url && tabPartial.url !== "about:blank",
			webviewKey: Date.now(),
			canGoBack: false,
			canGoForward: false,
			view: "webview",
			...tabPartial,
			isDomReady: false,
		};

		setTabs((prevTabs) => [...prevTabs, newTab]);
		setActiveTabId(newTab.id);
		return newTab.id;
	}, []);

	const removeTab = useCallback(
		(id: string) => {
			setTabs((prev) => {
				const newTabs = prev.filter((tab) => tab.id !== id);
				if (id === activeTabId) {
					const index = prev.findIndex((tab) => tab.id === id);
					const nextTab = newTabs[index] || newTabs[index - 1] || newTabs[0];
					setActiveTabId(nextTab?.id || null);
				}
				return newTabs;
			});
		},
		[activeTabId],
	);

	const updateTab = useCallback((id: string, updates: Partial<Tab>) => {
		setTabs((prev) =>
			prev.map((tab) => (tab.id === id ? { ...tab, ...updates } : tab)),
		);
	}, []);

	const setActiveTab = useCallback((id: string) => {
		setActiveTabId(id);
	}, []);

	const captureAndStoreTabPreview = useCallback(
		async (tab: Tab): Promise<boolean> => {
			const tabId = tab.id;

			const shouldAttemptCapture =
				previewTabs &&
				!loadingPreviews[tabId] &&
				!tab.isLoading &&
				tab.url &&
				tab.url !== "about:blank" &&
				!tab.url.startsWith("manta://");

			if (!shouldAttemptCapture) {
				return false;
			}

			const webview = webviewRefs.current.get(tabId);
			if (!webview || typeof webview.capturePage !== "function") {
				return false;
			}

			setLoadingPreviews((prev) => ({ ...prev, [tabId]: true }));
			try {
				const image = await webview.capturePage();
				const dataUrl = image.toDataURL();
				setPreviewImages((prev) => ({ ...prev, [tabId]: dataUrl }));
				setCapturedUrlsForTabs((prev) => ({ ...prev, [tabId]: tab.url }));
				return true;
			} catch (error) {
				console.error(
					`[TabsContextPreview] Failed to capture tab preview for tabId: ${tabId}:`,
					error,
				);
				setPreviewImages((prev) => ({ ...prev, [tabId]: null }));
				return false;
			} finally {
				setLoadingPreviews((prev) => ({ ...prev, [tabId]: false }));
			}
		},
		[previewTabs, webviewRefs, loadingPreviews],
	);

	return (
		<TabsContext.Provider
			value={{
				tabs,
				activeTabId,
				addTab,
				removeTab,
				updateTab,
				setActiveTab,
				previewImages,
				loadingPreviews,
				capturedUrlsForTabs,
				captureAndStoreTabPreview,
			}}
		>
			{children}
		</TabsContext.Provider>
	);
}

export function useTabs() {
	const context = useContext(TabsContext);
	if (!context) {
		throw new Error("useTabs must be used within a TabsProvider");
	}
	return context;
}
