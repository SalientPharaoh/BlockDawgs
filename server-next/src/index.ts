require('dotenv').config();

import express, { Request, json, Response } from 'express';
import cors from 'cors';
import { ActivityController } from './controllers/activityControllers';
import CrossChainRouteFinder from './CrossChainRouteFinder';
import { buildUniswapTransaction } from './quote/uniswap';
import { buildTransferTransaction } from './quote/transfer';
// import { buildLiFiTransaction } from './quote/lifi';
import { getRouterQuoteData } from './quote/router';
const { ethers } = require('ethers');

const app = express();
const routeFinder = new CrossChainRouteFinder();

type TokenSymbol = 'USDC' | 'USDT' | 'ETH' | 'WETH';
type TokenDecimalsMap = {
    [key in TokenSymbol]: number;
};

// Token decimals mapping with type safety
const TOKEN_DECIMALS: TokenDecimalsMap = {
    'USDC': 6,
    'USDT': 6,
    'ETH': 18,
    'WETH': 18
};

const convertToWei = (amount: string | number, token: string) => {
    const tokenSymbol = token.toUpperCase() as TokenSymbol;

    if (!(tokenSymbol in TOKEN_DECIMALS)) {
        throw new Error(`Unsupported token: ${token}`);
    }

    const decimals = TOKEN_DECIMALS[tokenSymbol];
    return ethers.utils.parseUnits(amount.toString(), decimals);
};

const processTokenInput = (fromToken: string, inputAmount: any) => {
    // Convert token symbols to uppercase for comparison
    const tokenSymbol = fromToken.toUpperCase();
    let processedToken = fromToken;
    let inputWeiAmount;

    // Convert ETH to WETH if necessary
    if (tokenSymbol === 'ETH') {
        processedToken = 'WETH'; // Convert to WETH address in your contract
    }

    // Convert input amount to Wei based on token decimals
    try {
        inputWeiAmount = convertToWei(inputAmount, tokenSymbol);
    } catch (error) {
        throw new Error(`Error converting amount to wei: ${error}`);
    }

    return {
        processedToken,
        inputWeiAmount: inputWeiAmount.toString()
    };
};

app.use(json());
app.use(cors());

app.get('/', (req: Request, res: Response) => {
    return res.status(200).send('Server is running!');
});

// ? ==============================================================
// ? TRANSACTION BUILDER ENDPOINTS
// ? ==============================================================

// Build Uniswap swap transaction
app.post('/api/transactions/build/uniswap', async (req: Request, res: Response) => {
    try {
        const {
            chainId,
            tokenIn,
            tokenOut,
            amount,
            slippageTolerance,
            recipient,
            deadline
        } = req.body;

        // Validate required parameters
        if (!chainId || !tokenIn || !tokenOut || !amount || !recipient) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters. Need chainId, tokenIn, tokenOut, amount, and recipient.'
            });
        }

        const transaction = await buildUniswapTransaction({
            chainId,
            tokenIn,
            tokenOut,
            amount,
            slippageTolerance,
            recipient,
            deadline
        });

        return res.json({
            success: true,
            data: transaction
        });

    } catch (error) {
        console.error('Error building Uniswap transaction:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});

// Build native token transfer transaction
app.post('/api/transactions/build/transfer', async (req: Request, res: Response) => {
    try {
        const { to, amount, chainId } = req.body;

        // Validate required parameters
        if (!to || !amount || !chainId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters. Need to, amount, and chainId.'
            });
        }

        const transaction = await buildTransferTransaction({
            to,
            amount,
            chainId
        });

        return res.json({
            success: true,
            data: transaction
        });

    } catch (error) {
        console.error('Error building transfer transaction:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});

// Build LiFi cross-chain transaction
// app.post('/api/transactions/build/lifi', async (req: Request, res: Response) => {
//     try {
//         const {
//             fromChainId,
//             toChainId,
//             fromToken,
//             toToken,
//             fromAmount,
//             fromAddress,
//             toAddress,
//             slippage
//         } = req.body;

//         // Validate required parameters
//         if (!fromChainId || !toChainId || !fromToken || !toToken || 
//             !fromAmount || !fromAddress || !toAddress) {
//             return res.status(400).json({ 
//                 success: false,
//                 error: 'Missing required parameters' 
//             });
//         }

//         const transaction = await buildLiFiTransaction({
//             fromChainId,
//             toChainId,
//             fromToken,
//             toToken,
//             fromAmount,
//             fromAddress,
//             toAddress,
//             slippage
//         });

//         return res.json({
//             success: true,
//             data: transaction
//         });

//     } catch (error) {
//         console.error('Error building LiFi transaction:', error);
//         return res.status(500).json({ 
//             success: false,
//             error: error instanceof Error ? error.message : 'Unknown error occurred'
//         });
//     }
// });

app.post('/api/transactions/build/router', async (req: Request, res: Response) => {
    try {
        const {
            fromToken,
            toToken,
            fromChainName,
            toChainName,
            inputAmount
        } = req.body;

        // Validate required parameters
        if (!fromToken || !toToken || !fromChainName || !toChainName || !inputAmount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters'
            });
        }

        const quoteData = await getRouterQuoteData(
            fromToken,
            toToken,
            inputAmount,
            fromChainName,
            toChainName
        );

        if (!quoteData.success) {
            return res.status(400).json(quoteData);
        }

        return res.status(200).json(quoteData);

    } catch (error) {
        console.error('Error getting Router Protocol quote:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});

app.post('/api/request-route', async (req: Request, res: Response) => {
    try {
        const {
            fromToken,
            toToken,
            fromChainName,
            toChainName,
            inputAmount,
            userAddress,
            receiverAddress
        } = req.body;

        // Validate required parameters
        if (!fromToken || !toToken || !fromChainName || !toChainName || !inputAmount || !userAddress || !receiverAddress) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters'
            });
        }

        const { processedToken, inputWeiAmount } = processTokenInput(fromToken, inputAmount);

        const quote = {
            fromToken,
            toToken,
            fromChainName,
            toChainName,
            inputAmount,
            userAddress,
            receiverAddress
        };

        const routes = await routeFinder.findBestRoute(quote);

        if (!routes || routes.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No valid routes found'
            });
        }

        return res.json({
            success: true,
            data: {
                routes
            }
        });
    } catch (error) {
        console.error('Error finding route:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
});

// ==============================================================

const PORT = process.env.PORT as string;
app.listen(PORT, async () => {
    console.log(`>>>> Server is running on http://localhost:${PORT} 🟢`);
    await ActivityController.init();
});

// INPUT
// Quote {
//     fromToken: string
//     toToken: string
//     fromChainName: string
//     toChainName: string
//     inputAmount: string
//     userAddress: string
//     receiverAddress: string
// }


// OUTPUT
// Route {
//     DAPP: string or enum
//     fromToken: string
//     toToken: string
//     fromAddress: string
//     toAddress: string
//     fromChainId: string
//     toChainId: string
//     inputAmount: bigint
//     outputAmount: bigint
// userAddress: string
// receiverAddress: string
// }
