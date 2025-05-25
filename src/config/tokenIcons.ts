// Import token icons
import P3DIcon from '../assets/img/tokens/P3D.svg';
import TESTIcon from '../assets/img/tokens/TEST.png';
import defaultTokenIcon from '../assets/img/tokens/default-token.svg';

// Token symbol to icon URL mapping
// Key - token symbol in UPPERCASE (e.g., "TEST", "P3D")
// Value - imported icon URL
export const TOKEN_ICONS: Record<string, string> = {
	P3D: P3DIcon,
	TEST: TESTIcon,
};

export const DEFAULT_TOKEN_ICON = defaultTokenIcon;
