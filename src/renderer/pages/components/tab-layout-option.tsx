import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Check, Circle, CircleCheck } from "lucide-react";
import type { TabLayout } from "@/contexts/preferences-context";

export interface TabLayoutOptionProps {
	value: TabLayout;
	currentLayout: TabLayout;
	imageDark: string;
	imageLight: string;
	label: string;
	effectiveTheme: "light" | "dark" | "system";
}

export default function TabLayoutOption({
	value,
	currentLayout,
	imageDark,
	imageLight,
	label,
	effectiveTheme,
}: TabLayoutOptionProps) {
	const imageSrc = effectiveTheme === "dark" ? imageDark : imageLight;
	return (
		<Label
			htmlFor={`${value}-tabs`}
			className={cn(
				"max-w-[280px] relative flex flex-col items-center rounded-md bg-background dark:bg-muted border-2 cursor-pointer transition-colors overflow-hidden",
				currentLayout === value
					? "border-primary"
					: "border-muted hover:border-primary/50",
			)}
		>
			<RadioGroupItem value={value} id={`${value}-tabs`} className="sr-only" />
			{currentLayout === value ? (
				<CircleCheck
					strokeWidth="2"
					size={22}
					className="absolute top-2 right-2 text-primary rounded-full p-0.5"
				/>
			) : (
				<Circle
					strokeWidth="2"
					size={22}
					className="absolute top-2 right-2 text-border rounded-full p-0.5"
				/>
			)}
			<img
				src={imageSrc}
				alt={`${label} tab layout preview`}
				className="overflow-hidden user-select-none pointer-events-none rounded w-full h-40 object-cover object-top"
			/>
			<div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
			<span className="user-select-none pointer-events-none absolute bottom-2.5 left-3 text-sm font-normal mt-6">
				{label}
			</span>
		</Label>
	);
}
