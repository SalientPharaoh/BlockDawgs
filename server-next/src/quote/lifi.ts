import { createConfig, getRoutes, type RoutesRequest } from '@lifi/sdk';
import { convertGasToUSD } from '../lib/price';
import { FeeEstimation } from '../types';
import { tokenDetails } from '../lib/constants';
import { ChainId } from '@uniswap/sdk-core';

// Initialize LiFi SDK
createConfig({
    integrator: 'BlockDawgs',
});

// Chain ID mapping
const CHAIN_IDS: { [key: string]: number } = {
    'POLYGON': ChainId.POLYGON,
    'BASE': ChainId.BASE,
    'AVALANCHE': ChainId.AVALANCHE,
};

interface BuildLiFiParams {
    fromChainId: number;
    toChainId: number;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    fromAddress: string;
    toAddress: string;
    slippage?: number;
}

export const calculateLiFiFees = async (
    fromToken: string,
    toToken: string,
    inputAmount: string,
    fromChain: string,
    toChain: string,
): Promise<FeeEstimation | null> => {
    try {
        // Validate chain support
        if (!CHAIN_IDS[fromChain] || !CHAIN_IDS[toChain]) {
            console.error('Unsupported chain:', { fromChain, toChain });
            return null;
        }

        // Get token details from constants
        const fromTokenDetails = tokenDetails[fromChain]?.[fromToken];
        const toTokenDetails = tokenDetails[toChain]?.[toToken];

        // Validate token support
        if (!fromTokenDetails || !toTokenDetails) {
            console.error('Unsupported token:', { fromToken, toToken });
            return null;
        }

        const routesRequest: RoutesRequest = {
            fromChainId: CHAIN_IDS[fromChain],
            toChainId: CHAIN_IDS[toChain],
            fromTokenAddress: fromTokenDetails.address,
            toTokenAddress: toTokenDetails.address,
            fromAmount: inputAmount,
        };

        const result = await getRoutes(routesRequest);
        
        if (!result.routes || result.routes.length === 0) {
            console.error('No routes found');
            return null;
        }

        // Get the best route (first route is usually the best)
        const bestRoute = result.routes[0];
        
        // Calculate total gas costs from all steps
        const totalGasCosts = bestRoute.steps.reduce((sum, step) => {
            const stepGasCosts = step.estimate?.gasCosts || [];
            return sum + stepGasCosts.reduce((stepSum, gas) => stepSum + Number(gas.amount || 0), 0);
        }, 0);

        // Calculate total protocol fees from all steps
        const totalProtocolFees = bestRoute.steps.reduce((sum, step) => {
            const stepFeeCosts = step.estimate?.feeCosts || [];
            return sum + stepFeeCosts.reduce((stepSum, fee) => stepSum + Number(fee.amount || 0), 0);
        }, 0);

        // Get total gas cost in USD (using the route's gasCostUSD if available, otherwise calculate)
        const totalGasUSD = bestRoute.gasCostUSD ? 
            parseFloat(bestRoute.gasCostUSD) : 
            await convertGasToUSD(totalGasCosts.toString(), fromChain);

        // Calculate fee percentage based on USD values
        const fromAmountUSD = parseFloat(bestRoute.fromAmountUSD || '0');
        const feePercentage = fromAmountUSD > 0 ? 
            ((totalGasUSD + totalProtocolFees) / fromAmountUSD * 100).toString() :
            '0';

        return {
            outputAmount: bestRoute.toAmount,
            gasFee: totalGasCosts.toString(),
            gasFeeUSD: totalGasUSD.toString(),
            liquidityProviderFee: totalProtocolFees.toString(),
            totalFee: (totalGasCosts + totalProtocolFees).toString(),
            totalFeeUSD: (totalGasUSD + totalProtocolFees).toString(),
            feePercentage: feePercentage,
        };
    } catch (error) {
        console.error('Error calculating LiFi fees:', error);
        return null;
    }
};

// export async function buildLiFiTransaction(params: BuildLiFiParams) {
//     const {
//         fromChainId,
//         toChainId,
//         fromToken,
//         toToken,
//         fromAmount,
//         fromAddress,
//         toAddress,
//         slippage = 0.5
//     } = params;

//     // Get route
//     const routesRequest: RoutesRequest = {
//         fromChainId,
//         toChainId,
//         fromTokenAddress: fromToken,
//         toTokenAddress: toToken,
//         fromAmount,
//         fromAddress,
//         toAddress,
//         slippage: slippage / 100 // Convert percentage to decimal
//     };

//     const result = await getRoutes(routesRequest);

//     if (!result || result.routes.length === 0) {
//         throw new Error('No route found');
//     }

//     // Get the best route (first route is usually the best)
//     const bestRoute = result.routes[0];

//     // Extract transaction data from the first step
//     return {
//         to: bestRoute.steps[0].transaction.to,
//         data: bestRoute.steps[0].transaction.data,
//         value: bestRoute.steps[0].transaction.value,
//         gasLimit: bestRoute.steps[0].estimate.gasCosts[0].amount,
//         tool: bestRoute.steps[0].tool,
//         expectedOutput: bestRoute.toAmount
//     };
// }

// For testing
if (require.main === module) {
    async function run() {
        const feeEstimation = await calculateLiFiFees(
            'USDC',
            'WETH',
            String(1000 * 10**6),
            'POLYGON',
            'BASE'
        );
        console.log('LiFi Fee Estimation:', feeEstimation);
    }
    run();
}
