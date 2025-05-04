import path from "node:path";
import { BrowserWindow, app } from "electron";
import { APP_NAME } from "../constants/app";

const RESOURCES_PATH = app.isPackaged
	? path.join(process.resourcesPath, "assets")
	: path.join(__dirname, "../../assets");

const getAssetPath = (...paths: string[]): string => {
	return path.join(RESOURCES_PATH, ...paths);
};

app.whenReady().then(() => {
	const mainWindow = new BrowserWindow({
		title: APP_NAME,
		icon: getAssetPath("manta_icon.png"),
		width: 1200,
		height: 800,
		titleBarStyle: "hidden",
		webPreferences: {
			webviewTag: true,
			nodeIntegration: true,
			contextIsolation: true,
			preload: path.join(__dirname, "preload.js"),
		},
	});

	if (process.env.NODE_ENV === "development" || !app.isPackaged) {
		mainWindow.webContents.openDevTools();
	}

	// ... rest of the code ...
});
