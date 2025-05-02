import { create } from "zustand";
import type { StoreApi } from "zustand";

interface PanelState {
	isLeftPanelOpen: boolean;
	isRightPanelOpen: boolean;
	toggleLeftPanel: () => void;
	toggleRightPanel: () => void;
	setLeftPanelOpen: (isOpen: boolean) => void;
	setRightPanelOpen: (isOpen: boolean) => void;
}

type SetState = StoreApi<PanelState>["setState"];
type GetState = StoreApi<PanelState>["getState"];
type Store = StoreApi<PanelState>;

export const usePanels = create<PanelState>()(
	(set: SetState, _get: GetState, _store: Store) => ({
		isLeftPanelOpen: false,
		isRightPanelOpen: false,
		toggleLeftPanel: () =>
			set((state) => ({ isLeftPanelOpen: !state.isLeftPanelOpen })),
		toggleRightPanel: () =>
			set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
		setLeftPanelOpen: (isOpen: boolean) => set({ isLeftPanelOpen: isOpen }),
		setRightPanelOpen: (isOpen: boolean) => set({ isRightPanelOpen: isOpen }),
	}),
);
