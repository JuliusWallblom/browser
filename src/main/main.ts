/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from "node:path";
import fs from "node:fs";
import {
	BrowserWindow,
	Menu,
	app,
	ipcMain,
	protocol,
	shell,
	webContents,
	nativeImage,
	type MenuItemConstructorOptions,
} from "electron";
import log from "electron-log";
import { autoUpdater } from "electron-updater";
import MenuBuilder from "./menu";
import { APP_NAME } from "../constants/app";

class AppUpdater {
	constructor() {
		log.transports.file.level = "info";
		autoUpdater.logger = log;
		autoUpdater.checkForUpdatesAndNotify();
	}
}

let isStoppingNavigation = false;

// Track all windows
const windows = new Set<BrowserWindow>();

ipcMain.on("ipc-example", async (event, arg) => {
	const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
	event.reply("ipc-example", msgTemplate("pong"));
});

ipcMain.on("close-window", (event) => {
	const webContents = event.sender;
	const win = BrowserWindow.fromWebContents(webContents);
	if (win) {
		win.close();
	}
});

ipcMain.on("webview-control", (event, action) => {
	if (action === "stop-aggressive") {
		const allWebContents = webContents.getAllWebContents();

		// Find all webview contents
		const webviewContents = allWebContents.filter(
			(contents) => contents.getType() === "webview",
		);

		for (const contents of webviewContents) {
			try {
				// Set the flag to block navigations
				isStoppingNavigation = true;

				// Block any new navigations
				contents.session.webRequest.onBeforeRequest((details, callback) => {
					if (isStoppingNavigation) {
						callback({ cancel: true });
					} else {
						callback({ cancel: false });
					}
				});

				// Stop current load
				contents.stop();

				// Reset the flag after a short delay
				setTimeout(() => {
					isStoppingNavigation = false;
				}, 1000);
			} catch (err) {
				console.error("Error stopping webview:", err);
			}
		}
	}
});

if (process.env.NODE_ENV === "production") {
	const sourceMapSupport = require("source-map-support");
	sourceMapSupport.install();
}

const isDebug =
	process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true";

if (isDebug) {
	require("electron-debug").default();
}

const installExtensions = async () => {
	const installer = require("electron-devtools-installer");
	const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
	const extensions = ["REACT_DEVELOPER_TOOLS"];

	return installer
		.default(
			extensions.map((name) => installer[name]),
			forceDownload,
		)
		.catch(console.log);
};

const createWindow = async () => {
	if (isDebug) {
		await installExtensions();
	}

	const RESOURCES_PATH = app.isPackaged
		? path.join(process.resourcesPath, "assets")
		: path.join(__dirname, "../../assets");

	const getAssetPath = (...paths: string[]): string => {
		return path.join(RESOURCES_PATH, ...paths);
	};

	const newWindow = new BrowserWindow({
		title: APP_NAME,
		show: false,
		width: 1024,
		height: 728,
		icon: getAssetPath("manta_icon.png"),
		frame: false,
		titleBarStyle: "hidden",
		trafficLightPosition: { x: 12, y: 12 },
		backgroundColor: "#ffffff",
		vibrancy: "window",
		visualEffectState: "active",
		webPreferences: {
			preload:
				process.env.VITE_PRELOAD_JS_PATH || path.join(__dirname, "preload.js"),
			webviewTag: true,
			nodeIntegration: false,
			contextIsolation: true,
			webSecurity: true,
			spellcheck: true,
			sandbox: false,
		},
	});

	newWindow.setTitle(APP_NAME);

	windows.add(newWindow);

	newWindow.on("closed", () => {
		windows.delete(newWindow);
	});

	if (process.env.VITE_DEV_SERVER_URL) {
		newWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
		// Prevent title changes in development
		newWindow.webContents.on("page-title-updated", (event) => {
			event.preventDefault();
		});
	} else {
		newWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
	}

	const menuBuilder = new MenuBuilder(newWindow, createWindow);
	menuBuilder.buildMenu();

	// Open urls in the user's browser
	newWindow.webContents.setWindowOpenHandler((edata) => {
		shell.openExternal(edata.url);
		return { action: "deny" };
	});

	// Listen for the renderer to signal it's ready
	ipcMain.on("renderer-ready-to-show", (event, windowId) => {
		const readyWindow = BrowserWindow.fromWebContents(event.sender);
		// A more robust way would be to match windowId if you pass it from renderer
		if (readyWindow) {
			if (process.env.START_MINIMIZED) {
				readyWindow.minimize();
			} else {
				readyWindow.show();
			}
			// Set title after window is shown
			readyWindow.setTitle(APP_NAME);
		}
	});

	return newWindow;
};

app.on("window-all-closed", () => {
	// Respect the OSX convention of having the application in memory even
	// after all windows have been closed
	if (process.platform !== "darwin") {
		app.quit();
	}
});

// Register the protocol scheme before app is ready
protocol.registerSchemesAsPrivileged([
	{
		scheme: APP_NAME.toLowerCase(),
		privileges: {
			standard: true,
			secure: true,
			supportFetchAPI: true,
			corsEnabled: true,
		},
	},
]);

app.setName(APP_NAME);

app
	.whenReady()
	.then(() => {
		// Set dock icon for macOS
		if (process.platform === "darwin" && app.dock) {
			const iconPath = path.join(
				"/Users/j/Developer/manta/assets/manta_icon.png",
			);
			console.log("Attempting to set dock icon with path:", iconPath);
			console.log("Icon path exists:", fs.existsSync(iconPath));
			try {
				const icon = nativeImage.createFromPath(iconPath);
				if (!icon.isEmpty()) {
					app.dock.setIcon(icon);
					console.log("Successfully set dock icon");
				} else {
					console.error("Failed to load icon: Icon is empty");
				}
			} catch (err) {
				console.error("Failed to set dock icon:", err);
			}
		}

		// Register as default protocol client
		if (!app.isDefaultProtocolClient(APP_NAME.toLowerCase())) {
			app.setAsDefaultProtocolClient(APP_NAME.toLowerCase());
		}

		// Set up dock menu for macOS
		if (process.platform === "darwin") {
			const dockMenu = Menu.buildFromTemplate([
				{
					label: "New Window",
					click: () => {
						createWindow();
					},
				},
			]);
			(app as Electron.App & { dock: Electron.Dock }).dock.setMenu(dockMenu);
		}

		createWindow();
		app.on("activate", () => {
			// On macOS it's common to re-create a window in the app when the
			// dock icon is clicked and there are no other windows open.
			if (windows.size === 0) createWindow();
		});
	})
	.catch(console.log);

// Forward keyboard shortcuts from webviews to the main window
app.on("web-contents-created", (event, contents) => {
	if (contents.getType() === "webview") {
		// Handle context menu
		contents.on("context-menu", (event, params) => {
			event.preventDefault();

			const template: MenuItemConstructorOptions[] = [];

			// Add link-related items
			if (params.linkURL) {
				template.push(
					{
						label: "Open Link in New Tab",
						click: () => {
							contents.hostWebContents.send(
								"open-url-in-new-tab",
								params.linkURL,
							);
						},
					},
					{
						label: "Copy Link",
						click: () => {
							contents.hostWebContents.send(
								"copy-to-clipboard",
								params.linkURL,
							);
						},
					},
					{ type: "separator" },
				);
			}

			// Add text editing items
			if (params.isEditable) {
				template.push(
					{
						label: "Undo",
						accelerator: "CmdOrCtrl+Z",
						role: "undo",
					},
					{
						label: "Redo",
						accelerator: "CmdOrCtrl+Shift+Z",
						role: "redo",
					},
					{ type: "separator" },
					{
						label: "Cut",
						accelerator: "CmdOrCtrl+X",
						role: "cut",
					},
					{
						label: "Copy",
						accelerator: "CmdOrCtrl+C",
						role: "copy",
					},
					{
						label: "Paste",
						accelerator: "CmdOrCtrl+V",
						role: "paste",
					},
					{
						label: "Select All",
						accelerator: "CmdOrCtrl+A",
						role: "selectAll",
					},
					{ type: "separator" },
				);
			} else if (params.selectionText) {
				template.push(
					{
						label: "Copy",
						accelerator: "CmdOrCtrl+C",
						role: "copy",
					},
					{ type: "separator" },
				);
			}

			// Add navigation items
			template.push(
				{
					label: "Back",
					accelerator: "Alt+Left",
					enabled: contents.canGoBack(),
					click: () => contents.goBack(),
				},
				{
					label: "Forward",
					accelerator: "Alt+Right",
					enabled: contents.canGoForward(),
					click: () => contents.goForward(),
				},
				{
					label: "Reload",
					accelerator: "CmdOrCtrl+R",
					click: () => contents.reload(),
				},
			);

			// Add developer tools in development mode
			if (process.env.NODE_ENV === "development") {
				template.push(
					{ type: "separator" },
					{
						label: "Inspect Element",
						click: () => contents.inspectElement(params.x, params.y),
					},
				);
			}

			Menu.buildFromTemplate(template).popup();
		});

		// Set webview preferences
		contents.setWindowOpenHandler(() => ({ action: "allow" }));

		contents.on("before-input-event", (event, input) => {
			// Only handle keyboard events with modifier keys
			if (input.type === "keyDown" && (input.meta || input.control)) {
				const key = input.key.toLowerCase();
				const customShortcuts = ["t", "w", "[", "]", "l", "e"];
				const isCustomShortcut = customShortcuts.includes(key);

				console.log("[main] Webview keyboard event:", {
					key,
					meta: input.meta,
					control: input.control,
					alt: input.alt,
					shift: input.shift,
					isCustomShortcut,
				});

				if (isCustomShortcut) {
					// Forward our custom shortcuts to the main window
					const mainWindow = BrowserWindow.getAllWindows()[0];
					if (mainWindow) {
						const modifiers: Array<"cmd" | "control" | "alt" | "shift"> = [];
						if (input.meta) modifiers.push("cmd");
						if (input.control) modifiers.push("control");
						if (input.alt) modifiers.push("alt");
						if (input.shift) modifiers.push("shift");

						mainWindow.webContents.sendInputEvent({
							type: "keyDown",
							keyCode: input.key,
							modifiers,
						});
						event.preventDefault();
					}
				}
				// For non-custom shortcuts (like copy/paste), do nothing and let them pass through
			}
		});
	}
});

// Add this before app.on("web-contents-created", ...)
ipcMain.on(
	"navigation-context-menu",
	(
		event,
		type: "back" | "forward" | "refresh",
		params: { canGoBack: boolean; canGoForward: boolean; isLoading: boolean },
	) => {
		const window = BrowserWindow.fromWebContents(event.sender);
		if (!window) return;

		const template: MenuItemConstructorOptions[] = [];

		if (type === "back") {
			template.push(
				{
					label: "Back",
					accelerator: "Alt+Left",
					enabled: params.canGoBack,
					click: () => {
						event.sender.send("navigation-action", "back");
					},
				},
				{
					label: "Forward",
					accelerator: "Alt+Right",
					enabled: params.canGoForward,
					click: () => {
						event.sender.send("navigation-action", "forward");
					},
				},
			);
		} else if (type === "forward") {
			template.push(
				{
					label: "Forward",
					accelerator: "Alt+Right",
					enabled: params.canGoForward,
					click: () => {
						event.sender.send("navigation-action", "forward");
					},
				},
				{
					label: "Back",
					accelerator: "Alt+Left",
					enabled: params.canGoBack,
					click: () => {
						event.sender.send("navigation-action", "back");
					},
				},
			);
		} else if (type === "refresh") {
			template.push(
				{
					label: params.isLoading ? "Stop" : "Reload",
					accelerator: "CmdOrCtrl+R",
					click: () => {
						if (params.isLoading) {
							event.sender.send("navigation-action", "stop");
						} else {
							event.sender.send("navigation-action", "refresh");
						}
					},
				},
				{
					label: "Force Reload",
					accelerator: "CmdOrCtrl+Shift+R",
					click: () => {
						event.sender.send("navigation-action", "force-refresh");
					},
				},
			);
		}

		if (process.env.NODE_ENV === "development") {
			template.push(
				{ type: "separator" },
				{
					label: "Inspect Element",
					click: () => event.sender.inspectElement(0, 0),
				},
			);
		}

		Menu.buildFromTemplate(template).popup({ window });
	},
);
