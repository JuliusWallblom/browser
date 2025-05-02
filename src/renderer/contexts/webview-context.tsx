import type React from "react";
import { createContext, useContext, useRef } from "react";

interface WebviewContextType {
	webviewRefs: React.RefObject<Map<string, Electron.WebviewTag>>;
}

const WebviewContext = createContext<WebviewContextType | null>(null);

export function WebviewProvider({ children }: { children: React.ReactNode }) {
	const webviewRefs = useRef<Map<string, Electron.WebviewTag>>(new Map());

	return (
		<WebviewContext.Provider value={{ webviewRefs }}>
			{children}
		</WebviewContext.Provider>
	);
}

export function useWebviews() {
	const context = useContext(WebviewContext);
	if (!context) {
		throw new Error("useWebviews must be used within a WebviewProvider");
	}
	return context;
}
