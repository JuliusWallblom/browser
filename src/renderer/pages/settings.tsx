import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun } from "lucide-react";
import { Monitor } from "lucide-react";
import React from "react";

export function SettingsPage() {
	const { theme, cycleTheme } = useTheme();
	const themeIcon = {
		system: <Monitor size={16} />,
		light: <Sun size={16} />,
		dark: <Moon size={16} />,
	}[theme];
	return (
		<div className="flex flex-col p-8 bg-background-primary text-primary min-h-screen">
			<h1 className="text-3xl font-bold mb-6">Merlin Settings</h1>

			<div className="space-y-6">
				<section className="space-y-4">
					<h2 className="text-xl font-semibold">Browser Settings</h2>
					<div className="space-y-2">
						<p className="text-secondary">
							Configure your browsing experience with Merlin.
						</p>
					</div>
				</section>

				<section className="space-y-4">
					<h2 className="text-xl font-semibold">AI Assistant Settings</h2>
					<div className="space-y-2">
						<p className="text-secondary">
							Customize how the AI assistant interacts with your browsing.
						</p>
					</div>
				</section>

				<section className="space-y-4">
					<h2 className="text-xl font-semibold">About Merlin</h2>
					<div className="space-y-2">
						<p className="text-secondary">Version: 1.0.0</p>
						<p className="text-secondary">
							A modern browser with built-in AI capabilities.
						</p>
					</div>
				</section>
				<button
					type="button"
					onClick={cycleTheme}
					className="p-1 text-secondary hover:bg-background-tertiary rounded-full non-draggable"
					aria-label="Toggle theme"
				>
					{themeIcon}
				</button>
			</div>
		</div>
	);
}
