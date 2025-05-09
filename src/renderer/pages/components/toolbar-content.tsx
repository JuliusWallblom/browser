import React from "react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import SettingsItem from "./settings-item";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export default function ToolbarContent() {
	// State variables moved from AppearanceContent
	const [showHomeButton, setShowHomeButton] = React.useState(false);
	const [showBookmarksButton, setShowBookmarksButton] = React.useState(true);
	const [showBraveNews, setShowBraveNews] = React.useState(true);
	const [showLeoAI, setShowLeoAI] = React.useState(true);
	const [showBraveRewards, setShowBraveRewards] = React.useState(true);
	const [showBraveWallet, setShowBraveWallet] = React.useState(true);
	const [showBookmarksLocation, setShowBookmarksLocation] =
		React.useState("newTabPage"); // 'always', 'newTabPage'

	return (
		<>
			<h2 className="text-md font-semibold mb-4 -mt-1 pt-8">Toolbar</h2>
			<section className="space-y-0">
				<Card className="overflow-hidden">
					<CardContent className="p-0 border-none">
						<SettingsItem
							label="Show home button"
							description={showHomeButton ? "Enabled" : "Disabled"}
							control={
								<Switch
									checked={showHomeButton}
									onCheckedChange={setShowHomeButton}
									id="show-home-button"
								/>
							}
						/>
						<Separator className="my-0" />
						<SettingsItem
							label="Show bookmarks button"
							description="sdf" // Placeholder description
							control={
								<Switch
									checked={showBookmarksButton}
									onCheckedChange={setShowBookmarksButton}
									id="show-bookmarks-button"
								/>
							}
						/>
						<Separator className="my-0" />
						<SettingsItem
							label="Show bookmarks"
							description="sdf" // Placeholder description
							control={
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											size="sm"
											variant="outline"
											className="min-w-[230px] flex items-center justify-between hover:bg-accent"
										>
											<span>
												{showBookmarksLocation === "newTabPage"
													? "Only on the new tab page"
													: "Always"}
											</span>
											<ChevronDown
												size={16}
												className="text-muted-foreground ml-2"
											/>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="min-w-[230px]">
										<DropdownMenuItem
											onClick={() => setShowBookmarksLocation("newTabPage")}
										>
											Only on the new tab page
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => setShowBookmarksLocation("always")}
										>
											Always
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							}
						/>
						<Separator className="my-0" />
						<SettingsItem
							label="Show Brave News button"
							control={
								<Switch
									checked={showBraveNews}
									onCheckedChange={setShowBraveNews}
									id="show-brave-news"
								/>
							}
						/>
						<Separator className="my-0" />
						<SettingsItem
							label="Show Leo AI button"
							control={
								<Switch
									checked={showLeoAI}
									onCheckedChange={setShowLeoAI}
									id="show-leo-ai"
								/>
							}
						/>
						<Separator className="my-0" />
						<SettingsItem
							label="Show Brave Rewards button"
							control={
								<Switch
									checked={showBraveRewards}
									onCheckedChange={setShowBraveRewards}
									id="show-brave-rewards"
								/>
							}
						/>
						<Separator className="my-0" />
						<SettingsItem
							label="Show Brave Wallet button"
							control={
								<Switch
									checked={showBraveWallet}
									onCheckedChange={setShowBraveWallet}
									id="show-brave-wallet"
								/>
							}
						/>
					</CardContent>
				</Card>
			</section>
		</>
	);
}
