/**
 * Module-level formatter instance constructed once per load rather than per call,
 * preventing repeated expensive Intl.NumberFormat instantiation.
 *
 * - minimumFractionDigits: 1 ensures integer values always render with at least one decimal place (e.g. 1.0).
 * - maximumFractionDigits: 7 aligns with Stellar's 7-decimal place precision (1 stroop = 0.0000001 XLM).
 */
const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 7,
});

export const formatAmount = (amount: number) => {
  return formatter.format(amount);
};

