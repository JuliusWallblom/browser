import { type IpcRendererEvent, contextBridge, ipcRenderer } from "electron";

export type Channels =
	| "ipc-example"
	| "webview-control"
	| "navigation-context-menu"
	| "navigation-action";

declare global {
	interface Window {
		electron: {
			ipcRenderer: {
				sendMessage(channel: Channels, ...args: unknown[]): void;
				on(channel: Channels, func: (...args: unknown[]) => void): () => void;
				once(channel: Channels, func: (...args: unknown[]) => void): void;
			};
			webview: {
				stopLoading(): void;
			};
			navigation: {
				showContextMenu(
					type: "back" | "forward" | "refresh",
					params: {
						canGoBack: boolean;
						canGoForward: boolean;
						isLoading: boolean;
					},
				): void;
			};
		};
	}
}

const electronHandler = {
	ipcRenderer: {
		sendMessage(channel: Channels, ...args: unknown[]) {
			ipcRenderer.send(channel, ...args);
		},
		on(channel: Channels, func: (...args: unknown[]) => void) {
			const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
				func(...args);
			ipcRenderer.on(channel, subscription);

			return () => {
				ipcRenderer.removeListener(channel, subscription);
			};
		},
		once(channel: Channels, func: (...args: unknown[]) => void) {
			ipcRenderer.once(channel, (_event, ...args) => func(...args));
		},
	},
	webview: {
		stopLoading() {
			ipcRenderer.send("webview-control", "stop-aggressive");
		},
	},
	navigation: {
		showContextMenu(
			type: "back" | "forward" | "refresh",
			params: { canGoBack: boolean; canGoForward: boolean; isLoading: boolean },
		) {
			ipcRenderer.send("navigation-context-menu", type, params);
		},
	},
};

contextBridge.exposeInMainWorld("electron", electronHandler);

export type ElectronHandler = typeof electronHandler;
