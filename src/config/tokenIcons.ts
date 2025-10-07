// Import token icons
import COWIcon from "../assets/img/tokens/COW.png";
import DIIcon from "../assets/img/tokens/DIA.png";
import FOXIcon from "../assets/img/tokens/FOX.png";
import FROGIcon from "../assets/img/tokens/FROG.png";
import P3DIcon from "../assets/img/tokens/P3D.svg";
import PASSIcon from "../assets/img/tokens/PASS.png";
import WUSDTIcon from "../assets/img/tokens/WUSDT.png";
import L2X2Icon from "../assets/img/tokens/L2X2.png";
import RINGIcon from "../assets/img/tokens/RING.png";
import REDBIcon from "../assets/img/tokens/REDB.png";
import defaultTokenIcon from "../assets/img/tokens/default-token.svg";

// Token symbol to icon URL mapping
// Key - token symbol in UPPERCASE (e.g., "TEST", "P3D")
// Value - imported icon URL
export const TOKEN_ICONS: Record<string, string> = {
  P3D: P3DIcon,
  WUSDT: WUSDTIcon,
  FROG: FROGIcon,
  PASS: PASSIcon,
  FOX: FOXIcon,
  COW: COWIcon,
  DIA: DIIcon,
  L2X2: L2X2Icon,
  RING: RINGIcon,
  REDB: REDBIcon,
};

export const DEFAULT_TOKEN_ICON = defaultTokenIcon;
