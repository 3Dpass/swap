import type { AnyJson } from "@polkadot/types/types/codec";
import * as Sentry from "@sentry/react";
import { Decimal } from "decimal.js";
import { t } from "i18next";
import { UrlParamType } from "../types";
import { encodeAddress } from "@polkadot/util-crypto";

export const init = () => {
  // Sentry
  Sentry.init({
    dsn: process.env.VITE_SENTRY_DSN,
  });
};

export const reduceAddress = (
  address: string | undefined,
  lengthLeft: number,
  lengthRight: number,
  ss58Format?: number
) => {
  if (address) {
    // Format address with ss58Format if provided
    const formattedAddress = ss58Format !== undefined ? encodeAddress(address, ss58Format) : address;
    const addressLeftPart = formattedAddress.substring(0, lengthLeft);
    const addressRightPart = formattedAddress.substring(formattedAddress.length - lengthRight);
    return `${addressLeftPart}...${addressRightPart}`;
  }
  return t("wallet.notConnected");
};

export const urlTo = (path: string, params?: UrlParamType) => {
  for (const param in params) {
    path = path?.replace(new RegExp(`:${param}`, "g"), params[param as keyof UrlParamType]);
  }
  return path;
};

export const calculateSlippageReduce = (tokenValue: Decimal.Value, slippageValue: number) => {
  return new Decimal(tokenValue).minus(new Decimal(tokenValue).times(slippageValue).dividedBy(100)).toFixed();
};

export const calculateSlippageAdd = (tokenValue: Decimal.Value, slippageValue: number) => {
  return new Decimal(tokenValue).plus(new Decimal(tokenValue).times(slippageValue).dividedBy(100)).toFixed();
};

export const formatInputTokenValue = (base: Decimal.Value, decimals: string) => {
  return new Decimal(base)
    .times(Math.pow(10, parseFloat(decimals)))
    .floor()
    .toFixed();
};

export const formatDecimalsFromToken = (base: Decimal.Value, decimals: string) => {
  // Remove commas and spaces from the base value if it's a string
  // This fixes the Decimal.js error when parsing API responses
  const cleanBase = typeof base === "string" ? base.replace(/[, ]/g, "") : base;
  return new Decimal(cleanBase || 0).dividedBy(Math.pow(10, parseFloat(decimals || "0"))).toFixed();
};

export const checkIfPoolAlreadyExists = (id: string, poolArray: AnyJson[]) => {
  let exists = false;

  if (id && poolArray) {
    exists = !!poolArray?.find((pool: any) => {
      return pool?.[0]?.[1]?.Asset && pool?.[0]?.[1]?.Asset.replace(/[, ]/g, "").toString() === id;
    });
  }

  return exists;
};

export const truncateDecimalNumber = (number: string, size = 2): number => {
  const value = number.split(".");

  if (value?.[1]) {
    return Number(`${value[0]}.${value[1].slice(0, size)}`);
  }

  return Number(value);
};

export const toFixedNumber = (number: number) => {
  let decimalX = new Decimal(number);

  if (decimalX.abs().lessThan(1.0)) {
    const e = decimalX.toString().split("e-")[1];
    if (e) {
      const powerOfTen = new Decimal(10).pow(new Decimal(e).minus(1));
      decimalX = decimalX.times(powerOfTen);
      decimalX = new Decimal("0." + "0".repeat(parseInt(e)) + decimalX.toString().substring(2));
    }
  } else {
    let e = parseInt(decimalX.toString().split("+")[1]);
    if (e > 20) {
      e -= 20;
      decimalX = decimalX.dividedBy(new Decimal(10).pow(e));
      decimalX = decimalX.plus(new Decimal("0".repeat(e + 1)));
    }
  }

  return decimalX.toNumber();
};

export const formatCompactNumber = (value: string | number): string => {
  const num = typeof value === "string" ? parseFloat(value.replace(/[, ]/g, "")) : value;

  if (isNaN(num) || num === 0) return "0";

  const absNum = Math.abs(num);

  if (absNum >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
  } else if (absNum >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  } else if (absNum >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  } else if (absNum >= 1) {
    return num.toFixed(2).replace(/\.?0+$/, "");
  } else {
    return num.toFixed(4).replace(/\.?0+$/, "");
  }
};

/**
 * Accepts a string input and converts it to the base unit
 * @param input format like "110.4089 µKSM", "1.9200 mWND" or "0.001919 WND"
 * @returns converted value in the base unit (e.g. 0.0000001104089, 0.00192)
 */
export const convertToBaseUnit = (input: string): Decimal => {
  // Regular expression to extract the number, optionally the unit (m or µ), followed by the currency type
  const regex = /(\d+\.?\d*)\s*([mµ])?\w+/;
  const match = input.match(regex);

  if (!match) {
    return new Decimal(0);
  }

  const [, rawValue, unit] = match;
  let value = new Decimal(rawValue);

  // Convert based on the unit
  switch (unit) {
    case "m": // milli, divide by 1,000
      value = value.div(1000);
      break;
    case "µ": // micro, divide by 1,000,000
      value = value.div(1000000);
      break;
    // If no unit is specified, we assume the value is already in the base unit
  }

  return value;
};
