import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, RefreshCcw } from "lucide-react";

interface ErrorPageProps {
	url: string;
	errorEvent: Electron.DidFailLoadEvent | null;
	onRetry: () => void;
	onGoBack: () => void;
	onGoHome: () => void;
	canGoBack: boolean;
}

export function ErrorPage({
	url,
	errorEvent,
	onRetry,
	onGoBack,
	canGoBack,
}: ErrorPageProps) {
	return (
		<div className="flex flex-col items-center justify-center h-full bg-background text-foreground p-4">
			<div className="space-y-6 text-center max-w-md">
				<div className="space-y-4">
					<h1 className="text-xl font-medium">This site can't be reached.</h1>
					<div className="space-y-4">
						<p className="text-sm text-muted-foreground">
							<span className="text-foreground font-medium">{url}</span>'s DNS
							address could not be found.
						</p>
						<p className="text-xs text-muted-foreground">
							({errorEvent?.errorDescription})
						</p>
					</div>
					<div className="pt-4 flex flex-wrap gap-2 justify-center">
						<Button
							size="sm"
							variant="default"
							onClick={onRetry}
							className="space-x-2 rounded-full"
						>
							Retry
						</Button>

						{canGoBack && (
							<Button
								size="sm"
								variant="secondary"
								onClick={onGoBack}
								className="space-x-2 rounded-full"
							>
								Go back
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
