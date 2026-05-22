export const CREDIT_PACKS = {
  starter: { code: "starter", name: "Starter", amountInr: 49, credits: 60, tag: "Pocket friendly" },
  pro: { code: "pro", name: "Pro", amountInr: 99, credits: 140, tag: "Best value" },
  max: { code: "max", name: "Max", amountInr: 199, credits: 320, tag: "Heavy users" },
} as const;

export type CreditPackCode = keyof typeof CREDIT_PACKS;

export const CREDIT_PACK_LIST = [CREDIT_PACKS.starter, CREDIT_PACKS.pro, CREDIT_PACKS.max];
