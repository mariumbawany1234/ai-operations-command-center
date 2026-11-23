const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdShort = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export const usd = (n: number) => usd0.format(n);
export const usdCompact = (n: number) => usdShort.format(n);
export const pct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;