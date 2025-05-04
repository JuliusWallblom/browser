declare namespace Electron {
	interface WebviewTag extends HTMLElement {
		loadURL(url: string): Promise<void>;
		reload(): void;
		reloadIgnoringCache(): void;
		stop(): void;
		goBack(): void;
		goForward(): void;
		getURL(): string;
		canGoBack(): boolean;
		canGoForward(): boolean;
		executeJavaScript<T = unknown>(code: string): Promise<T>;
	}
}
