import { usePanels } from "@/hooks/use-panels";
import { SidePanel } from "./side-panel";

export default function StreamsTab() {
	const { isLeftPanelOpen, setLeftPanelOpen } = usePanels();
	return (
		<SidePanel
			isOpen={isLeftPanelOpen}
			onClose={() => setLeftPanelOpen(false)}
			position="left"
		>
			<div className="flex flex-col gap-2">
				<h2 className="text-primary font-medium">Tree</h2>
				<div className="text-secondary">Navigation tree will go here</div>
			</div>
		</SidePanel>
	);
}
