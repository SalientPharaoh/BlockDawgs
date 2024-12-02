export enum SWAP {
    UNISWAP = "UNISWAP",
}

export enum CROSS_CHAIN {
    ROUTER = "ROUTER",
    LIFI = "LIFI",
}

export type PROTOCOL = SWAP | CROSS_CHAIN | "NATIVE";