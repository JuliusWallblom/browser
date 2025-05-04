import { Globe, Slash } from "lucide-react";

export function ErrorFavicon() {
	return (
		<div className="relative w-4 h-4">
			<Globe className="w-4 h-4 text-red-500" />
			<div className="absolute inset-0 flex items-center justify-center">
				<Slash className="w-3.5 h-3.5 text-red-500" />
			</div>
		</div>
	);
}
