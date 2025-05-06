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
import { MoreVertical, Settings } from "lucide-react";

interface SettingsMenuProps {
	onNavigateTo: (url: string) => void;
}

export default function SettingsMenu({ onNavigateTo }: SettingsMenuProps) {
	const handleSettingsClick = () => {
		onNavigateTo(`${APP_NAME.toLowerCase()}://settings`);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					type="button"
					className={cn("h-auto w-auto p-1 rounded-full non-draggable")}
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
