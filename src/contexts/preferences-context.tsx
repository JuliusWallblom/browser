import { getPreference, setPreference } from "@/lib/preferences-db";
import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	type ReactNode,
} from "react";

export type TabLayout = "vertical" | "horizontal";

const PREFERENCE_KEY_TAB_LAYOUT = "tabLayout";
const PREFERENCE_KEY_PREVIEW_TABS = "previewTabs";

interface PreferencesContextType {
	tabLayout: TabLayout;
	setTabLayout: (layout: TabLayout) => void;
	previewTabs: boolean;
	setPreviewTabs: (enabled: boolean) => void;
	isLoadingPreferences: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(
	undefined,
);

interface PreferencesProviderProps {
	children: ReactNode;
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
	const [tabLayout, setTabLayoutInternal] = useState<TabLayout>("vertical");
	const [previewTabs, setPreviewTabsInternal] = useState<boolean>(true);
	const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);

	useEffect(() => {
		let isMounted = true;
		async function loadPreferences() {
			try {
				const storedLayout = await getPreference<TabLayout>(
					PREFERENCE_KEY_TAB_LAYOUT,
					"vertical",
				);
				const storedPreviewTabs = await getPreference<boolean>(
					PREFERENCE_KEY_PREVIEW_TABS,
					true,
				);
				if (isMounted) {
					setTabLayoutInternal(storedLayout);
					setPreviewTabsInternal(storedPreviewTabs);
				}
			} catch (error) {
				console.error("Failed to load preferences:", error);
				// Keep default values if loading fails
			} finally {
				if (isMounted) {
					setIsLoadingPreferences(false);
				}
			}
		}

		loadPreferences();
		return () => {
			isMounted = false;
		};
	}, []);

	const setTabLayout = useCallback(async (layout: TabLayout) => {
		setTabLayoutInternal(layout);
		try {
			await setPreference<TabLayout>(PREFERENCE_KEY_TAB_LAYOUT, layout);
		} catch (error) {
			console.error("Failed to save tab layout preference:", error);
			// Potentially revert UI or notify user
		}
	}, []);

	const setPreviewTabs = useCallback(async (enabled: boolean) => {
		setPreviewTabsInternal(enabled);
		try {
			await setPreference<boolean>(PREFERENCE_KEY_PREVIEW_TABS, enabled);
		} catch (error) {
			console.error("Failed to save preview tabs preference:", error);
			// Potentially revert UI or notify user
		}
	}, []);

	return (
		<PreferencesContext.Provider
			value={{
				tabLayout,
				setTabLayout,
				previewTabs,
				setPreviewTabs,
				isLoadingPreferences,
			}}
		>
			{children}
		</PreferencesContext.Provider>
	);
}

export function usePreferences(): PreferencesContextType {
	const context = useContext(PreferencesContext);
	if (context === undefined) {
		throw new Error("usePreferences must be used within a PreferencesProvider");
	}
	return context;
}
