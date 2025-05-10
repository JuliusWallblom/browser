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
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface HorizontalTabProps {
	tab: Tab;
	isActive: boolean;
	onSelect: (tabId: string) => void;
	onClose: (tabId: string) => void;
	previewEnabled: boolean;
	previewImage?: string | null;
	onHover?: (tab: Tab) => void;
	closeButtonVisibility?: "always" | "onHoverOrActive";
	previewCardSide?: "top" | "bottom" | "left" | "right";
	variant?: "default" | "streamItem";
	isOverlayInstance?: boolean;
	blockAllHovers?: boolean;
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
	closeButtonVisibility = "always",
	previewCardSide,
	variant = "default",
	isOverlayInstance = false,
	blockAllHovers = false,
}: HorizontalTabProps) {
	const title = getTabTitle(tab);

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: tab.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0 : 1,
		zIndex: isDragging ? 10 : undefined,
	};

	const closeButtonBaseClass = "h-4 w-4 p-0.5 group-hover:text-foreground";
	let finalCloseButtonClass: string;

	if (closeButtonVisibility === "onHoverOrActive") {
		finalCloseButtonClass = cn(
			closeButtonBaseClass,
			isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
		);
	} else {
		// "always"
		finalCloseButtonClass = cn(closeButtonBaseClass); // Default Tailwind opacity is 100
	}

	const tabContent = (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={cn(
				"non-draggable flex-1 group flex items-center justify-between gap-2 group cursor-pointer",
				variant === "streamItem"
					? "rounded h-8 px-2 text-sm w-full text-muted-foreground min-w-0"
					: "rounded h-[30px] mt-[1px] px-2 text-sm relative min-w-[100px] max-w-[200px] text-muted-foreground hover:bg-muted/50",
				variant === "streamItem" && !isActive && "hover:bg-secondary/50",
				isActive &&
					(variant === "streamItem"
						? "bg-muted text-foreground"
						: "!bg-muted border-primary/50 text-foreground"),
				!isActive &&
					onHover && {
						onMouseEnter: () => onHover(tab),
					},
			)}
			onClick={(e) => {
				if (isDragging) {
					e.preventDefault();
					return;
				}
				onSelect(tab.id);
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onSelect(tab.id);
				}
			}}
			title={previewEnabled ? undefined : title}
		>
			<div className="shrink-0 w-4 h-4">
				{tab.url !== "about:blank" && tab.isLoading ? (
					<Loader2
						className={`w-4 h-4 animate-spin ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
					/>
				) : tab.isError ? (
					<ErrorFavicon />
				) : tab.favicon ? (
					<img
						src={tab.favicon}
						alt=""
						className={`w-4 h-4 ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
					/>
				) : (
					<Globe
						className={`w-4 h-4 ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
					/>
				)}
			</div>
			<span
				className={cn(
					"select-none group-hover:text-foreground truncate flex-1 text-left min-w-0",
					variant === "streamItem" && "leading-none w-[1px]",
				)}
			>
				{title}
			</span>
			<Button
				variant="ghost"
				size="icon"
				className={cn(finalCloseButtonClass, "bg-transparent")}
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

	// Base condition for showing hover card (excluding drag status for now)
	const canShowPreviewBase =
		previewEnabled &&
		!isActive &&
		tab.url &&
		tab.url !== "about:blank" &&
		!tab.url.startsWith("manta://");

	// Determine if HoverCard should be rendered
	// For overlay instance: show if base conditions met (ignore its own isDragging status for this part)
	// For original instance: show if base conditions met AND it's not being dragged (isDragging is false)
	const shouldRenderHoverCard = isOverlayInstance
		? canShowPreviewBase
		: canShowPreviewBase && !isDragging;

	// If blockAllHovers is true, then definitely don't render the hover card.
	if (blockAllHovers) {
		return tabContent; // Return just the tab content without the HoverCard wrapper
	}

	if (shouldRenderHoverCard) {
		return (
			<HoverCard openDelay={300} closeDelay={100}>
				<HoverCardTrigger asChild>{tabContent}</HoverCardTrigger>
				<HoverCardContent
					className={cn(
						"z-[52] flex flex-col space-y-1 p-1 pointer-events-none",
						variant === "streamItem" ? "w-48" : "w-64",
					)}
					side={previewCardSide}
					sideOffset={5}
				>
					{/* Image Preview Section - already has !tab.url.startsWith("manta://") check */}
					{previewImage && !tab.url.startsWith("manta://") && (
						<div
							className={cn(
								"bg-muted/50 rounded overflow-hidden flex items-center justify-center",
								variant === "streamItem" ? "h-[85px]" : "h-[120px]",
							)}
						>
							<img
								src={previewImage}
								alt={`Preview of ${title}`}
								className="w-full h-full object-cover object-top"
							/>
						</div>
					)}

					{/* Text Section */}
					<div className="p-1">
						<div className="font-medium truncate text-xs">{title}</div>
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
