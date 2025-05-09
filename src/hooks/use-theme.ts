import { useEffect, useState, useCallback } from "react";
import { getPreference, setPreference } from "@/lib/preferences-db";

export type Theme = "system" | "light" | "dark";

const PREFERENCE_KEY_THEME = "themePreference"; // New preference key

export function useTheme() {
	// Initialize with a default and mark as loading
	const [theme, setThemeInternal] = useState<Theme>("system");
	const [isLoadingTheme, setIsLoadingTheme] = useState(true);
	const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

	// Effect for system theme changes (remains the same)
	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const updateSystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
			setSystemTheme(e.matches ? "dark" : "light");
		};

		updateSystemTheme(mediaQuery);
		mediaQuery.addEventListener("change", updateSystemTheme);

		return () => mediaQuery.removeEventListener("change", updateSystemTheme);
	}, []);

	// Effect to load theme from IndexedDB on mount
	useEffect(() => {
		let isMounted = true;
		async function loadThemePreference() {
			setIsLoadingTheme(true);
			try {
				const storedTheme = await getPreference<Theme>(
					PREFERENCE_KEY_THEME,
					"system", // Default value
				);
				if (isMounted) {
					setThemeInternal(storedTheme);
				}
			} catch (error) {
				console.error("Failed to load theme preference:", error);
				if (isMounted) {
					setThemeInternal("system"); // Fallback to default
				}
			} finally {
				if (isMounted) {
					setIsLoadingTheme(false);
				}
			}
		}
		loadThemePreference();
		return () => {
			isMounted = false;
		};
	}, []);

	// Effect to apply theme to DOM and save to IndexedDB when 'theme' or 'systemTheme' changes
	useEffect(() => {
		if (isLoadingTheme) return; // Don\'t apply or save if still loading

		const effectiveTheme = theme === "system" ? systemTheme : theme;

		if (effectiveTheme === "dark") {
			document.documentElement.classList.add("dark");
			document.documentElement.classList.remove("light");
		} else {
			document.documentElement.classList.add("light");
			document.documentElement.classList.remove("dark");
		}

		// Save the user-selected theme (not the effective theme)
		setPreference<Theme>(PREFERENCE_KEY_THEME, theme).catch((error) => {
			console.error("Failed to save theme preference:", error);
		});
	}, [theme, systemTheme, isLoadingTheme]);

	const setTheme = useCallback((newTheme: Theme) => {
		setThemeInternal(newTheme);
		// The useEffect above will handle saving to DB
	}, []);

	const cycleTheme = useCallback(() => {
		const themeOrder: Theme[] = ["system", "light", "dark"];
		setThemeInternal((currentTheme) => {
			const currentIndex = themeOrder.indexOf(currentTheme);
			const nextIndex = (currentIndex + 1) % themeOrder.length;
			const newTheme = themeOrder[nextIndex];
			// The useEffect for saving will be triggered by setThemeInternal
			return newTheme;
		});
	}, []);

	// Determine the effective theme to be applied
	const effectiveTheme = theme === "system" ? systemTheme : theme;

	// Return isLoadingTheme if consuming components need to know
	return { theme, setTheme, cycleTheme, isLoadingTheme, effectiveTheme };
}
