import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MoreVertical, Settings } from "lucide-react";

interface SettingsMenuProps {
	onViewChange: (view: "webview" | "settings") => void;
	onUrlChange: (url: string) => void;
}

export default function SettingsMenu({
	onViewChange,
	onUrlChange,
}: SettingsMenuProps) {
	const handleSettingsClick = () => {
		onViewChange("settings");
		onUrlChange("merlin://settings");
	};

	const handleAboutClick = () => {
		// TODO: Implement about dialog
		console.log("About clicked");
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					type="button"
					className={cn("h-auto w-auto p-1 rounded-full non-draggable mr-2")}
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
