import { TOKEN_ICONS, DEFAULT_TOKEN_ICON } from "../../config/tokenIcons";

export const getTokenIconPath = (
  tokenSymbol: string | undefined
): string => {
  if (!tokenSymbol) {
    return DEFAULT_TOKEN_ICON;
  }
  
  // Convert to uppercase and check if icon exists in config
  const upperSymbol = tokenSymbol.toUpperCase();
  const configuredIcon = TOKEN_ICONS[upperSymbol];
  
  // Return the imported icon URL or default
  return configuredIcon || DEFAULT_TOKEN_ICON;
};