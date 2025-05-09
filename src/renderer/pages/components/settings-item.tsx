import type React from "react";

export interface SettingItemProps {
	label: string;
	description?: string;
	control?: React.ReactNode;
	action?: React.ReactNode;
	children?: React.ReactNode;
	onClick?: () => void;
	className?: string;
	indented?: boolean;
	controlLayout?: "inline" | "stacked";
}

export default function SettingsItem({
	label,
	description,
	control,
	action,
	children,
	onClick,
	className = "",
	indented = false,
	controlLayout = "inline",
}: SettingItemProps) {
	const mainContent = (
		<div
			className={`p-4 flex ${
				controlLayout === "stacked"
					? "flex-col items-start"
					: "justify-between items-center"
			} ${indented ? "ml-6" : ""} bg-background dark:bg-muted/50`}
		>
			{/* Left side: Label and Description */}
			<div className="flex-grow mr-4 space-y-1">
				<p className="text-sm font-medium text-primary">{label}</p>
				{description && (
					<p className="text-xs text-muted-foreground">{description}</p>
				)}
			</div>
			{/* Right side: Control, Action, or Children */}
			{(control || action || children) && (
				<div className={controlLayout === "stacked" ? "mt-2 w-full" : ""}>
					{/* Add margin-top and full width for stacked controls */}
					{control || action || children}
				</div>
			)}
		</div>
	);

	if (onClick) {
		return (
			<button
				type="button"
				onClick={onClick}
				className={`w-full text-left hover:bg-accent/50 px-2 rounded-md block ${className}`}
			>
				{mainContent}
			</button>
		);
	}

	return <div className={`px-0 ${className}`}>{mainContent}</div>;
}
