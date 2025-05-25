import { TOKEN_ICONS, DEFAULT_TOKEN_ICON } from "../../config/tokenIcons";

// Base path for token icons
const TOKENS_PATH = "/src/assets/img/tokens/";

export const getTokenIconPath = (
  tokenSymbol: string | undefined
): string => {
  if (!tokenSymbol) {
    return `${TOKENS_PATH}${DEFAULT_TOKEN_ICON}`;
  }
  
  // Convert to uppercase and check if icon exists in config
  const upperSymbol = tokenSymbol.toUpperCase();
  const configuredIcon = TOKEN_ICONS[upperSymbol];
  
  // Only use custom icon if explicitly configured
  if (configuredIcon) {
    return `${TOKENS_PATH}${configuredIcon}`;
  }
  
  // If not configured, use default icon
  return `${TOKENS_PATH}${DEFAULT_TOKEN_ICON}`;
};