import axios from 'axios';
import BigNumber from 'bignumber.js';
import { getTokenDetails } from '../lib/constants';
import { FeeEstimation } from '../types';
import { convertGasToUSD } from '../lib/price';

const PATH_FINDER_API_URL = "https://api-beta.pathfinder.routerprotocol.com/api";

// Interfaces
interface QuoteParams {
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    fromTokenChainId: string;
    toTokenChainId: string;
    partnerId: string;
}

// Fetch quote from Pathfinder API and calculate fees
const getQuote = async (params: QuoteParams): Promise<FeeEstimation | null> => {
    const quoteUrl = `${PATH_FINDER_API_URL}/v2/quote`;
    
    try {
        const response = await axios.get(quoteUrl, { params });
        
        // Get decimals from the response
        const sourceDecimals = response.data.source.asset.decimals;
        const destDecimals = response.data.destination.asset.decimals;
        const bridgeFeeDecimals = response.data.bridgeFee?.decimals || destDecimals;

        // Convert amounts to BigNumber with proper scaling
        const inputAmountBN = new BigNumber(response.data.source.tokenAmount)
            .dividedBy(new BigNumber(10).pow(sourceDecimals));
            
        const outputAmountBN = new BigNumber(response.data.destination.tokenAmount)
            .dividedBy(new BigNumber(10).pow(destDecimals));

        // Handle bridge fee conversion
        const bridgeFeeBN = response.data.bridgeFee?.amount 
            ? new BigNumber(response.data.bridgeFee.amount)
                .dividedBy(new BigNumber(10).pow(bridgeFeeDecimals))
            : new BigNumber('0');

        // LP fee in source token decimals
        const liquidityProviderFeeBN = new BigNumber(response.data.sameChainSwapFee || '0')
            .dividedBy(new BigNumber(10).pow(sourceDecimals));

        // Calculate total fee in terms of source token
        const totalFeeBN = bridgeFeeBN.plus(liquidityProviderFeeBN);

        // Convert bridge fee to USD if needed
        const gasFeeUSD = await convertGasToUSD(
            response.data.bridgeFee?.amount || '0',
            response.data.bridgeFee?.symbol || response.data.destination.asset.symbol
        );

        // Calculate fee percentage based on input amount
        const feePercentage = bridgeFeeBN
            .dividedBy(outputAmountBN)
            .multipliedBy(100)
            .toFixed(2);

        return {
            outputAmount: response.data.destination.tokenAmount,
            gasFee: bridgeFeeBN.toString(),
            gasFeeUSD: gasFeeUSD.toFixed(2),
            liquidityProviderFee: liquidityProviderFeeBN.toString(),
            totalFee: totalFeeBN.toString(),
            totalFeeUSD: gasFeeUSD.toFixed(2),
            feePercentage: `${feePercentage}%`
        };
    } catch (error) {
        console.error('Error fetching quote:', error);
        return null;
    }
};

// Function to get Router Protocol quote data for transaction
export const getRouterQuoteData = async (
    fromSymbol: string,
    toSymbol: string,
    inputAmount: string,
    fromChain: string,
    toChain: string,
    userAddress: string,
    receiverAddress: string
): Promise<any> => {
    try {
        const fromTokenDetails = getTokenDetails(fromChain, fromSymbol);
        const toTokenDetails = getTokenDetails(toChain, toSymbol);

        if (!fromTokenDetails || !toTokenDetails) {
            throw new Error('Token details not found');
        }

        const params = {
            fromTokenAddress: fromTokenDetails.address,
            toTokenAddress: toTokenDetails.address,
            amount: inputAmount,
            fromTokenChainId: String(fromTokenDetails.chainId),
            toTokenChainId: String(toTokenDetails.chainId),
            userAddress: userAddress,
            recipient: receiverAddress,
            partnerId: "1", // Default partner ID
        };

        const response = await axios.get(
            'https://api.pathfinder.routerprotocol.com/api/v2/quote',
            { params }
        );

        if (!response.data) {
            throw new Error('No quote data received from Router Protocol');
        }

        return {
            success: true,
            data: {
                ...response.data,
            }
        };
    } catch (error) {
        console.error('Error getting Router Protocol quote data:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};

// Main function to calculate fees for a given quote
export const calculateRouterFees = async (
    fromSymbol: string,
    toSymbol: string,
    amount: string,
    fromChain: string,
    toChain: string
): Promise<FeeEstimation | null> => {
    // Get token details for the given symbols
    const fromTokenDetails = getTokenDetails(fromChain, fromSymbol);
    const toTokenDetails = getTokenDetails(toChain, toSymbol);
    
    if (!fromTokenDetails || !toTokenDetails) {
        console.error('Token details not found for the given symbols');
        return null;
    }

    // Create the quote parameters
    const params: QuoteParams = {
        fromTokenAddress: fromTokenDetails.address,
        toTokenAddress: toTokenDetails.address,
        amount: amount,
        fromTokenChainId: String(fromTokenDetails.chainId),
        toTokenChainId: String(toTokenDetails.chainId),
        partnerId: "1", // Default partner ID
    };
    const quote = await getQuote(params);
    return quote;
};

// For direct module execution (testing purposes)
if (require.main === module) {
    async function run() {
        console.log(await calculateRouterFees("USDC", "WETH", String(1000 * 10**6), "POLYGON", "BASE").catch(console.error));
    }
    run();
}