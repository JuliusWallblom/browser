import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/use-theme";
import { ChevronDown } from "lucide-react";
import SettingsItem from "./settings-item";

export default function ThemeContent() {
	const { theme, setTheme } = useTheme();

	const handleThemeChange = (newTheme: "system" | "light" | "dark") => {
		setTheme(newTheme);
	};

	const currentThemeLabel = {
		system: "Same as macOS",
		light: "Light",
		dark: "Dark",
	}[theme];

	return (
		<div className="w-full">
			<h1 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-4 -mt-1">
				Theme
			</h1>
			<section className="space-y-0">
				<Card className="overflow-hidden">
					<CardContent className="p-0 border-none">
						<SettingsItem
							label="Theme"
							description="Select the color of the app."
							control={
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											size="sm"
											variant="outline"
											className="min-w-[230px] flex items-center justify-between hover:bg-accent"
										>
											<span>{currentThemeLabel || "Select color"}</span>
											<ChevronDown
												size={16}
												className="text-muted-foreground ml-2"
											/>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="min-w-[180px]">
										<DropdownMenuItem
											onClick={() => handleThemeChange("system")}
										>
											Same as macOS
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => handleThemeChange("light")}
										>
											Light
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => handleThemeChange("dark")}>
											Dark
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							}
						/>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
