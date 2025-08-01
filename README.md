# Web3 Front-end for the Assets Conversion decentralized module

![CI](https://github.com/3Dpass/swap/workflows/CI/badge.svg)
![Tests](https://github.com/3Dpass/swap/workflows/Run%20Tests/badge.svg)

## Table of contents

<ul>
    <li><a href='#description'>Description</a></li>
    <li><a href='#assetconversion-interaction'>AssetConversion interaction</a></li>
    <li><a href='#how-to-install'>How to install</a>
        <ul>
            <li><a href='#quick-start'>Quick start</a></li>
            <li><a href='#run-project'>Basic usage</a></li>
        </ul>
    </li>
    <li><a href='#how-to-manually-test-the-app'>How to manually test the app</a></li>
    <li><a href='#ui-kit'>Contributors</a>
        <ul>
            <li><a href='#customizing-styles-with-tailwindcss'>Customizing Styles with Tailwind.css</a></li>
            <li><a href='#modifying-images-fonts-and-global-scss'>Modifying Images, Fonts, and Global SCSS</a></li>
            <li><a href='#adding-token-icons'>Adding token icons</a></li>
            <li><a href='#multilingual-support-with-i18n'>Multilingual Support with i18n</a></li>
            <li><a href='#adding-new-routes-and-pages'>Adding New Routes and Pages</a></li>
            <li><a href='#updating-global-state'>Updating Global State</a></li>
        </ul>
    </li>
    <li><a href='#contributions'>Contributions</a></li>
</ul>

## Description
This is a non-custodial Web3 decentralized exchange (DEX) interface for The Ledger of Things blockchain. Built on the [AssetConversion](https://github.com/3Dpass/3DP/tree/main/pallets/asset-conversion) pallet, it supports:

- **Token Swaps**: Exchange P3D native tokens with any created assets
- **Liquidity Pools**: Create and manage liquidity pools for token pairs
- **3DPRC-2 Support**: Trade both conventional fungible tokens and 3DPRC-2 tokenized object share-tokens
- **Dynamic Pricing**: Automated market maker (AMM) with real-time price discovery
- **Non-Custodial**: Users maintain full control of their assets through browser wallet extensions 

## Key Features

- **🔄 Token Swapping**: Instant swaps between P3D and any listed token
- **💧 Liquidity Provision**: Add/remove liquidity to earn from trading fees
- **🎯 Real-time Pricing**: Dynamic pricing with live countdown timers for transactions
- **🔐 Wallet Support**: Compatible with Polkadot.js, Talisman, and SubWallet
- **📊 Pool Analytics**: View pool statistics, TVL, and trading volumes
- **⚡ Optimized UX**: Conservative block time estimates for reliable transaction timing
- **🎨 Custom Token Icons**: Support for custom token branding
- **🌐 Internationalization**: Multi-language support via i18n

## AssetConversion interaction
The app interacts with the [AssetConversion](https://github.com/3Dpass/3DP/tree/main/pallets/asset-conversion) module 
through its RPC API directly from the web browser. The RPC API provider is set up in the `networkConfig.ts`.
Follow the [RPC API](./ASSET_CONVERSION_PALLET.md) description.

## How to install

### Quick Start

For new developers (recommended):

```sh
git clone <repository-url>
cd swap
pnpm run setup
pnpm run dev
```

This will install dependencies, configure git hooks automatically, and start the development server.

### Install All Packages

```sh
pnpm install
```

### Run Project

```sh
pnpm run dev
```

### Run Tests

```sh
pnpm run test
```

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Blockchain**: Polkadot.js API for substrate interaction
- **Styling**: Tailwind CSS + SCSS modules
- **State Management**: React Context with Redux-like pattern
- **Wallet Integration**: @talismn/connect-wallets
- **Testing**: Jest + React Testing Library
- **Code Quality**: ESLint + Prettier + Husky pre-commit hooks
- **Build**: Vite with optimized production builds

## How to manually test the app

In order to test the app on The Ledger of Things please follow this [guide](./MANUAL_TESTING_GUIDE.md).

To report any bugs or security vulnerability found please follow the instructions under the issues section [here](./CONTRIBUTING.md).

## UI Kit

### Customizing Styles with Tailwind.css:

The project uses Tailwind.css for styling, making it easy to customize the look and feel of your decentralized exchange. To make style adjustments, you can edit the `tailwind.config.js` file. This file contains configuration options for colors, fonts, spacing, and more. Developers can modify these settings to match their project's branding and design requirements.

### Modifying Images, Fonts, and Global SCSS:

In addition to <b>tailwind.css</b>, you can also customize images, fonts, and global SCSS (Sass) styles. These assets can be found in the `./src/assets/` directory. Developers can replace existing images, add new fonts, or make changes to the global SCSS to tailor the project's visual elements to their needs.

### Adding Token Icons:

To add a custom icon for a new token:

1. **Add the icon file**: Place your token icon file in the `./src/assets/img/tokens/` directory. Supported formats:
   - SVG (recommended): `MYTOKEN.svg`
   - PNG: `MYTOKEN.png`

2. **Update the configuration**: Edit `./src/config/tokenIcons.ts` to add your token:
   ```typescript
   // Import your token icon at the top of the file
   import MYTOKENIcon from '../assets/img/tokens/MYTOKEN.svg';
   
   // Add it to the TOKEN_ICONS mapping
   export const TOKEN_ICONS: Record<string, string> = {
     // ... existing tokens
     MYTOKEN: MYTOKENIcon,
   };
   ```

3. **Submit a pull request**: Create a pull request with your changes to have the icon added to the official deployment.

**Important**: Icons must be imported as modules for proper bundling. Only tokens explicitly listed in the configuration will display custom icons. All other tokens will use the default icon.

### Multilingual Support with i18n:

For projects with a global audience, multilingual support is crucial. The project uses i18n for translation and dynamic text changes. Developers can configure language support in the `./src/app/config/i18n/index.ts` file and provide translations in different languages in the `./src/app/translations/` directory. This makes it easy to add new languages and ensure that your decentralized exchange is accessible to users from around the world.

### Adding New Routes and Pages:

To expand the functionality of your decentralized exchange, developers can create new routes and pages. This can be done by editing the router configuration and adding new pages to the `./src/pages/` directory. This modular approach allows developers to extend the application with additional features and user interfaces.

### Updating Global State:

The project includes global state management logic that helps maintain shared application state. Developers can update global state properties to reflect changes in the application's data and user interactions. This global state can be accessed and modified as needed to ensure consistent and responsive user experiences.

### Debug Panel:

For development and testing purposes, the app includes a debug panel that can be toggled with Ctrl/Cmd + D:
- **Transaction Simulation**: Test transaction flows without blockchain interaction
- **Block Time Monitoring**: View real-time block time calculations and history
- **State Inspection**: Debug application state and transaction status
- **Located in**: `./src/components/organism/DebugPanel/`

By providing these guidelines, you're offering developers a clear roadmap for customizing and extending your decentralized exchange project. This will help them make the most of your codebase and contribute to the success of the project.

## Contributions

Yes please! See the [contributing guidelines](./CONTRIBUTING.md) for details.

### Responsibility disclaimer
This is an open source free p2p software. Use it at your own risk. 

