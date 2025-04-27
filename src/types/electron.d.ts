declare namespace Electron {
	interface WebviewTag extends HTMLElement {
		loadURL(url: string): Promise<void>;
		reload(): void;
		goBack(): void;
		goForward(): void;
	}
}
