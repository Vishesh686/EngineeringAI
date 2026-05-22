import { useEffect, useRef, useState } from "react";
import { Gift, Sparkles, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AdSlot } from "@/components/AdSlot";

const WATCH_SECONDS = Number(import.meta.env.VITE_REWARDED_AD_WATCH_SECONDS ?? 30);
const REWARD_DISPLAY = Number(import.meta.env.VITE_REWARDED_AD_CREDITS ?? 100);

type RewardedAdModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClaim: () => Promise<void>;
  claiming: boolean;
};

export function RewardedAdModal({ open, onOpenChange, onClaim, claiming }: RewardedAdModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(WATCH_SECONDS);
  const [canClaim, setCanClaim] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setSecondsLeft(WATCH_SECONDS);
      setCanClaim(false);
      return;
    }

    setSecondsLeft(WATCH_SECONDS);
    setCanClaim(false);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setCanClaim(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open]);

  const progress = ((WATCH_SECONDS - secondsLeft) / WATCH_SECONDS) * 100;

  const handleClaim = async () => {
    if (!canClaim || claiming) return;
    await onClaim();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[min(92vw,560px)] gap-0 overflow-hidden border-border/60 bg-background p-0 sm:rounded-2xl">
        <DialogHeader className="space-y-1 border-b border-border/40 px-5 py-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 p-2">
                <Gift className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="font-display text-lg">Earn free credits</DialogTitle>
                <DialogDescription className="text-xs">
                  View the sponsor message below, then claim +{REWARD_DISPLAY} credits
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4">
          <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/30">
            <AdSlot
              slotId={import.meta.env.VITE_ADSENSE_SLOT_REWARD as string | undefined}
              format="rectangle"
              className="min-h-[280px] w-full p-2"
            />
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Please keep this window open. Do not click ads unless you are interested — credits unlock after the timer.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {canClaim ? "Ready to claim" : `Watching… ${secondsLeft}s`}
              </span>
              <span className="font-medium text-primary">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Button
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90"
            disabled={!canClaim || claiming}
            onClick={() => void handleClaim()}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {claiming
              ? "Adding credits…"
              : canClaim
                ? `Claim +${REWARD_DISPLAY} credits`
                : `Claim unlocks in ${secondsLeft}s`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
