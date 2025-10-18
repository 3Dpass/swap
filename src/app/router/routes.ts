import { t } from "i18next";

const HOME_ROUTE = "/";
const POOLS_ROUTE = "pools";
const ADD_LIQUIDITY = "add-liquidity";
const ADD_LIQUIDITY_TO_EXISTING = "add-liquidity/:id";
const REMOVE_LIQUIDITY_FROM_EXISTING = "remove-liquidity/:id";
const SWAP_ROUTE = "swap";
const DEVELOPERS_ROUTE = "developers";
const ADD_TOKEN_ROUTE = "add-token";
const POOLS_ADD_LIQUIDITY = "/pools/add-liquidity";
const POOLS_PAGE = "/pools";

const SEO_ROUTES = {
  [POOLS_ROUTE]: {
    title: t("seo.pools.title"),
    description: t("seo.pools.description"),
  },
  [SWAP_ROUTE]: {
    title: t("seo.swap.title"),
    description: t("seo.swap.description"),
  },
  [DEVELOPERS_ROUTE]: {
    title: t("seo.developers.title"),
    description: t("seo.developers.description"),
  },
  [ADD_TOKEN_ROUTE]: {
    title: t("seo.addToken.title"),
    description: t("seo.addToken.description"),
  },
};

export {
  HOME_ROUTE,
  POOLS_ROUTE,
  SWAP_ROUTE,
  DEVELOPERS_ROUTE,
  ADD_TOKEN_ROUTE,
  ADD_LIQUIDITY,
  POOLS_ADD_LIQUIDITY,
  POOLS_PAGE,
  SEO_ROUTES,
  ADD_LIQUIDITY_TO_EXISTING,
  REMOVE_LIQUIDITY_FROM_EXISTING,
};
