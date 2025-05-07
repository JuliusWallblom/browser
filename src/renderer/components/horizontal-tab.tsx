import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, Loader2, Globe } from "lucide-react";
import { ErrorFavicon } from "./error-favicon";
import type { Tab } from "../../types/tab";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";

interface HorizontalTabProps {
	tab: Tab;
	isActive: boolean;
	onSelect: (tabId: string) => void;
	onClose: (tabId: string) => void;
	previewEnabled: boolean;
	previewImage?: string | null;
	onHover?: (tab: Tab) => void;
}

const getTabTitle = (tab: Tab) => {
	if (tab.url === "" || tab.url === "about:blank") {
		return "New Tab";
	}
	return tab.title || tab.url || "New Tab";
};

export function HorizontalTab({
	tab,
	isActive,
	onSelect,
	onClose,
	previewEnabled,
	previewImage,
	onHover,
}: HorizontalTabProps) {
	const title = getTabTitle(tab);

	const tabContent = (
		<div
			className={cn(
				"non-draggable flex-1 text-muted-foreground hover:bg-secondary/50 group transition-all rounded-lg h-[30px] mt-[1px] px-2 text-sm relative min-w-[100px] max-w-[200px] flex items-center justify-between gap-2 group cursor-pointer",
				isActive && "!bg-muted border-primary/50 text-foreground",
			)}
			onClick={() => onSelect(tab.id)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onSelect(tab.id);
				}
			}}
			title={previewEnabled ? undefined : title}
			{...(previewEnabled &&
				!isActive &&
				onHover && {
					onMouseEnter: () => onHover(tab),
				})}
		>
			<div className="shrink-0 w-4 h-4">
				{tab.url !== "about:blank" && tab.isLoading ? (
					<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
				) : tab.isError ? (
					<ErrorFavicon />
				) : tab.favicon ? (
					<img src={tab.favicon} alt="" className="w-4 h-4" />
				) : (
					<Globe className="w-4 h-4 text-muted-foreground" />
				)}
			</div>
			<span className="select-none group-hover:text-foreground truncate flex-1 text-left">
				{title}
			</span>
			<Button
				variant="ghost"
				size="icon"
				className={cn("h-4 w-4 p-0.5 group-hover:text-foreground")}
				onClick={(e) => {
					e.stopPropagation();
					onClose(tab.id);
				}}
				aria-label={`Close tab ${title}`}
			>
				<X className="h-3 w-3" />
			</Button>
		</div>
	);

	if (previewEnabled && !isActive) {
		return (
			<HoverCard openDelay={300} closeDelay={100}>
				<HoverCardTrigger asChild>{tabContent}</HoverCardTrigger>
				<HoverCardContent className="w-64 z-[52] flex flex-col space-y-1 p-1 pointer-events-none">
					{/* Image Preview Section */}
					{previewImage && (
						<div className="w-full h-[120px] bg-muted/50 rounded overflow-hidden flex items-center justify-center">
							<img
								src={previewImage}
								alt={`Preview of ${title}`}
								className="w-full h-full object-cover object-top"
							/>
						</div>
					)}

					{/* Text Section */}
					<div className="p-2">
						<div className="font-semibold truncate text-sm">{title}</div>
						<div className="text-xs text-muted-foreground truncate">
							{tab.url}
						</div>
					</div>
				</HoverCardContent>
			</HoverCard>
		);
	}

	return tabContent;
}
