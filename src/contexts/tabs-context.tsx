import type React from "react";
import { createContext, useContext, useState, useCallback } from "react";

export interface Tab {
	id: string;
	url: string;
	title: string;
	favicon?: string;
	isLoading: boolean;
	webviewKey: number;
}

interface TabsContextType {
	tabs: Tab[];
	activeTabId: string | null;
	addTab: (tab: Omit<Tab, "id">) => string;
	removeTab: (id: string) => void;
	updateTab: (id: string, updates: Partial<Tab>) => void;
	setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

export function TabsProvider({ children }: { children: React.ReactNode }) {
	const [tabs, setTabs] = useState<Tab[]>([]);
	const [activeTabId, setActiveTabId] = useState<string | null>(null);

	const addTab = useCallback((tab: Omit<Tab, "id">) => {
		const id = crypto.randomUUID();
		const newTab = { ...tab, id };
		setTabs((prev) => [...prev, newTab]);
		setActiveTabId(id);
		return id;
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
