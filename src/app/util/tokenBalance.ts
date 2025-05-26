import { Decimal } from "decimal.js";
import { formatDecimalsFromToken } from "./helper";

/**
 * Formats a token balance for max click functionality
 * Intelligently detects if balance is already formatted or raw
 * @param balance - The balance (raw string/number or already formatted string)
 * @param decimals - The token decimals
 * @returns The formatted balance string
 */
export const formatBalanceForMaxClick = (balance: string | number | undefined, decimals: string): string => {
  if (!balance && balance !== 0) return "";

  // Use the safe cleaner to handle mixed types
  const cleanBalance = safeTokenBalanceClean(balance);
  const decimalPlaces = parseInt(decimals);

  // SMART DETECTION: Check if balance is already formatted (contains decimal point)
  const containsDecimalPoint = cleanBalance.includes(".");

  if (containsDecimalPoint) {
    // Balance is already formatted, just ensure it doesn't exceed decimal limits
    const parts = cleanBalance.split(".");

    if (parts.length === 2 && parts[1].length > decimalPlaces) {
      // Truncate to the allowed decimal places
      return `${parts[0]}.${parts[1].substring(0, decimalPlaces)}`;
    }

    // Return as-is if within decimal limits
    return cleanBalance;
  } else {
    // Balance is raw, apply standard formatting (divide by 10^decimals)
    const balanceDecimal = new Decimal(cleanBalance);
    const divisor = new Decimal(10).pow(decimalPlaces);
    const formattedDecimal = balanceDecimal.dividedBy(divisor);

    // Convert to fixed notation with exact decimal places, then trim if needed
    let formattedBalance = formattedDecimal.toFixed();

    // Ensure we don't exceed the token's decimal limit
    const parts = formattedBalance.split(".");

    if (parts.length === 2 && parts[1].length > decimalPlaces) {
      // Truncate to the allowed decimal places (not round, to avoid exceeding balance)
      formattedBalance = `${parts[0]}.${parts[1].substring(0, decimalPlaces)}`;
    }

    return formattedBalance;
  }
};

/**
 * Safely cleans a token balance that could be a string or number
 * @param tokenBalance - The token balance (string, number, or undefined)
 * @returns The cleaned balance string without commas/spaces
 */
export const safeTokenBalanceClean = (tokenBalance: string | number | undefined): string => {
  if (tokenBalance === undefined || tokenBalance === null) {
    return "0";
  }

  // Convert to string first, then clean
  const balanceStr = String(tokenBalance);
  return balanceStr.replace(/[, ]/g, "");
};

/**
 * Smartly displays token balance, detecting if it's already formatted or raw
 * @param balance - The token balance (string, number, or undefined)
 * @param decimals - The token decimals
 * @returns The properly formatted balance string for display
 */
export const smartBalanceDisplay = (balance: string | number | undefined, decimals: string): string => {
  if (!balance && balance !== 0) return "0";

  const numBalance = typeof balance === "string" ? parseFloat(balance) : balance;

  // If balance is a reasonable number (>= 0.001), assume it's already formatted
  // This handles cases where wallet service already formatted the balance
  if (numBalance >= 0.001) {
    const decimalPlaces = parseInt(decimals);
    const balanceStr = numBalance.toString();

    // Check if it has more decimal places than allowed and truncate if needed
    if (balanceStr.includes(".")) {
      const parts = balanceStr.split(".");
      if (parts[1] && parts[1].length > decimalPlaces) {
        return `${parts[0]}.${parts[1].substring(0, decimalPlaces)}`;
      }
    }

    return balanceStr;
  }

  // If balance is very small (< 0.001), it might be double-formatted
  // Try to detect if this is the case and handle appropriately
  if (numBalance > 0 && numBalance < 0.001) {
    // This might be a double-formatted balance, return as-is but with precision limit
    const decimalPlaces = parseInt(decimals);
    return numBalance.toFixed(Math.min(decimalPlaces, 18)); // Limit to prevent excessive decimals
  }

  // For zero or very large numbers, apply standard formatting
  // (This handles raw balances from blockchain)
  return formatDecimalsFromToken(balance, decimals);
};
