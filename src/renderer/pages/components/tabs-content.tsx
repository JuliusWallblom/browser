import { useTheme } from "@/hooks/use-theme";
import { usePreferences, type TabLayout } from "@/contexts/preferences-context";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import SettingsItem from "./settings-item";
import { RadioGroup } from "@/components/ui/radio-group";
import TabLayoutOption from "./tab-layout-option";
import { Switch } from "@/components/ui/switch";
import horizontalTabsDark from "../../../../assets/images/horizontal_tabs_dark.png";
import horizontalTabsLight from "../../../../assets/images/horizontal_tabs_light.png";
import verticalTabsDark from "../../../../assets/images/vertical_tabs_dark.png";
import verticalTabsLight from "../../../../assets/images/vertical_tabs_light.png";

export default function TabsContent() {
	const { effectiveTheme } = useTheme();
	const {
		tabLayout,
		setTabLayout,
		previewTabs,
		setPreviewTabs,
		isLoadingPreferences,
	} = usePreferences();

	return (
		<div className="w-full">
			<p className="text-xs font-normal tracking-widest uppercase text-muted-foreground mb-2 -mt-1">
				Tabs
			</p>
			<section className="space-y-0">
				<Card className="overflow-hidden">
					<CardContent className="p-0 border-none">
						<SettingsItem
							label="Tab Layout"
							description="Select the layout of the tabs."
							controlLayout="stacked"
						>
							{isLoadingPreferences ? (
								<p className="text-sm text-muted-foreground py-3 px-2">
									Loading preference...
								</p>
							) : (
								<RadioGroup
									value={tabLayout}
									onValueChange={(value) => setTabLayout(value as TabLayout)}
									className="mt-4 mb-2 flex flex-row gap-4"
								>
									<TabLayoutOption
										value="vertical"
										currentLayout={tabLayout}
										imageDark={verticalTabsDark}
										imageLight={verticalTabsLight}
										label="Vertical"
										effectiveTheme={effectiveTheme}
									/>
									<TabLayoutOption
										value="horizontal"
										currentLayout={tabLayout}
										imageDark={horizontalTabsDark}
										imageLight={horizontalTabsLight}
										label="Horizontal"
										effectiveTheme={effectiveTheme}
									/>
								</RadioGroup>
							)}
						</SettingsItem>
						<Separator className="my-0" />
						<SettingsItem
							label="Preview Tabs"
							description="Enable or disable tab previews on hover."
							control={
								isLoadingPreferences ? (
									<p className="text-sm text-muted-foreground">Loading...</p>
								) : (
									<Switch
										id="preview-tabs-switch"
										checked={previewTabs}
										onCheckedChange={setPreviewTabs}
									/>
								)
							}
						/>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
