import { app, BrowserWindow } from "electron";
import path from "node:path";

app.whenReady().then(() => {
	const mainWindow = new BrowserWindow({
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
