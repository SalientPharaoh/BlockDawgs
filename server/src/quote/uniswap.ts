import { ethers } from 'ethers';
import { FeeAmount } from '@uniswap/v3-sdk';
import { Token, CurrencyAmount, TradeType, Percent, Currency } from '@uniswap/sdk-core';
import {
    Pool,
    Route,
    SwapOptions,
    SwapQuoter,
    SwapRouter,
    Trade,
} from '@uniswap/v3-sdk';
import { getTokenDetails, getChainConfig } from '../lib/constants';
import { FeeEstimation } from '../types';
import { convertGasToUSD } from '../lib/price';

interface BuildSwapParams {
    chainId: number;
    tokenIn: {
        address: string;
        decimals: number;
    };
    tokenOut: {
        address: string;
        decimals: number;
    };
    amount: string;
    slippageTolerance?: string;
    recipient: string;
    deadline?: number;
}

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
import JSBI from 'jsbi';

// Constants
const SWAP_ROUTER_ADDRESS = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
const QUOTER_CONTRACT_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';
const DEFAULT_DEADLINE_MINUTES = 20;
const DEFAULT_POOL_FEE = 3000; // 0.3%

// ERC20 ABI for approval
const ERC20_ABI = [
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function allowance(address owner, address spender) external view returns (uint256)'
];

// Types
interface BuildUniswapParams {
    chainId: number;
    tokenIn: Token;
    tokenOut: Token;
    amount: string;
    slippageTolerance?: number;
    recipient: string;
    deadline?: number;
}

interface PoolInfo {
    sqrtPriceX96: string;
    liquidity: string;
    tick: number;
}

interface TransactionResponse {
    success: boolean;
    data?: {
        approve: {
            to: string;
            data: string;
            value: string;
        };
        swap: {
            to: string;
            data: string;
            value: string;
            gasLimit: string;
        };
        expectedOutput: string;
    };
    error?: string;
}

// Main function to build Uniswap transaction
export async function buildUniswapTransaction(params: BuildUniswapParams): Promise<TransactionResponse> {
    try {
        const {
            chainId,
            tokenIn,
            tokenOut,
            amount,
            recipient,
            deadline = Math.floor(Date.now() / 1000) + (DEFAULT_DEADLINE_MINUTES * 60)
        } = params;

        // Create trade
        const trade = await createTrade(tokenIn, tokenOut, amount);

        // Get swap transaction
        const swapTransaction = await createSwapTransaction(trade, {
            slippageTolerance: new Percent(0.5),
            deadline,
            recipient
        });

        // Get approve transaction
        const approveTransaction = await createApproveTransaction(tokenIn, amount);

        return {
            success: true,
            data: {
                approve: approveTransaction,
                swap: swapTransaction,
                expectedOutput: trade.outputAmount.quotient.toString()
            }
        };

    } catch (error) {
        console.error('Error building Uniswap transaction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

// Helper functions for trade creation
async function createTrade(tokenIn: Token, tokenOut: Token, amount: string): Promise<Trade<Token, Token, TradeType>> {
    const poolInfo = await getPoolInfo(tokenIn, tokenOut);
    const pool = createPool(tokenIn, tokenOut, poolInfo);
    const route = new Route([pool], tokenIn, tokenOut);
    const amountOut = await getOutputQuote(route, amount, tokenIn.decimals);

    return Trade.createUncheckedTrade({
        route,
        inputAmount: CurrencyAmount.fromRawAmount(
            tokenIn,
            fromReadableAmount(amount, tokenIn.decimals).toString()
        ),
        outputAmount: CurrencyAmount.fromRawAmount(
            tokenOut,
            JSBI.BigInt(amountOut)
        ),
        tradeType: TradeType.EXACT_INPUT,
    });
}

function createPool(tokenIn: Token, tokenOut: Token, poolInfo: PoolInfo): Pool {
    return new Pool(
        tokenIn,
        tokenOut,
        DEFAULT_POOL_FEE,
        poolInfo.sqrtPriceX96,
        poolInfo.liquidity,
        poolInfo.tick
    );
}

async function createSwapTransaction(
    trade: Trade<Token, Token, TradeType>,
    options: SwapOptions
): Promise<{ to: string; data: string; value: string; gasLimit: string }> {
    const methodParameters = SwapRouter.swapCallParameters([trade], options);

    return {
        to: SWAP_ROUTER_ADDRESS,
        data: methodParameters.calldata,
        value: methodParameters.value,
        gasLimit: '350000' // Estimated gas limit
    };
}

async function createApproveTransaction(
    token: Token,
    amount: string
): Promise<{ to: string; data: string; value: string }> {
    const approveData = await getTokenTransferApproval(token, amount);

    return {
        to: token.address,
        data: approveData,
        value: '0'
    };
}

// Low-level helper functions
async function getPoolInfo(tokenIn: Token, tokenOut: Token): Promise<PoolInfo> {
    // This is a mock implementation - you should implement actual pool info fetching
    return {
        sqrtPriceX96: '1',
        liquidity: '1000000',
        tick: 0
    };
}

async function getOutputQuote(
    route: Route<Currency, Currency>,
    amountIn: string,
    decimals: number
): Promise<string> {
    const { calldata } = await SwapQuoter.quoteCallParameters(
        route,
        CurrencyAmount.fromRawAmount(
            route.input,
            fromReadableAmount(amountIn, decimals).toString()
        ),
        TradeType.EXACT_INPUT,
        { useQuoterV2: true }
    );

    // In production, you would make an actual RPC call here
    const quoteCallReturnData = await mockProviderCall(calldata);
    return ethers.utils.defaultAbiCoder.decode(['uint256'], quoteCallReturnData)[0];
}

async function getTokenTransferApproval(token: Token, amount: string): Promise<string> {
    const iface = new ethers.utils.Interface(ERC20_ABI);
    return iface.encodeFunctionData('approve', [
        SWAP_ROUTER_ADDRESS,
        fromReadableAmount(amount, token.decimals).toString()
    ]);
}

function fromReadableAmount(amount: string, decimals: number): JSBI {
    const extraDigits = Math.pow(10, decimals);
    const adjustedAmount = Number(amount) * extraDigits;
    return JSBI.BigInt(Math.floor(adjustedAmount));
}

// Mock function for demo - replace with actual provider call in production
async function mockProviderCall(calldata: string): Promise<string> {
    return ethers.utils.defaultAbiCoder.encode(['uint256'], [ethers.utils.parseEther('1')]);
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