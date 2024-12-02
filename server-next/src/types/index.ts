export interface FeeEstimation {
    outputAmount: string;
    gasFee: string;
    gasFeeUSD: string;
    liquidityProviderFee: string;
    totalFee: string;
    totalFeeUSD: string;
    feePercentage: string;
    poolFee?: number; // Optional as it's only used by Uniswap
}
