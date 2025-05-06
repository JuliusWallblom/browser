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

interface PreferencesContextType {
	tabLayout: TabLayout;
	setTabLayout: (layout: TabLayout) => void;
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
	const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);

	useEffect(() => {
		let isMounted = true;
		async function loadPreferences() {
			try {
				const storedLayout = await getPreference<TabLayout>(
					PREFERENCE_KEY_TAB_LAYOUT,
					"vertical",
				);
				if (isMounted) {
					setTabLayoutInternal(storedLayout);
				}
			} catch (error) {
				console.error("Failed to load tab layout preference:", error);
				// Keep default 'vertical' if loading fails
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

	return (
		<PreferencesContext.Provider
			value={{ tabLayout, setTabLayout, isLoadingPreferences }}
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
