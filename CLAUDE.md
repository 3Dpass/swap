# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- **Run development server**: `pnpm run dev`
- **Build for production**: `pnpm run build`
- **Run tests**: `pnpm run test` or `pnpm jest`
- **Run linting**: `pnpm run lint`
- **Run TypeScript check**: `pnpm run typecheck`
- **Preview production build**: `pnpm run preview`
- **Commit with conventional commits**: `pnpm run commit`
- **Check for package updates**: `pnpm run check:packages`

### Pre-commit Hooks
The project uses Husky and lint-staged to ensure code quality before commits:
- **Prettier**: Automatically formats code
- **ESLint**: Fixes linting issues and checks for errors
- **TypeScript**: Validates types with `tsc --noEmit`
- **Commitlint**: Ensures commit messages follow conventional commits format

All checks run automatically on `git commit`. If any check fails, the commit will be blocked.

### Commit Style
- Use conventional commits
- Structure: `<type>(<optional scope>): <description>`
- Types include: 
  - `feat`: New feature
  - `fix`: Bug fix
  - `docs`: Documentation changes
  - `style`: Code formatting
  - `refactor`: Code refactoring
  - `test`: Adding or modifying tests
  - `chore`: Maintenance tasks
- Example: `feat(wallet): add new connection method`
- Breaking changes should include `!` after type or have `BREAKING CHANGE:` in footer

### Testing
- Run all tests: `pnpm run test`
- Run a single test file: `pnpm jest src/tests/unit/helper.test.ts`
- Tests are located in `src/tests/` directory
- Jest configuration is inline in package.json

## Architecture Overview

This is a DEX (Decentralized Exchange) UI built for the Asset Conversion pallet on The Ledger of Things blockchain, supporting the 3DPRC-2 tokenization standard.

### Core Technologies
- React 18 with TypeScript
- Vite as build tool
- Polkadot.js API for blockchain interaction
- Redux-like state management with useReducer
- Tailwind CSS for styling
- i18next for internationalization

### State Management Architecture
The app uses a custom Redux-like pattern with React Context:
- **Global state** is managed through reducers in `src/store/`
- Three main state slices: `wallet`, `pools`, and `swap`
- State is provided via `AppStateProvider` in `src/state/index.tsx`
- Actions are dispatched through the `useAppContext` hook

### Service Layer
Services in `src/services/` handle blockchain interactions:
- **polkadotWalletServices**: Wallet connection and balance management
- **poolServices**: Liquidity pool operations and pool data fetching
- **swapServices**: Token swap execution
- **tokenServices**: Token metadata and balance queries

### Network Configuration
- Network settings are in `src/networkConfig.ts`
- Currently configured for The Ledger of Things (P3D) network
- Uses `poscanAssets` pallet for 3DPRC-2 tokens instead of standard Assets pallet

### Key Differences from Standard AssetConversion
This implementation supports 3DPRC-2 tokens:
- Uses `poscanAssets` custom pallet for user tokens (supports both fungible tokens & 3DPRC-2 object share-tokens)
- Uses `poscanPoolAssets` for liquidity pool tokens (fungible only)
- Standard implementations use two instances of the Assets pallet

### Component Structure
- **Atoms**: Basic UI components (`src/components/atom/`)
- **Molecules**: Composite components (`src/components/molecule/`)
- **Organisms**: Complex feature components (`src/components/organism/`)
- **Pages**: Route-level components (`src/pages/`)

### Routing
- Routes defined in `src/app/router/`
- Main pages: SwapPage, PoolsPage, LiquidityPage

### Token Icon System
Token icons are managed through a simple configuration:
- **Icon files**: Store SVG or PNG icons in `src/assets/img/tokens/`
- **Configuration**: Simple symbol-to-filename mapping in `src/config/tokenIcons.ts`
- **TokenIcon component**: `src/components/atom/TokenIcon/` displays icons with automatic fallback
- **Utility**: `src/app/util/tokenIcon.ts` resolves icon paths with format support
- Supports both .svg and .png formats with automatic fallback
- Default icon used for unconfigured tokens

### Important Files
- `src/App.tsx`: Main app component, handles wallet reconnection and pool updates
- `src/main.tsx`: App entry point with providers setup
- `src/networkConfig.ts`: Blockchain network configuration
- `src/config/tokenIcons.ts`: Token icon configuration
- `ASSET_CONVERSION_PALLET.md`: Detailed pallet communication documentation