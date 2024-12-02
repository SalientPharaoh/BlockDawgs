// Updated interface to support token arrays
export interface ExampleConfig {
  rpc: {
    local: string;
    mainnet: string;
  }
}

// Example Configuration with Multiple Tokens
export const CurrentConfig: ExampleConfig = {
  rpc: {
    local: "http://localhost:8545",
    mainnet:
      "https://eth-mainnet.g.alchemy.com/v2/ZXlHMZsPDpR82kjqBEH8KpPvacbKpmsI",
  }
}