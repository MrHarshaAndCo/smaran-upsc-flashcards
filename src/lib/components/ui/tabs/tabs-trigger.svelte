<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.TriggerProps = $props();
</script>

<TabsPrimitive.Trigger
	bind:ref
	data-slot="tabs-trigger"
	class={cn(
		"gap-1.5 shrink-0 rounded-t-md border-b-2 border-transparent px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors flex-1 sm:flex-none items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
		"group-data-[variant=line]/tabs-list:data-active:border-primary group-data-[variant=line]/tabs-list:data-active:text-primary group-data-[variant=line]/tabs-list:data-active:bg-primary/10 group-data-[variant=line]/tabs-list:data-active:font-bold",
		"data-active:bg-background data-active:text-foreground shadow-2xs",
		className
	)}
	{...restProps}
/>
