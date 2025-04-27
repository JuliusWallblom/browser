import { useEffect, useState } from "react";

export type Theme = "system" | "light" | "dark";

export function useTheme() {
	const [theme, setTheme] = useState<Theme>(() => {
		return (localStorage.getItem("theme") as Theme) || "system";
	});
	const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const updateSystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
			setSystemTheme(e.matches ? "dark" : "light");
		};

		updateSystemTheme(mediaQuery);
		mediaQuery.addEventListener("change", updateSystemTheme);

		return () => mediaQuery.removeEventListener("change", updateSystemTheme);
	}, []);

	useEffect(() => {
		const effectiveTheme = theme === "system" ? systemTheme : theme;

		if (effectiveTheme === "dark") {
			document.documentElement.classList.add("dark");
			document.documentElement.classList.remove("light");
		} else {
			document.documentElement.classList.add("light");
			document.documentElement.classList.remove("dark");
		}

		localStorage.setItem("theme", theme);
	}, [theme, systemTheme]);

	const cycleTheme = () => {
		const themeOrder: Theme[] = ["system", "light", "dark"];
		const currentIndex = themeOrder.indexOf(theme);
		const nextIndex = (currentIndex + 1) % themeOrder.length;
		setTheme(themeOrder[nextIndex]);
	};

	return { theme, cycleTheme };
}
