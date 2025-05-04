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
			nodeIntegration: true,
			contextIsolation: true,
			webSecurity: true,
			spellcheck: true,
			sandbox: false,
		},
	});

	newWindow.setTitle(APP_NAME);

	windows.add(newWindow);

	if (process.env.VITE_DEV_SERVER_URL) {
		newWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
		// Prevent title changes in development
		newWindow.webContents.on("page-title-updated", (event) => {
			event.preventDefault();
		});
	} else {
		newWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
	}

	newWindow.on("ready-to-show", () => {
		if (!newWindow) {
			throw new Error('"newWindow" is not defined');
		}
		if (process.env.START_MINIMIZED) {
			newWindow.minimize();
		} else {
			newWindow.show();
		}
		// Set title after window is shown
		newWindow.setTitle(APP_NAME);
	});

	newWindow.on("closed", () => {
		windows.delete(newWindow);
	});

	const menuBuilder = new MenuBuilder(newWindow, createWindow);
	menuBuilder.buildMenu();

	// Open urls in the user's browser
	newWindow.webContents.setWindowOpenHandler((edata) => {
		shell.openExternal(edata.url);
		return { action: "deny" };
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
		scheme: "merlin",
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
		if (!app.isDefaultProtocolClient("merlin")) {
			app.setAsDefaultProtocolClient("merlin");
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

		// Handle the protocol
		protocol.handle("merlin", (request) => {
			const url = new URL(request.url);

			// Base HTML template with Tailwind
			const baseHtml = (content: string) => `
				<!DOCTYPE html>
				<html>
					<head>
						<meta charset="UTF-8" />
						<title>Merlin</title>
						<script src="https://cdn.tailwindcss.com"></script>
						<script>
							tailwind.config = {
								darkMode: 'class',
								theme: {
									extend: {
										colors: {
											background: {
												primary: 'var(--background-primary)',
												secondary: 'var(--background-secondary)',
											},
											border: {
												primary: 'var(--border-primary)',
											},
											primary: 'var(--text-primary)',
											secondary: 'var(--text-secondary)',
										},
									},
								},
							}
						</script>
						<style>
							:root {
								--background-primary: #ffffff;
								--background-secondary: #f1f5f9;
								--border-primary: #e2e8f0;
								--text-primary: #0f172a;
								--text-secondary: #64748b;
							}
							
							.dark {
								--background-primary: #0f172a;
								--background-secondary: #1e293b;
								--border-primary: #334155;
								--text-primary: #f8fafc;
								--text-secondary: #94a3b8;
							}

							@media (prefers-color-scheme: dark) {
								:root {
									--background-primary: #0f172a;
									--background-secondary: #1e293b;
									--border-primary: #334155;
									--text-primary: #f8fafc;
									--text-secondary: #94a3b8;
								}
							}
						</style>
					</head>
					<body class="bg-background-primary">
						${content}
					</body>
				</html>
			`;

			// You can handle different paths here
			switch (url.pathname) {
				case "/settings":
					return new Response(
						baseHtml(`
							<div class="flex flex-col p-8 bg-background-primary text-primary min-h-screen">
								<h1 class="text-3xl font-bold mb-6">Merlin Settings</h1>
								
								<div class="space-y-6">
									<section class="space-y-4">
										<h2 class="text-xl font-semibold">Browser Settings</h2>
										<div class="space-y-2">
											<p class="text-secondary">Configure your browsing experience with Merlin.</p>
										</div>
									</section>

									<section class="space-y-4">
										<h2 class="text-xl font-semibold">AI Assistant Settings</h2>
										<div class="space-y-2">
											<p class="text-secondary">Customize how the AI assistant interacts with your browsing.</p>
										</div>
									</section>

									<section class="space-y-4">
										<h2 class="text-xl font-semibold">About Merlin</h2>
										<div class="space-y-2">
											<p class="text-secondary">Version: 1.0.0</p>
											<p class="text-secondary">A modern browser with built-in AI capabilities.</p>
										</div>
									</section>
								</div>
							</div>
						`),
						{
							headers: { "content-type": "text/html" },
						},
					);
				default:
					return new Response(
						baseHtml(`
							<div class="flex flex-col items-center justify-center min-h-screen text-primary">
								<h1 class="text-3xl font-bold mb-4">404 - Not Found</h1>
								<p class="text-secondary">The requested merlin:// page was not found.</p>
							</div>
						`),
						{
							status: 404,
							headers: { "content-type": "text/html" },
						},
					);
			}
		});

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
