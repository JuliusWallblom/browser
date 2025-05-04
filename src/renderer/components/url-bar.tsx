import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Globe, Loader2, Settings } from "lucide-react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { ErrorFavicon } from "./error-favicon";

interface URLBarProps {
	url: string;
	favicon?: string;
	isLoading: boolean;
	currentView: "webview" | "settings";
	onChange: (url: string) => void;
	onSubmit: (e: React.FormEvent) => void;
	urlInputRef?: RefObject<HTMLInputElement | null>;
	shouldFocusAndSelect?: boolean;
	isError?: boolean;
}

export function URLBar({
	url,
	favicon,
	isLoading,
	currentView,
	onChange,
	onSubmit,
	urlInputRef: externalRef,
	shouldFocusAndSelect,
	isError,
}: URLBarProps) {
	const internalRef = useRef<HTMLInputElement>(null);
	const wasClickedRef = useRef(false);
	const [isEditing, setIsEditing] = useState(false);
	const [isFocused, setIsFocused] = useState(false);
	const [inputValue, setInputValue] = useState(url);
	const [isFaviconLoading, setIsFaviconLoading] = useState(false);

	const inputRef = externalRef || internalRef;

	// Handle focus and select when shouldFocusAndSelect changes
	useEffect(() => {
		if (shouldFocusAndSelect) {
			inputRef.current?.focus();
			setTimeout(() => {
				inputRef.current?.select();
			}, 0);
		}
	}, [shouldFocusAndSelect, inputRef]);

	// Update input value when URL changes and we're not editing
	useEffect(() => {
		if (!isEditing && url !== inputValue) {
			try {
				// Skip updating to about:blank during loading
				if (isLoading && url === "about:blank") {
					return;
				}

				// Handle special URLs like merlin:// or about:blank
				if (
					url.startsWith("merlin://") ||
					url === "about:blank" ||
					inputValue.startsWith("merlin://")
				) {
					if (url !== inputValue) {
						setInputValue(url);
					}
					return;
				}

				// Try to parse both URLs, adding http:// if needed
				const parseUrl = (urlString: string) => {
					try {
						if (!urlString.includes("://")) {
							return new URL(`http://${urlString}`);
						}
						return new URL(urlString);
					} catch {
						// Return null if URL is invalid
						return null;
					}
				};

				const currentUrl = parseUrl(inputValue);
				const newUrl = parseUrl(url);

				// Update if either URL is invalid or if they're different
				if (
					!currentUrl ||
					!newUrl ||
					currentUrl.hostname !== newUrl.hostname ||
					currentUrl.pathname !== newUrl.pathname
				) {
					setInputValue(url);
				}
			} catch (error) {
				// Fallback: just update the value if there's any error
				console.debug("Error comparing URLs:", error);
				setInputValue(url);
			}
		}
	}, [url, isEditing, inputValue, isLoading]);

	// Handle favicon loading
	useEffect(() => {
		if (favicon) {
			setIsFaviconLoading(true);
			const img = new Image();
			img.onload = () => setIsFaviconLoading(false);
			img.onerror = () => setIsFaviconLoading(false);
			img.src = favicon;
		} else {
			setIsFaviconLoading(false);
		}
	}, [favicon]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setIsEditing(false);
		onSubmit(e);
		// Blur after a small delay to prevent the about:blank flash
		setTimeout(() => {
			inputRef.current?.blur();
		}, 0);
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
		setIsFocused(true);
		// Always select all text for blank pages, otherwise only select if not clicked directly
		if (url === "" || (!isFocused && !wasClickedRef.current)) {
			// Use setTimeout to ensure selection happens after focus
			setTimeout(() => {
				e.target.select();
			}, 0);
		}
		wasClickedRef.current = false;
	};

	const handleBlur = () => {
		setIsEditing(false);
		setIsFocused(false);
		wasClickedRef.current = false;
		// Only revert if the URL is different, we're not submitting, and not loading
		if (inputValue !== url && !isLoading) {
			setInputValue(url);
			onChange(url);
		}
	};

	const getIcon = () => {
		if (inputValue !== "about:blank" && (isLoading || isFaviconLoading)) {
			return (
				<Loader2 className={cn("w-4 h-4 text-muted-foreground animate-spin")} />
			);
		}

		if (currentView === "settings") {
			return <Settings className={cn("w-4 h-4 text-muted-foreground")} />;
		}

		if (isError) {
			return <ErrorFavicon />;
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
					className="w-full h-full pl-7 pr-2 rounded-full text-sm bg-muted border-none"
					placeholder="Search or enter URL"
				/>
			</div>
		</form>
	);
}
