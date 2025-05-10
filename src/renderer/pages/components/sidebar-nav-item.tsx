import type React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface SidebarNavItemProps {
	icon: React.ElementType;
	label: string;
	isActive: boolean;
	onClick: () => void;
	disabled?: boolean;
	badge?: string;
}

export default function SidebarNavItem({
	icon: IconComponent,
	label,
	isActive,
	onClick,
	disabled,
	badge,
}: SidebarNavItemProps) {
	return (
		<Button
			variant="ghost"
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={`font-normal hover:bg-muted/50 flex items-center justify-start px-2 py-2 h-auto rounded text-sm w-full text-left ${
				isActive
					? "!bg-muted text-primary"
					: "text-muted-foreground hover:text-foreground"
			} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
		>
			<IconComponent size={16} className="flex-shrink-0" />
			<span>{label}</span>
			{badge && (
				<div className="w-full flex justify-end">
					<Badge variant="outline">{badge}</Badge>
				</div>
			)}
		</Button>
	);
}
