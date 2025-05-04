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
			console.log("[use-keyboard-shortcuts] Keydown event received:", {
				key: event.key,
				metaKey: event.metaKey,
				ctrlKey: event.ctrlKey,
				altKey: event.altKey,
				shiftKey: event.shiftKey,
			});

			// Only handle events with modifier keys
			if (!(event.metaKey || event.ctrlKey)) {
				console.log("[use-keyboard-shortcuts] No modifier key, ignoring event");
				return;
			}

			// Check if this is one of our custom shortcuts
			const key = event.key.toLowerCase();
			const customShortcuts = ["t", "w", "[", "]", "l"];
			const isCustomShortcut = customShortcuts.includes(key);

			if (!isCustomShortcut) {
				console.log(
					"[use-keyboard-shortcuts] Not a custom shortcut, ignoring:",
					key,
				);
				return;
			}

			// Find matching handler
			for (const handler of handlers) {
				const matchesKey =
					event.key.toLowerCase() === handler.key.toLowerCase();
				const matchesMetaKey = handler.metaKey ? event.metaKey : true;
				const matchesCtrlKey = handler.ctrlKey ? event.ctrlKey : true;
				const matchesAltKey = handler.altKey ? event.altKey : true;
				const matchesShiftKey = handler.shiftKey ? event.shiftKey : true;

				console.log("[use-keyboard-shortcuts] Checking shortcut match:", {
					command: handler.command,
					matchesKey,
					matchesMetaKey,
					matchesCtrlKey,
					matchesAltKey,
					matchesShiftKey,
				});

				if (
					matchesKey &&
					matchesMetaKey &&
					matchesCtrlKey &&
					matchesAltKey &&
					matchesShiftKey
				) {
					console.log(
						"[use-keyboard-shortcuts] Shortcut matched:",
						handler.command,
					);
					event.preventDefault();
					event.stopPropagation();
					handler.handler();
					break;
				}
			}
		};

		console.log("[use-keyboard-shortcuts] Setting up keyboard event listener");
		window.addEventListener("keydown", handleKeyDown, true);
		return () => window.removeEventListener("keydown", handleKeyDown, true);
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
