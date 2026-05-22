import { useEffect, useId } from "react";

type AdSlotProps = {
  slotId?: string;
  className?: string;
  /** rectangle = rewarded modal; auto = sidebar */
  format?: "auto" | "rectangle" | "horizontal";
};

/**
 * AdSense display unit. Configure VITE_ADSENSE_* in Netlify — see ADSENSE.md.
 */
export function AdSlot({ slotId, className, format = "auto" }: AdSlotProps) {
  const client = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
  const adSlot = slotId ?? (import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR as string | undefined);
  const instanceId = useId();

  useEffect(() => {
    if (!client || !adSlot || typeof window === "undefined") return;
    const t = window.setTimeout(() => {
      try {
        ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle =
          (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle || []).push({});
      } catch {
        /* script still loading */
      }
    }, 200);
    return () => window.clearTimeout(t);
  }, [client, adSlot, instanceId, format]);

  if (!client || !adSlot) {
    return (
      <div
        className={`flex min-h-[90px] items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground ${className ?? ""}`}
      >
        Ad will appear after VITE_ADSENSE_CLIENT and slot IDs are set in Netlify
      </div>
    );
  }

  const minH = format === "rectangle" ? "min-h-[260px]" : "min-h-[90px]";

  return (
    <div className={className}>
      <ins
        key={`${adSlot}-${instanceId}`}
        className={`adsbygoogle block w-full ${minH}`}
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={adSlot}
        data-ad-format={format === "rectangle" ? "rectangle" : "auto"}
        data-full-width-responsive={format === "auto" ? "true" : undefined}
      />
    </div>
  );
}
