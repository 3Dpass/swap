import { formatDecimalsFromToken } from "./helper";

/**
 * Formats a token balance for max click functionality
 * @param balance - The raw balance string (may contain commas/spaces)
 * @param decimals - The token decimals
 * @returns The formatted balance string
 */
export const formatBalanceForMaxClick = (balance: string | undefined, decimals: string): string => {
  if (!balance) return "";

  const cleanBalance = balance.replace(/[, ]/g, "");
  return formatDecimalsFromToken(Number(cleanBalance), decimals);
};
