import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeOuterVariants = cva(
	// Base for the outer div: layout, rounding, focus.
	// No padding/text styles here by default, these are handled by inner span or specific variants.
	"user-select-none inline-flex items-center rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 overflow-hidden",
	{
		variants: {
			variant: {
				default:
					"border border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
				secondary:
					"border border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
				destructive:
					"border border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
				outline: "border border-primary text-foreground",
				gradient:
					"border border-transparent [background-image:linear-gradient(rgba(0,0,0,0),rgba(0,0,0,0)),linear-gradient(to_bottom_right,#ff00c0,#ff5400)] [background-origin:border-box] [background-clip:padding-box,border-box]",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

// Generates classes for the inner span
const getBadgeInnerSpanStyles = ({ variant }: { variant?: string | null }) => {
	let variantSpecificClasses = "";
	if (variant === "gradient") {
		// For gradient: transparent background for the content area, and gradient text
		variantSpecificClasses =
			"bg-transparent text-transparent bg-clip-text bg-gradient-to-br from-[#ff00c0] to-[#ff5400]";
	} else {
		// For other variants, the inner span's background is transparent to show outer div's background.
		// Text color is inherited from the outer div.
		variantSpecificClasses = "bg-transparent";
	}
	return cn(
		"block h-full w-full rounded-full px-1.5 py-0.5 text-xs font-normal", // Common padding and base text styles
		variantSpecificClasses,
	);
};

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeOuterVariants> {}

function Badge({ className, variant, children, ...props }: BadgeProps) {
	// For non-gradient variants, the text styling (color) comes from the outer div,
	// and padding/font size are added here to the outer div for simplicity if we didn't have an inner span.
	// However, to maintain a consistent HTML structure and styling source,
	// we apply padding and font styles to the inner span for ALL variants.
	// The outer CVA for non-gradient variants will provide their specific background and text color.

	const outerBaseClasses = badgeOuterVariants({ variant });

	// If the variant is NOT gradient, we need to add the padding and text styles to the outer div
	// because it's not using the p-[1px] border mechanism and the inner span's padding would be "inside" nothing.
	// This is a bit of a workaround because CVA applies to one element.
	// A cleaner CVA setup would have base padding in CVA and override for gradient.
	// Let's adjust badgeOuterVariants to include padding for non-gradient variants.

	// Re-evaluating: The original structure had padding/text styles in the CVA base or variant.
	// With the inner span handling padding/text styles *always*, the outer CVA should *not* have them.

	// Corrected `badgeOuterVariants` (conceptual change, applying below)
	// Default/Secondary/etc. in CVA: ONLY border, bg, text-color.
	// Gradient in CVA: p-[1px], bg-gradient.

	// The `getBadgeInnerSpanStyles` already adds px-1.5, py-0.5, text-xs, font-normal.
	// So the outer `badgeOuterVariants` should NOT have these for default/secondary etc.
	// I will adjust the `badgeOuterVariants` in the actual edit to reflect this.

	return (
		<div className={cn(outerBaseClasses, className)} {...props}>
			<span className={getBadgeInnerSpanStyles({ variant })}>{children}</span>
		</div>
	);
}

export { Badge, badgeOuterVariants as badgeVariants };
