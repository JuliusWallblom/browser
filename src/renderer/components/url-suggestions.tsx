import { APP_NAME } from "@/constants/app";
import { cn } from "@/lib/utils";
import { Globe, Search, Settings } from "lucide-react";

// Helper function to check if URL is a Google search
const isGoogleSearch = (url: string) => {
	try {
		const urlObj = new URL(url);
		return urlObj.hostname.includes("google.") && urlObj.pathname === "/search";
	} catch {
		return false;
	}
};

export interface Suggestion {
	url: string;
	title: string;
	subtitle: string;
	favicon?: string;
}

interface URLSuggestionsProps {
	suggestions: Suggestion[];
	selectedSuggestionIndex: number;
	hasMouseMoved: boolean;
	isHovering: boolean;
	hoveredUrl: string | null;
	onSuggestionClick: (suggestion: Suggestion) => void;
	onSuggestionMouseEnter: (suggestion: Suggestion) => void;
	onSuggestionMouseMove: (suggestion: Suggestion) => void;
	onSuggestionMouseLeave: () => void;
	onSuggestionsMouseEnter: () => void;
	onSuggestionsMouseMove: () => void;
	onSuggestionsMouseLeave: () => void;
}

export function URLSuggestions({
	suggestions,
	selectedSuggestionIndex,
	hasMouseMoved,
	isHovering,
	hoveredUrl,
	onSuggestionClick,
	onSuggestionMouseEnter,
	onSuggestionMouseMove,
	onSuggestionMouseLeave,
	onSuggestionsMouseEnter,
	onSuggestionsMouseMove,
	onSuggestionsMouseLeave,
}: URLSuggestionsProps) {
	if (suggestions.length === 0) return null;

	return (
		<div
			className="-mt-8 absolute top-0 left-0 right-0 mt-1 bg-background border rounded-lg rounded-t-none shadow-lg overflow-hidden z-10"
			onMouseEnter={onSuggestionsMouseEnter}
			onMouseMove={onSuggestionsMouseMove}
			onMouseLeave={onSuggestionsMouseLeave}
		>
			{suggestions.map((suggestion, index) => (
				<button
					key={suggestion.url}
					type="button"
					className={cn(
						"w-full px-3 py-3 flex items-start gap-3 hover:bg-muted text-left",
						index === selectedSuggestionIndex && "bg-muted",
						suggestions.indexOf(suggestion) === 0 && "pt-[38px]",
					)}
					onMouseDown={(e) => e.preventDefault()}
					onClick={() => onSuggestionClick(suggestion)}
					onMouseEnter={() => onSuggestionMouseEnter(suggestion)}
					onMouseMove={() => onSuggestionMouseMove(suggestion)}
					onMouseLeave={onSuggestionMouseLeave}
				>
					{suggestion.url === `${APP_NAME.toLowerCase()}://settings` ? (
						<Settings className="w-4 h-4 text-muted-foreground" />
					) : isGoogleSearch(suggestion.url) ? (
						<Search className="w-4 h-4 text-muted-foreground" />
					) : suggestion.favicon ? (
						<img src={suggestion.favicon} alt="" className="w-4 h-4" />
					) : (
						<Globe className="w-4 h-4 text-muted-foreground" />
					)}
					<div className="flex-1 min-w-0">
						<div className="font-medium truncate text-sm">
							{isGoogleSearch(suggestion.url)
								? suggestion.title.split(" - ")[0]
								: suggestion.title}
							<span className="font-normal text-muted-foreground">
								{suggestion.subtitle ||
									(isGoogleSearch(suggestion.url) ? " - Google Search" : "")}
							</span>
						</div>
					</div>
				</button>
			))}
		</div>
	);
}
