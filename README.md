# DEX UI & Front-end for Asset Conversion pallet ([3DPRC-2](https://github.com/3Dpass/whitepaper/blob/main/3DPRC-2.md) standard supported)

## Table of contents

<ul>
    <li><a href='#description'>Description</a></li>
    <li><a href='#useful-links'>Useful links</a></li>
    <li><a href='#how-to-install'>How to install</a>
        <ul>
            <li><a href='#install-all-packages'>Installation</a></li>
            <li><a href='#run-project'>Basic usage</a></li>
        </ul>
    </li>
    <li><a href='#how-to-manually-test-the-app'>How to manually test the app</a></li>
    <li><a href='#ui-kit'>Contributors</a>
        <ul>
            <li><a href='#customizing-styles-with-tailwindcss'>Customizing Styles with Tailwind.css</a></li>
            <li><a href='#modifying-images-fonts-and-global-scss'>Modifying Images, Fonts, and Global SCSS</a></li>
            <li><a href='#multilingual-support-with-i18n'>Multilingual Support with i18n</a></li>
            <li><a href='#adding-new-routes-and-pages'>Adding New Routes and Pages</a></li>
            <li><a href='#updating-global-state'>Updating Global State</a></li>
        </ul>
    </li>
    <li><a href='#contributions'>Contributions</a></li>
</ul>

## Description

2023 This project is part of Polkadot initiative for building front-end and UI for Asset Conversion Pallet on Polkadot's AssetHub. Link to the proposal [here](https://polkadot.polkassembly.io/referenda/68). Currently, the app is deployed on Westend, Rococo and Kusama - [here](https://dotacp-demo.mvpworkshop.co/swap?network=kusama).

2024 - This project is part of 3DPass initiative, which stands for global support of [3DPRC-2 tokenization standard](https://github.com/3Dpass/whitepaper/blob/main/3DPRC-2.md). The app is deployed on The Ledger of Things [mainnet](https://github.com/3Dpass/3DP) - [here](https://swap.3dpscan.io)

The main difference between The Ledger of Things DEX and some standard `AssetConversion` Substrate pallet inteegration comes down to [3DPRC-2](https://github.com/3Dpass/whitepaper/blob/main/3DPRC-2.md) tokenization standard support. There is a [poscanAssets](https://github.com/3Dpass/3DP/tree/main/pallets/poscan-assets) pallet implemented into The Ledger of Things, which allows for dealing with both conventional Fungible tokens and 3DPRC-2 objects share-tokens. Whereas, the standard integration of the `AssetConversion` pallet leverages two instances of the `Assets` pallet supporting just regular Fungible Tokens only. 

### Compare: 
- Standard `AssetConversion` Substrate pallet implementation:
  - standard `Assets` pallet (fungible tokens only) for tokens created by users
  - standard `Assets` pallet (fungible tokens only) for Liquidity Pools tokens

- The Ledger of Things featured integration of the `AssetConversion` pallet:
  - `poscanAssets` custom pallet (fungible tokens & 3DPRC-2 objects share-tokens) for tokens created by users
  - standard `poscanPoolAssets` pallet (fungible tokens only) for Liquidity Pools tokens

## Useful links

All important information regarding the pallet communication is [here](./ASSET_CONVERSION_PALLET.md).

## How to install

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

## How to manually test the app

In order to test the app on The Ledger of Things please follow this [guide](./MANUAL_TESTING_GUIDE.md).

To report any bugs or security vulnerability found please follow the instructions under the issues section [here](./CONTRIBUTING.md).

## UI Kit

### Customizing Styles with Tailwind.css:

The project uses Tailwind.css for styling, making it easy to customize the look and feel of your decentralized exchange. To make style adjustments, you can edit the `tailwind.config.js` file. This file contains configuration options for colors, fonts, spacing, and more. Developers can modify these settings to match their project's branding and design requirements.

### Modifying Images, Fonts, and Global SCSS:

In addition to <b>tailwind.css</b>, you can also customize images, fonts, and global SCSS (Sass) styles. These assets can be found in the `./src/assets/` directory. Developers can replace existing images, add new fonts, or make changes to the global SCSS to tailor the project's visual elements to their needs.

### Multilingual Support with i18n:

For projects with a global audience, multilingual support is crucial. The project uses i18n for translation and dynamic text changes. Developers can configure language support in the `./src/app/config/i18n/index.ts` file and provide translations in different languages in the `./src/app/translations/` directory. This makes it easy to add new languages and ensure that your decentralized exchange is accessible to users from around the world.

### Adding New Routes and Pages:

To expand the functionality of your decentralized exchange, developers can create new routes and pages. This can be done by editing the router configuration and adding new pages to the `./src/pages/` directory. This modular approach allows developers to extend the application with additional features and user interfaces.

### Updating Global State:

The project includes global state management logic that helps maintain shared application state. Developers can update global state properties to reflect changes in the application's data and user interactions. This global state can be accessed and modified as needed to ensure consistent and responsive user experiences.

By providing these guidelines, you're offering developers a clear roadmap for customizing and extending your decentralized exchange project. This will help them make the most of your codebase and contribute to the success of the project.

## Contributions

Yes please! See the [contributing guidelines](./CONTRIBUTING.md) for details.
