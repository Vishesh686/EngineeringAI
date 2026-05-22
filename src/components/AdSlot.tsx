import { useEffect } from "react";

type AdSlotProps = {
  /** AdSense ad slot id from your ad unit (ca-pub-XXX/YYYY) */
  slotId?: string;
  className?: string;
};

/**
 * Non-intrusive ad placeholder. Set VITE_ADSENSE_CLIENT in Netlify env after AdSense approval.
 * See ADSENSE.md for full setup steps.
 */
export function AdSlot({ slotId, className }: AdSlotProps) {
  const client = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
  const adSlot = slotId ?? (import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR as string | undefined);

  useEffect(() => {
    if (!client || !adSlot) return;
    try {
      ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle =
        (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle || []).push({});
    } catch {
      /* ignore if script not loaded yet */
    }
  }, [client, adSlot]);

  if (!client || !adSlot) {
    return (
      <div
        className={`rounded-xl border border-dashed border-border/50 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground ${className ?? ""}`}
      >
        Ad space (configure VITE_ADSENSE_CLIENT in Netlify — see ADSENSE.md)
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle block min-h-[90px] w-full"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
