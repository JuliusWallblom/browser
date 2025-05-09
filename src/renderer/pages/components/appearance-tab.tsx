import TabsContent from "./tabs-content";
import ThemeContent from "./theme-content";
import ToolbarContent from "./toolbar-content";
export default function AppearanceTab() {
	return (
		<div className="w-full p-8 gap-8 flex flex-col">
			<ThemeContent />
			<TabsContent />
			<ToolbarContent />
		</div>
	);
}
