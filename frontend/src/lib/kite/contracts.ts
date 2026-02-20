// Chain configuration constants for Kite AI x402 protocol

// Kite testnet Test USDT token address
export const KITE_TEST_USDT_ADDRESS = '0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63';

// Pieverse facilitator for x402 payment verification and settlement
export const PIEVERSE_FACILITATOR_URL = 'https://facilitator.pieverse.io';

// Kite testnet facilitator address
export const KITE_TESTNET_FACILITATOR_ADDRESS = '0x12343e649e6b2b2b77649DFAb88f103c02F3C78b';

// Service provider wallet address (receives payments)
export const MERCHANT_WALLET_ADDRESS =
  process.env.KITE_MERCHANT_WALLET || '';

export const KITE_CHAIN_CONFIG = {
  testnet: {
    chainId: 2368,
    rpcUrl: 'https://rpc-testnet.gokite.ai/',
    explorerUrl: 'https://testnet.kitescan.ai/',
    faucetUrl: 'https://faucet.gokite.ai',
    network: 'kite-testnet',
  },
  mainnet: {
    chainId: 2366,
    rpcUrl: 'https://rpc.gokite.ai/',
    explorerUrl: 'https://kitescan.ai/',
    network: 'kite-mainnet',
  },
} as const;

export function getChainConfig() {
  const chainId = Number(
    process.env.NEXT_PUBLIC_KITE_CHAIN_ID || '2368'
  );
  return chainId === 2366 ? KITE_CHAIN_CONFIG.mainnet : KITE_CHAIN_CONFIG.testnet;
}
