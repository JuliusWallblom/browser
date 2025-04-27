import { Monitor, Moon, Sun } from "lucide-react";

type Theme = "system" | "light" | "dark";

interface ThemeToggleProps {
	theme: Theme;
	onThemeChange: () => void;
}

export function ThemeToggle({ theme, onThemeChange }: ThemeToggleProps) {
	const getThemeIcon = () => {
		switch (theme) {
			case "system":
				return <Monitor size="16" />;
			case "light":
				return <Sun size="16" />;
			case "dark":
				return <Moon size="16" />;
		}
	};

	return (
		<div className="w-[70px] flex items-center justify-end pr-2">
			<button
				type="button"
				onClick={onThemeChange}
				className="p-1.5 text-secondary hover:bg-background-tertiary rounded-full non-draggable"
				aria-label={`Current theme: ${theme}. Click to cycle themes.`}
				title={`Theme: ${theme}`}
			>
				{getThemeIcon()}
			</button>
		</div>
	);
}
