import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun, ArrowLeft, Monitor, Rows, Columns } from "lucide-react";
import React from "react";
import { usePreferences, type TabLayout } from "@/contexts/preferences-context";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

export function SettingsPage() {
	const { theme, cycleTheme } = useTheme();
	const {
		tabLayout,
		setTabLayout,
		previewTabs,
		setPreviewTabs,
		isLoadingPreferences,
	} = usePreferences();

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
					<h2 className="text-xl font-semibold">Appearance</h2>
					<Separator />
					<div className="space-y-4">
						<div>
							<Label className="text-base">Tab Layout</Label>
							<p className="text-sm text-muted-foreground mb-2">
								Choose how tabs are displayed.
							</p>
							{isLoadingPreferences ? (
								<p className="text-sm text-muted-foreground">
									Loading preference...
								</p>
							) : (
								<RadioGroup
									value={tabLayout}
									onValueChange={(value) => setTabLayout(value as TabLayout)}
									className="flex flex-col space-y-1"
								>
									<Label
										htmlFor="vertical-tabs"
										className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
									>
										<RadioGroupItem value="vertical" id="vertical-tabs" />
										<Rows className="w-4 h-4 mr-2" />
										<span>Vertical Tabs</span>
									</Label>
									<Label
										htmlFor="horizontal-tabs"
										className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
									>
										<RadioGroupItem value="horizontal" id="horizontal-tabs" />
										<Columns className="w-4 h-4 mr-2" />
										<span>Horizontal Tabs</span>
									</Label>
								</RadioGroup>
							)}
						</div>
						<div>
							<Label className="text-base">Theme</Label>
							<Button
								size="icon"
								variant="secondary"
								type="button"
								onClick={cycleTheme}
								className="h-8 w-8 text-foreground non-draggable rounded-full ml-2 align-middle"
								aria-label="Toggle theme"
							>
								{themeIcon}
							</Button>
						</div>
						<div>
							<Label className="text-base">Preview Tabs</Label>
							<p className="text-sm text-muted-foreground mb-2">
								Enable or disable tab previews on hover.
							</p>
							{isLoadingPreferences ? (
								<p className="text-sm text-muted-foreground">
									Loading preference...
								</p>
							) : (
								<div className="flex items-center space-x-2">
									<Switch
										id="preview-tabs-switch"
										checked={previewTabs}
										onCheckedChange={setPreviewTabs}
									/>
									<Label htmlFor="preview-tabs-switch">
										{previewTabs ? "Enabled" : "Disabled"}
									</Label>
								</div>
							)}
						</div>
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
			</div>
		</div>
	);
}
