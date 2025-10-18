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
  const decimalPlaces = parseInt(decimals);

  // If balance is zero, return "0"
  if (numBalance === 0) return "0";

  // Check if balance is already formatted by looking for decimal point
  const balanceStr = numBalance.toString();
  const hasDecimalPoint = balanceStr.includes(".");

  if (hasDecimalPoint) {
    // Balance has decimal point - likely already formatted
    // Just ensure it doesn't exceed the token's decimal limit
    const parts = balanceStr.split(".");
    if (parts[1] && parts[1].length > decimalPlaces) {
      return `${parts[0]}.${parts[1].substring(0, decimalPlaces)}`;
    }
    return balanceStr;
  }

  // Balance is a whole number - could be raw blockchain value or already formatted
  // Use a threshold to detect raw blockchain values
  // Raw blockchain values are typically very large (e.g., 24795503631344215)
  // Already formatted values are typically reasonable (e.g., 24795)
  const threshold = Math.pow(10, Math.max(6, decimalPlaces - 2)); // Dynamic threshold based on decimals

  if (numBalance >= threshold) {
    // Very large number - likely raw blockchain value, apply decimal formatting
    return formatDecimalsFromToken(balance, decimals);
  } else {
    // Reasonable number without decimal point - likely already formatted
    return balanceStr;
  }
};
