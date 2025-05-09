import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
	Moon,
	Sun,
	// ArrowLeft, // No longer used directly in main page structure
	Monitor,
	Rows,
	Columns,
	Palette,
	FileText,
	Shield,
	Lock,
	Box,
	Sparkles,
	RefreshCw,
	Search,
	Puzzle,
	KeyRound,
	Globe,
	Download,
	Cog,
	RotateCcw,
	ExternalLink,
	ChevronDown,
	Settings as SettingsIcon, // For cog icon if needed elsewhere
	Home,
	BookMarked,
	Newspaper,
	MessageSquare, // Placeholder for Leo AI
	Award, // Placeholder for Rewards
	Wallet, // Placeholder for Wallet
	Settings2, // Generic settings cog
	Check,
	CircleCheck, // Added for selected tab layout
} from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { usePreferences, type TabLayout } from "@/contexts/preferences-context";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import TabLayoutOption from "./components/tab-layout-option";
import SettingsItem from "./components/settings-item";
import SidebarNavItem from "./components/sidebar-nav-item";

// Import tab layout images
import horizontalTabsDark from "../../../assets/images/horizontal_tabs_dark.png";
import horizontalTabsLight from "../../../assets/images/horizontal_tabs_light.png";
import verticalTabsDark from "../../../assets/images/vertical_tabs_dark.png";
import verticalTabsLight from "../../../assets/images/vertical_tabs_light.png";

import ThemeContent from "./components/theme-content";
import ToolbarContent from "./components/toolbar-content";
import TabsContent from "./components/tabs-content";

const sidebarNavigation = [
	{
		id: "get-started",
		label: "Get started",
		icon: Sparkles,
		disabled: false,
	},
	{
		id: "appearance",
		label: "Appearance",
		icon: Palette,
	},
];

const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 500;
const INITIAL_SIDEBAR_WIDTH = 288;

export function SettingsPage() {
	const [activeSection, setActiveSection] = useState("appearance");
	const { tabLayout } = usePreferences();

	const [sidebarWidth, setSidebarWidth] = useState(INITIAL_SIDEBAR_WIDTH);
	const resizeHandleRef = useRef<HTMLDivElement>(null);

	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const [hasScrollbar, setHasScrollbar] = useState(false);

	// New state and refs for main content scrollbar
	const mainScrollAreaRef = useRef<HTMLDivElement>(null);
	const mainContentInnerRef = useRef<HTMLDivElement>(null); // Renamed for clarity
	const [mainContentHasScrollbar, setMainContentHasScrollbar] = useState(false);

	const startResize = (e: React.PointerEvent) => {
		const handle = resizeHandleRef.current;
		if (!handle) return;

		e.preventDefault();
		handle.setPointerCapture(e.pointerId);

		const initialWidth = sidebarWidth;
		const startX = e.clientX;

		const onPointerMove = (moveEvent: PointerEvent) => {
			const dx = moveEvent.clientX - startX;
			const newWidth = Math.max(
				MIN_SIDEBAR_WIDTH,
				Math.min(MAX_SIDEBAR_WIDTH, initialWidth + dx),
			);
			setSidebarWidth(newWidth);
		};

		const onPointerUp = (upEvent: PointerEvent) => {
			handle.releasePointerCapture(upEvent.pointerId);
			window.removeEventListener("pointermove", onPointerMove);
			window.removeEventListener("pointerup", onPointerUp);
		};

		window.addEventListener("pointermove", onPointerMove);
		window.addEventListener("pointerup", onPointerUp);
	};

	const checkScrollbar = useCallback(() => {
		const content = contentRef.current;
		const viewport = scrollAreaRef.current?.querySelector(
			"[data-radix-scroll-area-viewport]",
		) as HTMLElement | null;

		if (!content || !viewport) {
			return;
		}
		const contentHasOverflow = content.scrollHeight > content.clientHeight;
		const viewportHasOverflow = viewport.scrollHeight > viewport.clientHeight;
		const needsScrollbar = contentHasOverflow || viewportHasOverflow;

		if (needsScrollbar !== hasScrollbar) {
			setHasScrollbar(needsScrollbar);
		}
	}, [hasScrollbar]);

	const checkMainContentScrollbar = useCallback(() => {
		const content = mainContentInnerRef.current;
		const viewport = mainScrollAreaRef.current?.querySelector(
			"[data-radix-scroll-area-viewport]",
		) as HTMLElement | null;

		if (!content || !viewport) {
			return;
		}
		const contentHasOverflow = content.scrollHeight > content.clientHeight;
		const viewportHasOverflow = viewport.scrollHeight > viewport.clientHeight;
		const needsScrollbar = contentHasOverflow || viewportHasOverflow;

		if (needsScrollbar !== mainContentHasScrollbar) {
			setMainContentHasScrollbar(needsScrollbar);
		}
	}, [mainContentHasScrollbar]);

	useEffect(() => {
		const combinedResizeAndScrollHandler = () => {
			checkScrollbar();
			checkMainContentScrollbar();
		};

		combinedResizeAndScrollHandler(); // Initial check
		const timeoutId = setTimeout(combinedResizeAndScrollHandler, 100);

		const currentContentRef = contentRef.current;
		const currentMainContentInnerRef = mainContentInnerRef.current;

		const resizeObserver = new ResizeObserver(combinedResizeAndScrollHandler);
		if (currentContentRef) {
			resizeObserver.observe(currentContentRef);
		}
		if (currentMainContentInnerRef) {
			resizeObserver.observe(currentMainContentInnerRef);
		}

		const mutationObserver = new MutationObserver(
			combinedResizeAndScrollHandler,
		);
		if (currentContentRef) {
			mutationObserver.observe(currentContentRef, {
				childList: true,
				subtree: true,
				characterData: true,
			});
		}
		if (currentMainContentInnerRef) {
			mutationObserver.observe(currentMainContentInnerRef, {
				childList: true,
				subtree: true,
				characterData: true,
			});
		}

		window.addEventListener("resize", combinedResizeAndScrollHandler);

		return () => {
			clearTimeout(timeoutId);
			window.removeEventListener("resize", combinedResizeAndScrollHandler);
			if (currentContentRef) {
				resizeObserver.unobserve(currentContentRef);
				mutationObserver.disconnect(); // Disconnects observer for both refs if it was observing currentContentRef
			}
			if (currentMainContentInnerRef) {
				resizeObserver.unobserve(currentMainContentInnerRef);
				// If currentContentRef was null, mutationObserver needs to be disconnected here
				// However, the current structure disconnects it above if currentContentRef exists.
				// For robustness, ensure it's disconnected if it was observing currentMainContentInnerRef and not currentContentRef.
				if (!currentContentRef) {
					mutationObserver.disconnect();
				}
			}
		};
	}, [checkScrollbar, checkMainContentScrollbar]);

	useEffect(() => {
		checkScrollbar();
		checkMainContentScrollbar();
	}, [checkScrollbar, checkMainContentScrollbar]);

	return (
		<div className="flex h-full overflow-hidden text-primary">
			{/* Sidebar */}
			<nav
				style={{ width: `${sidebarWidth}px` }}
				className="flex flex-col overflow-hidden relative flex-none"
			>
				<ScrollArea ref={scrollAreaRef} className="flex-1 p-[5px] pr-0.5">
					<div
						ref={contentRef}
						className={cn("space-y-1", hasScrollbar ? "pr-3" : "pr-1")}
					>
						{sidebarNavigation.map((item) => (
							<React.Fragment key={item.id}>
								<SidebarNavItem
									icon={item.icon}
									label={item.label}
									isActive={activeSection === item.id}
									onClick={() => setActiveSection(item.id)}
									disabled={item.disabled}
								/>
							</React.Fragment>
						))}
					</div>
				</ScrollArea>
				<div
					ref={resizeHandleRef}
					onPointerDown={startResize}
					className="absolute top-0 right-0 bottom-0 w-2 cursor-ew-resize touch-none group z-10"
				>
					<div className="absolute inset-y-0 right-0 w-px bg-border group-hover:bg-primary/50 group-active:bg-primary transition-colors duration-150" />
				</div>
			</nav>

			{/* Main Content */}
			<main className="flex-1 overflow-hidden bg-muted/50 dark:bg-background flex flex-col">
				<ScrollArea ref={mainScrollAreaRef} className="flex-1">
					<div
						ref={mainContentInnerRef}
						className={cn(
							"h-full", // Ensure div takes full height for scroll detection
							mainContentHasScrollbar ? "pr-2" : "pr-0", // Or pr-0 if no base padding desired
						)}
					>
						{activeSection === "appearance" && (
							<>
								<ThemeContent />
								<TabsContent />
								<ToolbarContent />
							</>
						)}
						{activeSection !== "appearance" && (
							<div className="flex flex-col items-center justify-center h-full">
								<div className="text-center">
									{sidebarNavigation.find((item) => item.id === activeSection)
										?.icon &&
										React.createElement(
											sidebarNavigation.find(
												(item) => item.id === activeSection,
											)?.icon as React.ElementType,
											{ size: 48, className: "text-muted-foreground mb-4" },
										)}
									<h2 className="text-2xl font-semibold text-foreground">
										{
											sidebarNavigation.find(
												(item) => item.id === activeSection,
											)?.label
										}
									</h2>
									<p className="text-muted-foreground mt-2">
										This section is under construction.
									</p>
								</div>
							</div>
						)}
					</div>
				</ScrollArea>
			</main>
		</div>
	);
}
