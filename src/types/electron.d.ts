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
		addEventListener(
			event: "ipc-message",
			listener: (event: { channel: string; args: unknown[] }) => void,
		): void;
		addEventListener(
			event: "will-navigate",
			listener: (event: WillNavigateEvent) => void,
		): void;
		removeEventListener(
			event: "ipc-message",
			listener: (event: { channel: string; args: unknown[] }) => void,
		): void;
		removeEventListener(
			event: "will-navigate",
			listener: (event: WillNavigateEvent) => void,
		): void;
	}

	interface WillNavigateEvent {
		url: string;
		preventDefault: () => void;
	}
}
