import { ethers } from 'ethers';
import { FeeAmount } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';
import { getTokenDetails, getChainConfig } from '../lib/constants';
import { FeeEstimation } from '../types';
import { convertGasToUSD } from '../lib/price';

export async function calculateUniswapFees(
    chainId: string,
    token0Symbol: string,
    token1Symbol: string,
    inputAmount: string,
): Promise<FeeEstimation> {
    try {
        // Get chain-specific configuration
        const chainConfig = getChainConfig(chainId);
        const provider = new ethers.providers.JsonRpcProvider(chainConfig.rpcUrl);
        const gasPrice = await provider.getGasPrice();
        
        // Get token details
        const token0Details = getTokenDetails(chainId, token0Symbol);
        const token1Details = getTokenDetails(chainId, token1Symbol);

        if (!token0Details || !token1Details) {
            throw new Error('Token details not found for provided symbols');
        }

        // Create Token objects
        const token0 = new Token(
            token0Details.chainId,
            token0Details.address,
            token0Details.decimals,
            token0Details.symbol,
            token0Details.name
        );

        const token1 = new Token(
            token1Details.chainId,
            token1Details.address,
            token1Details.decimals,
            token1Details.symbol,
            token1Details.name
        );

        const quoterContract = new ethers.Contract(
            chainConfig.quoterAddress,
            [
                'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)',
            ],
            provider
        );

        // Use a fixed fee tier for now (0.3%)
        const feeTier = FeeAmount.MEDIUM;

        // Get quote for the swap
        const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
            token0.address,
            token1.address,
            feeTier,
            inputAmount,
            0
        );

        // Calculate estimated gas cost
        const ESTIMATED_GAS_LIMIT = ethers.BigNumber.from(200_000);
        const gasFee = gasPrice.mul(ESTIMATED_GAS_LIMIT);
        
        // Convert gas fee to USD
        const gasFeeUSD = await convertGasToUSD(gasFee.toString(), chainId);

        // Calculate liquidity provider fee (0.3% for MEDIUM fee tier)
        const lpFeeAmount = ethers.BigNumber.from(inputAmount).mul(feeTier).div(1_000_000);
        const lpFeeUSD = await convertGasToUSD(lpFeeAmount.toString(), chainId);

        // Calculate total fee
        const totalFeeUSD = Number(gasFeeUSD) + Number(lpFeeUSD);

        // Calculate fee percentage
        const inputAmountNum = Number(inputAmount);
        const feePercentage = inputAmountNum > 0 ? 
            ((totalFeeUSD) / inputAmountNum * 100).toString() :
            '0';

        return {
            outputAmount: quotedAmountOut.toString(),
            gasFee: gasFee.toString(),
            gasFeeUSD: gasFeeUSD.toString(),
            liquidityProviderFee: lpFeeAmount.toString(),
            totalFee: gasFee.add(lpFeeAmount).toString(),
            totalFeeUSD: totalFeeUSD.toString(),
            feePercentage: feePercentage,
            poolFee: feeTier
        };
    } catch (error) {
        console.error('Error calculating Uniswap fees:', error);
        // Return a default fee estimation instead of throwing
        return {
            outputAmount: '0',
            gasFee: '0',
            gasFeeUSD: '0',
            liquidityProviderFee: '0',
            totalFee: '0',
            totalFeeUSD: '0',
            feePercentage: '0',
            poolFee: FeeAmount.MEDIUM
        };
    }
}

// For testing
if (require.main === module) {
    async function run() {
        const feeEstimation = await calculateUniswapFees(
            'BASE',
            'USDC',
            'WETH',
            String(100 * 10**6),              // Input amount (in the token's smallest unit, e.g., 1000 USDC)
        );
        console.log('Uniswap Fee Estimation:', feeEstimation);
    }
    run();
}