import { useTabs } from "@/contexts/tabs-context";
import { useWebviews } from "@/contexts/webview-context";
import {
	ArrowLeft,
	ArrowRight,
	Copy,
	ExternalLink,
	RotateCcw,
	Search,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface WebviewContextMenuProps {
	tabId: string;
	x: number;
	y: number;
	linkURL?: string;
	srcURL?: string;
	selectionText?: string;
	isEditable?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function WebviewContextMenu({
	tabId,
	x,
	y,
	linkURL,
	srcURL,
	selectionText,
	isEditable,
	onOpenChange,
}: WebviewContextMenuProps) {
	const { addTab } = useTabs();
	const { webviewRefs } = useWebviews();
	const webview = webviewRefs.current?.get(tabId);
	const menuRef = useRef<HTMLDivElement>(null);
	const [adjustedPosition, setAdjustedPosition] = useState({ x, y });

	// Adjust menu position to stay within bounds
	useEffect(() => {
		const menu = menuRef.current;
		if (!menu) return;

		const menuRect = menu.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		let adjustedX = x;
		let adjustedY = y;

		// Adjust horizontal position if menu would overflow
		if (x + menuRect.width > viewportWidth) {
			adjustedX = viewportWidth - menuRect.width - 8; // 8px padding
		}

		// Adjust vertical position if menu would overflow
		if (y + menuRect.height > viewportHeight) {
			adjustedY = viewportHeight - menuRect.height - 8; // 8px padding
		}

		// Ensure menu doesn't go off-screen to the left or top
		adjustedX = Math.max(8, adjustedX);
		adjustedY = Math.max(8, adjustedY);

		setAdjustedPosition({ x: adjustedX, y: adjustedY });
	}, [x, y]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				onOpenChange?.(false);
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onOpenChange?.(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [onOpenChange]);

	const handleBack = () => {
		if (webview?.canGoBack()) {
			webview.goBack();
			onOpenChange?.(false);
		}
	};

	const handleForward = () => {
		if (webview?.canGoForward()) {
			webview.goForward();
			onOpenChange?.(false);
		}
	};

	const handleRefresh = () => {
		webview?.reload();
		onOpenChange?.(false);
	};

	const handleCopyLink = () => {
		if (linkURL) {
			navigator.clipboard.writeText(linkURL);
			onOpenChange?.(false);
		}
	};

	const handleCopyImage = () => {
		if (srcURL) {
			navigator.clipboard.writeText(srcURL);
			onOpenChange?.(false);
		}
	};

	const handleCopyText = () => {
		if (selectionText) {
			navigator.clipboard.writeText(selectionText);
			onOpenChange?.(false);
		}
	};

	const handleOpenInNewTab = () => {
		if (linkURL) {
			addTab({ url: linkURL });
			onOpenChange?.(false);
		}
	};

	const handleInspectElement = () => {
		if (webview) {
			webview.inspectElement(x, y);
			onOpenChange?.(false);
		}
	};

	return (
		<>
			{/* Overlay to catch clicks outside */}
			<div
				className="fixed inset-0 z-[9998]"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onOpenChange?.(false);
				}}
				onKeyDown={(e) => {
					if (e.key === "Escape") {
						onOpenChange?.(false);
					}
				}}
				tabIndex={-1}
			/>
			{/* Menu */}
			<div
				ref={menuRef}
				className="fixed z-[9999] min-w-[200px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
				style={{
					left: adjustedPosition.x,
					top: adjustedPosition.y,
				}}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => {
					if (e.key === "Escape") {
						onOpenChange?.(false);
					}
				}}
				tabIndex={-1}
			>
				<div className="flex flex-col gap-0.5">
					{webview?.canGoBack() && (
						<button
							type="button"
							className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
							onClick={handleBack}
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back
						</button>
					)}
					{webview?.canGoForward() && (
						<button
							type="button"
							className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
							onClick={handleForward}
						>
							<ArrowRight className="mr-2 h-4 w-4" />
							Forward
						</button>
					)}
					<button
						type="button"
						className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
						onClick={handleRefresh}
					>
						<RotateCcw className="mr-2 h-4 w-4" />
						Refresh
					</button>

					{(linkURL || srcURL || selectionText) && (
						<div className="my-1 h-px bg-border" />
					)}

					{linkURL && (
						<>
							<button
								type="button"
								className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
								onClick={handleOpenInNewTab}
							>
								<ExternalLink className="mr-2 h-4 w-4" />
								Open Link in New Tab
							</button>
							<button
								type="button"
								className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
								onClick={handleCopyLink}
							>
								<Copy className="mr-2 h-4 w-4" />
								Copy Link Address
							</button>
						</>
					)}

					{srcURL && (
						<button
							type="button"
							className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
							onClick={handleCopyImage}
						>
							<Copy className="mr-2 h-4 w-4" />
							Copy Image Address
						</button>
					)}

					{selectionText && !isEditable && (
						<button
							type="button"
							className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
							onClick={handleCopyText}
						>
							<Copy className="mr-2 h-4 w-4" />
							Copy Text
						</button>
					)}

					<div className="my-1 h-px bg-border" />

					<button
						type="button"
						className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
						onClick={handleInspectElement}
					>
						<Search className="mr-2 h-4 w-4" />
						Inspect Element
					</button>
				</div>
			</div>
		</>
	);
}
