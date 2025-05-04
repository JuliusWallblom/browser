export interface Tab {
	id: string;
	url: string;
	title: string;
	favicon?: string;
	isLoading: boolean;
	webviewKey?: number;
	canGoBack: boolean;
	canGoForward: boolean;
	isError?: boolean;
}
