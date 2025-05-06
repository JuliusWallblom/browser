import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { historyService } from "@/lib/history";
import { Globe, Loader2, Settings, Search } from "lucide-react";
import {
	type RefObject,
	useEffect,
	useRef,
	useState,
	useCallback,
} from "react";
import { ErrorFavicon } from "./error-favicon";
import { URLSuggestions, type Suggestion } from "./url-suggestions";
import { APP_NAME } from "@/constants/app";

const settingsSuggestion: Suggestion = {
	url: `${APP_NAME.toLowerCase()}://settings`,
	title: "Settings",
	subtitle: ` - ${APP_NAME}`,
	// No favicon needed, icon handled in URLSuggestions
};

// Helper function to check if string ends with a domain extension
const endsWithDomainExtension = (input: string) => {
	// Match a dot followed by 2 or more letters at the end of the string
	// This covers all TLDs (Top Level Domains)
	const domainPattern = /\.[a-zA-Z]{2,}$/;
	return domainPattern.test(input.toLowerCase().trim());
};

// Helper function to check if URL is a Google search
const isGoogleSearch = (url: string) => {
	try {
		const urlObj = new URL(url);
		return urlObj.hostname.includes("google.") && urlObj.pathname === "/search";
	} catch {
		return false;
	}
};

// Helper function to check if input looks like a URL
const looksLikeUrl = (input: string) => {
	const cleanInput = input.toLowerCase().trim();
	// Check for protocol
	if (cleanInput.startsWith("http://") || cleanInput.startsWith("https://"))
		return true;

	// Check for common URL patterns
	const urlPattern = /^([a-z0-9-]+\.)+[a-z]{2,}(\/|$)/;
	return urlPattern.test(cleanInput);
};

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

// Helper function to sort suggestions with Google searches first
const sortSuggestions = (suggestions: Suggestion[]) => {
	return [...suggestions].sort((a, b) => {
		const aIsGoogle = isGoogleSearch(a.url);
		const bIsGoogle = isGoogleSearch(b.url);
		if (aIsGoogle && !bIsGoogle) return -1;
		if (!aIsGoogle && bIsGoogle) return 1;
		return 0;
	});
};

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
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
	const [hoveredUrl, setHoveredUrl] = useState<string | null>(null);
	const [isHovering, setIsHovering] = useState(false);
	const [hasMouseMoved, setHasMouseMoved] = useState(false);

	const inputRef = externalRef || internalRef;

	// Define updateSuggestions outside useEffect so it's accessible everywhere
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const updateSuggestions = useCallback(async () => {
		if (!isEditing || !inputValue.trim()) {
			setSuggestions([]);
			return;
		}

		const results = await historyService.searchHistory(inputValue);
		const defaultSearch = {
			url: `https://www.google.com/search?q=${encodeURIComponent(inputValue)}`,
			title: inputValue,
			subtitle: "", // Subtitle handled in URLSuggestions
			favicon: undefined, // Favicon handled in URLSuggestions
		};

		// Filter out the current URL and normalize URLs for comparison
		const normalizeUrl = (urlToNormalize: string) => {
			try {
				const lowerUrl = urlToNormalize.toLowerCase();
				// isGoogleSearch can throw if urlToNormalize is not a valid URL, so handle it
				let isSearch = false;
				try {
					const tempUrlObj = new URL(lowerUrl);
					isSearch =
						tempUrlObj.hostname.includes("google.") &&
						tempUrlObj.pathname === "/search";
				} catch {
					// Not a valid URL, or not a Google search
				}

				if (isSearch) {
					const urlObj = new URL(lowerUrl); // Known to be valid if isSearch is true
					const q = urlObj.searchParams.get("q");
					if (q) {
						// Standardize Google search URL for comparison
						return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}?q=${encodeURIComponent(q.trim())}`;
					}
					// If it's a Google search URL but no 'q' param, treat as a regular URL for normalization
				}

				// Fallback for non-Google URLs or Google URLs without 'q' param after trying to parse
				const urlObj = new URL(lowerUrl); // This might throw if lowerUrl is not a valid URL string
				return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}${urlObj.search}`;
			} catch {
				// If any URL parsing fails, return the lowercased original string
				return urlToNormalize.toLowerCase();
			}
		};

		const currentNormalizedUrl = normalizeUrl(url);
		const filteredResults = results.filter(
			(result) => normalizeUrl(result.url) !== currentNormalizedUrl,
		);

		// Combine default search (if applicable) and history results
		const combinedSuggestions = looksLikeUrl(inputValue)
			? filteredResults
			: [defaultSearch, ...filteredResults];

		// Filter out duplicates based on URL
		const uniqueSuggestions = combinedSuggestions.filter(
			(suggestion, index, self) =>
				index ===
				self.findIndex(
					(s) => normalizeUrl(s.url) === normalizeUrl(suggestion.url),
				),
		);

		// Sort the unique suggestions
		const sortedUniqueSuggestions = sortSuggestions(uniqueSuggestions);

		// Conditionally add settings suggestion based on input
		let finalSuggestions = sortedUniqueSuggestions;
		const lowerInput = inputValue.toLowerCase().trim();

		if (lowerInput) {
			const appNameLower = APP_NAME.toLowerCase();
			const settingsTitleLower = settingsSuggestion.title.toLowerCase(); // "settings" by default

			const matchesSettingsKeyword = settingsTitleLower.includes(lowerInput);
			// Ensure appNameLower check is meaningful, e.g. input "m" for "merlin" is too broad.
			// Require at least 2 chars or if input is shorter, it must be the start of appNameLower.
			const matchesAppName =
				appNameLower.includes(lowerInput) &&
				(lowerInput.length >= 2 || appNameLower.startsWith(lowerInput));
			const matchesSettingsUrlSchema = `${appNameLower}://settings`.startsWith(
				lowerInput,
			);

			if (
				matchesSettingsKeyword ||
				matchesAppName ||
				matchesSettingsUrlSchema
			) {
				// Avoid duplicate if it somehow came from history
				if (!finalSuggestions.some((s) => s.url === settingsSuggestion.url)) {
					finalSuggestions = [settingsSuggestion, ...finalSuggestions];
				}
			}
		}

		setSuggestions(finalSuggestions);
	}, [
		isEditing,
		inputValue,
		url,
		historyService,
		looksLikeUrl,
		sortSuggestions,
		settingsSuggestion,
	]);

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

				// Handle special URLs like app:// or about:blank
				if (
					url.startsWith(`${APP_NAME.toLowerCase()}://`) ||
					url === "about:blank" ||
					inputValue.startsWith(`${APP_NAME.toLowerCase()}://`)
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

	// Update suggestions when input changes - NOW CALLS the shared function
	useEffect(() => {
		updateSuggestions();
	}, [updateSuggestions]); // Depends on the useCallback dependencies

	useEffect(() => {
		// Reset mouse movement flag when suggestions change
		setHasMouseMoved(false);
	}, []);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setIsEditing(false);
		setSuggestions([]);
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
		setSelectedSuggestionIndex(-1);
		// Reset hover states when typing
		setHoveredUrl(null);
		setHasMouseMoved(false);
	};

	const handleMouseDown = async () => {
		wasClickedRef.current = true;
		await updateSuggestions();
	};

	const handleFocus = async (e: React.FocusEvent<HTMLInputElement>) => {
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
		await updateSuggestions();
	};

	const handleBlur = () => {
		setIsEditing(false);
		setIsFocused(false);
		wasClickedRef.current = false;
		// Only hide suggestions if we're not hovering over them
		if (!isHovering) {
			setSuggestions([]);
		}
		setHoveredUrl(null);
		// Only revert if the URL is different, we're not submitting, and not loading
		if (inputValue !== url && !isLoading) {
			setInputValue(url);
			onChange(url);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Escape") {
			setSuggestions([]);
			return;
		}

		if (suggestions.length === 0) return;

		if (e.key === "ArrowDown") {
			e.preventDefault();
			setHasMouseMoved(true);
			setSelectedSuggestionIndex((prev) =>
				prev < suggestions.length - 1 ? prev + 1 : prev,
			);
			// Update input value to show selected suggestion
			if (selectedSuggestionIndex + 1 < suggestions.length) {
				const selected = suggestions[selectedSuggestionIndex + 1];
				setHoveredUrl(selected.url);
			}
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setHasMouseMoved(true);
			setSelectedSuggestionIndex((prev) => (prev > -1 ? prev - 1 : -1));
			// Update input value to show selected suggestion or restore original input
			if (selectedSuggestionIndex - 1 >= 0) {
				const selected = suggestions[selectedSuggestionIndex - 1];
				setHoveredUrl(selected.url);
			} else {
				setHoveredUrl(null);
				setHasMouseMoved(false);
			}
		} else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
			e.preventDefault();
			const selected = suggestions[selectedSuggestionIndex];
			handleSuggestionClick(selected);
		}
	};

	const handleSuggestionClick = (suggestion: Suggestion) => {
		setInputValue(suggestion.url);
		onChange(suggestion.url);
		// Create a form submit event
		const form = document.createElement("form");
		const input = document.createElement("input");
		input.value = suggestion.url;
		form.appendChild(input);
		const submitEvent = new Event("submit", {
			bubbles: true,
			cancelable: true,
		}) as unknown as React.FormEvent;
		Object.defineProperty(submitEvent, "target", { value: form });
		handleSubmit(submitEvent);
	};

	const handleSuggestionMouseEnter = (suggestion: Suggestion) => {
		if (hasMouseMoved) {
			setHoveredUrl(suggestion.url);
			setIsHovering(true);
		}
	};

	const handleSuggestionMouseMove = (suggestion: Suggestion) => {
		setHasMouseMoved(true);
		setHoveredUrl(suggestion.url);
		setIsHovering(true);
	};

	const handleSuggestionMouseLeave = () => {
		setHoveredUrl(null);
		setIsHovering(false);
		// Hide suggestions if we're not focused
		if (!isFocused) {
			setSuggestions([]);
		}
	};

	const handleSuggestionsMouseEnter = () => {
		if (hasMouseMoved) {
			setIsHovering(true);
		}
	};

	const handleSuggestionsMouseMove = () => {
		setHasMouseMoved(true);
		setIsHovering(true);
	};

	const handleSuggestionsMouseLeave = () => {
		setIsHovering(false);
		setHasMouseMoved(false);
		// Hide suggestions if we're not focused
		if (!isFocused) {
			setSuggestions([]);
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
			className={cn("flex-1 flex items-center non-draggable relative w-full")}
		>
			<div className="flex-1 relative h-7">
				<div
					className={cn(
						"absolute left-1.5 top-1/2 -translate-y-1/2 w-4 h-4 z-[51]",
					)}
				>
					{getIcon()}
				</div>
				<Input
					ref={inputRef}
					type="text"
					name="url"
					value={hasMouseMoved ? hoveredUrl || inputValue : inputValue}
					onChange={handleChange}
					onFocus={handleFocus}
					onBlur={handleBlur}
					onMouseDown={handleMouseDown}
					onKeyDown={handleKeyDown}
					className="relative w-full h-full pl-7 pr-2 rounded-full text-sm bg-muted border-none z-50"
					placeholder="Search or enter URL"
				/>
				<URLSuggestions
					suggestions={suggestions}
					selectedSuggestionIndex={selectedSuggestionIndex}
					hasMouseMoved={hasMouseMoved}
					isHovering={isHovering}
					hoveredUrl={hoveredUrl}
					onSuggestionClick={handleSuggestionClick}
					onSuggestionMouseEnter={handleSuggestionMouseEnter}
					onSuggestionMouseMove={handleSuggestionMouseMove}
					onSuggestionMouseLeave={handleSuggestionMouseLeave}
					onSuggestionsMouseEnter={handleSuggestionsMouseEnter}
					onSuggestionsMouseMove={handleSuggestionsMouseMove}
					onSuggestionsMouseLeave={handleSuggestionsMouseLeave}
				/>
			</div>
		</form>
	);
}
