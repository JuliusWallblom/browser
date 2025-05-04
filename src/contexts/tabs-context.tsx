import { DEFAULT_URL } from "@/constants/app";
import type { Tab } from "@/types/tab";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useState } from "react";

interface TabsContextType {
	tabs: Tab[];
	activeTabId: string | null;
	addTab: (tab: Partial<Tab>) => string;
	removeTab: (id: string) => void;
	updateTab: (id: string, updates: Partial<Tab>) => void;
	setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

export function TabsProvider({ children }: { children: ReactNode }) {
	const [tabs, setTabs] = useState<Tab[]>([]);
	const [activeTabId, setActiveTabId] = useState<string | null>(null);

	const addTab = useCallback((tab: Partial<Tab>) => {
		const newTab: Tab = {
			id: crypto.randomUUID(),
			url: tab.url || DEFAULT_URL,
			title: tab.title || "New Tab",
			isLoading: false,
			webviewKey: Date.now(),
			canGoBack: false,
			canGoForward: false,
			...tab,
		};

		setTabs((prevTabs) => [...prevTabs, newTab]);
		setActiveTabId(newTab.id);
		return newTab.id;
	}, []);

	const removeTab = useCallback(
		(id: string) => {
			setTabs((prev) => {
				const newTabs = prev.filter((tab) => tab.id !== id);
				// If we're removing the active tab, activate the next available tab
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

	return (
		<TabsContext.Provider
			value={{
				tabs,
				activeTabId,
				addTab,
				removeTab,
				updateTab,
				setActiveTab,
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
