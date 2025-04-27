import { cn } from "@/lib/utils";
import { MessageCircle, WandSparkles, X } from "lucide-react";
import { useRef, useState } from "react";

interface SidePanelProps {
	isOpen: boolean;
	onClose: () => void;
	position: "left" | "right";
	children: React.ReactNode;
}

export function SidePanel({
	isOpen,
	onClose,
	position,
	children,
}: SidePanelProps) {
	const [width, setWidth] = useState(320);
	const handleRef = useRef<HTMLDivElement>(null);

	const startResize = (e: React.PointerEvent) => {
		const handle = handleRef.current;
		if (!handle) return;

		e.preventDefault();
		handle.setPointerCapture(e.pointerId);

		const initialWidth = width;
		const startX = e.clientX;

		const onPointerMove = (e: PointerEvent) => {
			const dx = e.clientX - startX;
			// For right panel, invert the dx
			const adjustedDx = position === "right" ? -dx : dx;
			const newWidth = Math.max(200, Math.min(600, initialWidth + adjustedDx));
			setWidth(newWidth);
		};

		const onPointerUp = (e: PointerEvent) => {
			handle.releasePointerCapture(e.pointerId);
			handle.removeEventListener("pointermove", onPointerMove);
			handle.removeEventListener("pointerup", onPointerUp);
		};

		handle.addEventListener("pointermove", onPointerMove);
		handle.addEventListener("pointerup", onPointerUp);
	};

	if (!isOpen) return null;

	const handlePosition = position === "left" ? "right-[-12px]" : "left-[-12px]";

	return (
		<div
			style={{ width: `${width}px` }}
			className={cn(
				"h-full bg-background relative flex-none",
				position === "left" ? "border-r" : "border-l",
				"border-border",
			)}
		>
			<div className="p-4">{children}</div>
			<div
				ref={handleRef}
				onPointerDown={startResize}
				className={cn(
					"absolute top-0 bottom-0 w-6 cursor-ew-resize touch-none group",
					handlePosition,
				)}
			>
				<div
					className={cn(
						"absolute inset-y-0 left-1/2 w-px",
						"bg-border group-hover:bg-primary/50 group-active:bg-primary",
					)}
				/>
			</div>
		</div>
	);
}
