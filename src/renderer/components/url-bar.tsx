import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Globe, Loader2, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface URLBarProps {
	url: string;
	favicon?: string;
	isLoading: boolean;
	currentView: "webview" | "settings";
	onChange: (url: string) => void;
	onSubmit: (e: React.FormEvent) => void;
}

export function URLBar({
	url,
	favicon,
	isLoading,
	currentView,
	onChange,
	onSubmit,
}: URLBarProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const wasClickedRef = useRef(false);
	const [isEditing, setIsEditing] = useState(false);
	const [isFocused, setIsFocused] = useState(false);
	const [inputValue, setInputValue] = useState(url);

	// Update input value when URL changes and we're not editing
	useEffect(() => {
		if (!isEditing) {
			setInputValue(url);
		}
	}, [url, isEditing]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setIsEditing(false);
		inputRef.current?.blur();
		onSubmit(e);
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setInputValue(newValue);
		onChange(newValue);
	};

	const handleMouseDown = () => {
		wasClickedRef.current = true;
	};

	const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		setIsEditing(true);
		if (!isFocused || !wasClickedRef.current) {
			e.target.select();
		}
		setIsFocused(true);
		wasClickedRef.current = false;
	};

	const handleBlur = () => {
		setIsEditing(false);
		setIsFocused(false);
		wasClickedRef.current = false;
		// Only revert if the URL is different and we're not submitting
		if (inputValue !== url && !isLoading) {
			setInputValue(url);
			onChange(url);
		}
	};

	const getIcon = () => {
		if (isLoading) {
			return (
				<Loader2 className={cn("w-4 h-4 text-muted-foreground animate-spin")} />
			);
		}

		if (currentView === "settings") {
			return <Settings className={cn("w-4 h-4 text-muted-foreground")} />;
		}

		if (favicon) {
			return <img src={favicon} alt="" className="w-4 h-4" />;
		}

		// Default globe icon for websites without favicon
		return <Globe className={cn("w-4 h-4 text-muted-foreground")} />;
	};

	return (
		<form
			onSubmit={handleSubmit}
			className={cn("flex-1 flex items-center non-draggable")}
		>
			<div className="flex-1 relative h-7">
				<div
					className={cn(
						"absolute left-1.5 top-1/2 -translate-y-1/2 w-4 h-4 z-10",
					)}
				>
					{getIcon()}
				</div>
				<Input
					ref={inputRef}
					type="text"
					value={inputValue}
					onChange={handleChange}
					onFocus={handleFocus}
					onBlur={handleBlur}
					onMouseDown={handleMouseDown}
					className="w-full h-full pl-7 pr-2 rounded-full text-sm bg-muted border border-transparent focus:border-gray-400 outline-none focus:outline-none focus:ring-0"
					placeholder="Search or enter URL"
				/>
			</div>
		</form>
	);
}
