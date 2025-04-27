import { usePanels } from "@/hooks/use-panels";
import { SidePanel } from "./side-panel";

export default function AITab() {
	const { isRightPanelOpen, setRightPanelOpen } = usePanels();
	return (
		<SidePanel
			isOpen={isRightPanelOpen}
			onClose={() => setRightPanelOpen(false)}
			position="right"
		>
			<div className="flex flex-col gap-2">
				<h2 className="text-primary font-medium">AI</h2>
				<div className="text-secondary">Agents will go here</div>
			</div>
		</SidePanel>
	);
}
