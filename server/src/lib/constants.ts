import { ChainId } from "@uniswap/sdk-core";

const ALCHEMY_API_KEY = "ZXlHMZsPDpR82kjqBEH8KpPvacbKpmsI";

// Chain-specific contract addresses
interface ChainConfig {
  poolFactoryAddress: string;
  quoterAddress: string;
  rpcUrl: string;
}

export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  "POLYGON": {
    poolFactoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    quoterAddress: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",  // QuoterV2
    rpcUrl: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
  },
  "BASE": {
    poolFactoryAddress: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
    quoterAddress: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a",  // QuoterV2
    rpcUrl: "https://base-mainnet.g.alchemy.com/v2/ZXlHMZsPDpR82kjqBEH8KpPvacbKpmsI"
  },
  "AVALANCHE": {
    poolFactoryAddress: "0x9e5A52f57b3038F1B8EeE45F28b3C1967e22799C",
    quoterAddress: "0xbe0F5544EC67e9B3b2D979aaA43f18Fd87E6257F",  // QuoterV2
    rpcUrl: "https://avax-fuji.g.alchemy.com/v2/ZXlHMZsPDpR82kjqBEH8KpPvacbKpmsI"
  }
};

// Helper function to get chain config
export function getChainConfig(chainId: string): ChainConfig {
  const config = CHAIN_CONFIGS[chainId];
  if (!config) {
    throw new Error(`Chain config not found for chain ID: ${chainId}`);
  }
  return config;
}

interface TokenDetails {
  chainId: number;
  address: string;
  decimals: number;
  symbol: string;
  name: string;
}

// Define the token data for each chain
export const tokenDetails: Record<string, Record<string, TokenDetails>> = {
  "POLYGON": {
    WETH: {
      chainId: ChainId.POLYGON,
      address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
      decimals: 18,
      symbol: "WETH",
      name: "Wrapped Ether",
    },
    USDC: {
      chainId: ChainId.POLYGON,
      address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      decimals: 6,
      symbol: "USDC",
      name: "USD//C",
    },
    USDT: {
      chainId: ChainId.POLYGON,
      address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      decimals: 6,
      symbol: "USDT",
      name: "USD//T",
    },
  },
  "BASE": {
    WETH: {
      chainId: ChainId.BASE,
      address: "0x4200000000000000000000000000000000000006",
      decimals: 18,
      symbol: "WETH",
      name: "Wrapped Ether",
    },
    USDC: {
      chainId: ChainId.BASE,
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      decimals: 6,
      symbol: "USDC",
      name: "USD//C",
    },
    USDT: {
      chainId: ChainId.BASE,
      address: "0x4D15a3A2286D883AF0AA1B3f21367843FAc63E07",
      decimals: 6,
      symbol: "USDT",
      name: "USD//T",
    },
  },
  "AVALANCHE": {
    WETH: {
      chainId: ChainId.AVALANCHE,
      address: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB",
      decimals: 18,
      symbol: "WETH",
      name: "Wrapped Ether",
    },
    USDC: {
      chainId: ChainId.AVALANCHE,
      address: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
      decimals: 6,
      symbol: "USDC",
      name: "USD//C",
    },
    USDT: {
      chainId: ChainId.AVALANCHE,
      address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
      decimals: 6,
      symbol: "USDT",
      name: "USD//T",
    },
  },
};

// Helper to get token details based on chain ID and token symbol
export function getTokenDetails(chainId: string, tokenSymbol: string): TokenDetails | undefined {
  return tokenDetails[chainId]?.[tokenSymbol];
}
