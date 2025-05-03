import { useEffect } from "react";

type ShortcutCommand =
	| "newTab"
	| "closeTab"
	| "nextTab"
	| "previousTab"
	| "focusUrlBar";

interface ShortcutHandler {
	command: ShortcutCommand;
	handler: () => void;
	key: string;
	metaKey?: boolean;
	ctrlKey?: boolean;
	altKey?: boolean;
	shiftKey?: boolean;
}

interface NavigatorUAData {
	platform: string;
}

const isMac =
	"userAgentData" in navigator
		? (navigator.userAgentData as NavigatorUAData).platform === "macOS"
		: /mac/i.test(navigator.userAgent);
const modifierKey = isMac ? "metaKey" : "ctrlKey";

export function useKeyboardShortcuts(handlers: ShortcutHandler[]) {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Don't trigger shortcuts when typing in input fields
			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement
			) {
				return;
			}

			for (const {
				command,
				handler,
				key,
				metaKey,
				ctrlKey,
				altKey,
				shiftKey,
			} of handlers) {
				const matchesKey = event.key.toLowerCase() === key.toLowerCase();
				const matchesMetaKey =
					metaKey === undefined || event.metaKey === metaKey;
				const matchesCtrlKey =
					ctrlKey === undefined || event.ctrlKey === ctrlKey;
				const matchesAltKey = altKey === undefined || event.altKey === altKey;
				const matchesShiftKey =
					shiftKey === undefined || event.shiftKey === shiftKey;

				if (
					matchesKey &&
					matchesMetaKey &&
					matchesCtrlKey &&
					matchesAltKey &&
					matchesShiftKey
				) {
					event.preventDefault();
					handler();
					break;
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handlers]);
}

// Predefined shortcuts based on platform
export const SHORTCUTS = {
	NEW_TAB: {
		command: "newTab" as ShortcutCommand,
		key: "t",
		[modifierKey]: true,
	},
	CLOSE_TAB: {
		command: "closeTab" as ShortcutCommand,
		key: "w",
		[modifierKey]: true,
	},
	NEXT_TAB: {
		command: "nextTab" as ShortcutCommand,
		key: "]",
		[modifierKey]: true,
	},
	PREVIOUS_TAB: {
		command: "previousTab" as ShortcutCommand,
		key: "[",
		[modifierKey]: true,
	},
	FOCUS_URL_BAR: {
		command: "focusUrlBar" as ShortcutCommand,
		key: "l",
		[modifierKey]: true,
	},
};
