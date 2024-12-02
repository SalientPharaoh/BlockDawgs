require('dotenv').config();

import express, { Request, json, Response } from 'express';
import cors from 'cors';
import { ActivityController } from './controllers/activityControllers';
import CrossChainRouteFinder from './CrossChainRouteFinder';
import { getRouterQuoteData } from './quote/router';

const app = express();
const routeFinder = new CrossChainRouteFinder();

app.use(json());
app.use(cors());

app.get('/', (req: Request, res: Response) => {
    return res.status(200).send('Server is running!');
});

// ? ==============================================================
// ? API ROUTES
// ? ==============================================================

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

        return res.status(200).json({
            success: true,
            data: {
                routes
            }
        });
    } catch (error) {
        console.error('Error finding route:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get Router Protocol quote data for transaction
app.post('/api/router-quote', async (req: Request, res: Response) => {
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

        const quoteData = await getRouterQuoteData(
            fromToken,
            toToken,
            inputAmount,
            fromChainName,
            toChainName,
            userAddress,
            receiverAddress
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
