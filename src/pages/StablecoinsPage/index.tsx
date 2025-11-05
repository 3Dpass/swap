import { FC } from "react";
import { TOKEN_ICONS } from "../../config/tokenIcons";

const StablecoinsPage: FC = () => {
  const wUSDTIcon = TOKEN_ICONS.WUSDT;

  return (
    <div className="flex min-h-screen flex-col items-center bg-purple-100 py-4 dark:bg-dark-bg-primary sm:py-6 lg:py-10">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <img src={wUSDTIcon} alt="wUSDT Logo" className="h-24 w-24 rounded-full" />
          </div>
          <h1 className="mb-4 text-3xl font-bold text-gray-400 dark:text-dark-text-primary">wUSDT</h1>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-border-primary dark:bg-dark-bg-card dark:shadow-none">
          <div className="space-y-6">
            <div>
              <p className="mb-6 text-lg text-gray-600 dark:text-dark-text-secondary">
                wUSDT is a bridged version of Tether USDT on 3Dpass blockchain.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold text-gray-400 dark:text-dark-text-primary">Bridging:</h2>
              <ul className="list-disc space-y-1 pl-6 text-gray-600 dark:text-dark-text-secondary">
                <li>Home asset - USDT on Ethereum: 0xdAC17F958D2ee523a2206206994597C13D831ec7</li>
                <li>Foreign asset - wUSDT on 3Dpass: 0xfBFBfbFA000000000000000000000000000000de (assetId 222) </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold text-gray-400 dark:text-dark-text-primary">Standard:</h2>
              <p className="text-gray-600 dark:text-dark-text-secondary">
                3DPRC20 cross-platform token (both Substrate and EVM compatible)
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold text-gray-400 dark:text-dark-text-primary">Native runtime:</h2>
              <p className="text-gray-600 dark:text-dark-text-secondary">AssetId: 222</p>
              <a
                href="https://3dpscan.xyz/#/assets/222"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-pink hover:underline dark:text-pink"
              >
                View on Explorer
              </a>
              <p className="font-mono text-gray-600 dark:text-dark-text-secondary">
                Name: Wrapped Tether USDT on 3Dpass blockchain
              </p>
              <p className="font-mono text-gray-600 dark:text-dark-text-secondary">Symbol: wUSDT</p>
              <p className="font-mono text-gray-600 dark:text-dark-text-secondary">Decimals: 6</p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold text-gray-400 dark:text-dark-text-primary">EVM contract:</h2>
              <p className="font-mono text-gray-600 dark:text-dark-text-secondary">
                0xfBFBfbFA000000000000000000000000000000de
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold text-gray-400 dark:text-dark-text-primary">
                Substrate AssetId &lt;-&gt; EVM address mapping:
              </h2>
              <div className="space-y-2 text-gray-600 dark:text-dark-text-secondary">
                <p>wUSDT asset id &quot;222&quot; in hex is &quot;DE&quot;.</p>
                <p>Precompile address prefix: &quot;0xFBFBFBFA&quot;</p>
                <p className="font-mono">
                  Cross-platform contract address = 0xFBFBFBFA + 000... + DE =
                  0xfBFBfbFA000000000000000000000000000000de
                </p>
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold text-gray-400 dark:text-dark-text-primary">Interfaces:</h2>
              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-gray-600 dark:text-dark-text-secondary">
                    Substrate-based poscanAssets module interaction:
                  </p>
                  <a
                    href="https://github.com/3Dpass/3DP/wiki/3DPRC%E2%80%902-PoScan-API#9-extrinsic-poscanassetstransfer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-pink hover:underline dark:text-pink"
                  >
                    poscanAssets transfer
                  </a>
                </div>
                <div>
                  <p className="mb-2 text-gray-600 dark:text-dark-text-secondary">EVM interaction:</p>
                  <a
                    href="https://github.com/3Dpass/3DP/blob/main/precompiles/assets-erc20/ERC20.sol"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-pink hover:underline dark:text-pink"
                  >
                    ERC20.sol
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold text-gray-400 dark:text-dark-text-primary">
                Supply management:
              </h2>
              <div className="space-y-2 text-gray-600 dark:text-dark-text-secondary">
                <p>
                  Delegated to the ImportWrapper bridge instance:{" "}
                  <span className="font-mono">
                    0x00D5f00250434e76711e8127A37c6f84dBbDAA4C (d1EFFdGtmHmZomkumDkeCbhTdFt7yXXP8xhquoFaRPEjE3bhZ - on
                    native runtime)
                  </span>
                </p>
                <a
                  href="https://converter.3dpass.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-pink hover:underline dark:text-pink"
                >
                  H160 EVM to SS58 Address converter
                </a>
                <p>100% autonomous</p>
                <p>Supply Control Methods: Issue/Burn</p>
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold text-gray-400 dark:text-dark-text-primary">
                The bridge is delegated with full responsibilities:
              </h2>
              <ul className="list-disc space-y-1 pl-6 text-gray-600 dark:text-dark-text-secondary">
                <li>Owner</li>
                <li>Issuer</li>
                <li>Burner</li>
                <li>Freezer</li>
              </ul>
              <p className="mt-3 text-gray-600 dark:text-dark-text-secondary">
                Use this script to verify the roles delegated:{" "}
                <a
                  href="https://github.com/3Dpass/counterstake-bridge/blob/v1.1-substrate/evm_substrate/scripts/check-import-wrapper.js"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-pink hover:underline dark:text-pink"
                >
                  check-import-wrapper.js
                </a>
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold text-gray-400 dark:text-dark-text-primary">Bridge version</h2>
              <p className="mb-2 text-gray-600 dark:text-dark-text-secondary">Counterstake v1.1-substrate:</p>
              <a
                href="https://github.com/3Dpass/counterstake-bridge/tree/v1.1-substrate/evm_substrate/contracts"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-pink hover:underline dark:text-pink"
              >
                ../v1.1-substrate/evm_substrate/contracts
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StablecoinsPage;
