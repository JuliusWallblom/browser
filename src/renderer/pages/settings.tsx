import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun } from "lucide-react";
import { ArrowLeft, Monitor } from "lucide-react";
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
			<div className="space-y-6">
				<section className="space-y-4">
					<h2 className="text-xl font-semibold">Browser Settings</h2>
					<Separator />
					<div className="space-y-2">
						<p className="text-muted-foreground">
							Configure your browsing experience.
						</p>
					</div>
				</section>

				<section className="space-y-4">
					<h2 className="text-xl font-semibold">AI Assistant Settings</h2>
					<div className="space-y-2">
						<p className="text-muted-foreground">
							Customize how the AI assistant interacts with your browsing.
						</p>
					</div>
				</section>

				<section className="space-y-4">
					<h2 className="text-xl font-semibold">About</h2>
					<div className="space-y-2">
						<p className="text-muted-foreground">Version: 1.0.0</p>
						<p className="text-muted-foreground">
							A modern browser with built-in AI capabilities.
						</p>
					</div>
				</section>
				<Button
					size="icon"
					variant="secondary"
					type="button"
					onClick={cycleTheme}
					className="h-8 w-8 text-foreground non-draggable rounded-full"
					aria-label="Toggle theme"
				>
					{themeIcon}
				</Button>
			</div>
		</div>
	);
}
