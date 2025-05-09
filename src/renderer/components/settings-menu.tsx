import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_NAME } from "@/constants/app";
import { cn } from "@/lib/utils";
import { MoreVertical } from "lucide-react";
import { useTabs } from "@/contexts/tabs-context";

export default function SettingsMenu() {
	const { addTab } = useTabs();

	const handleSettingsClick = () => {
		addTab({
			url: `${APP_NAME.toLowerCase()}://settings`,
			title: "Settings",
			view: "settings",
			isLoading: false,
		});
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					type="button"
					className={cn("h-auto w-auto p-1 non-draggable")}
					aria-label={"Settings"}
				>
					<MoreVertical size="16" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="mr-2 mt-1">
				<DropdownMenuItem onSelect={handleSettingsClick}>
					Settings
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
