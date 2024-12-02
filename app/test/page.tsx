'use client';

import axios from 'axios';

// Hardcoded constants
const PATH_FINDER_API_URL = "https://api-beta.pathfinder.routerprotocol.com/api";
const TRANSACTION_BACKEND = 'https://e23c-36-255-87-26.ngrok-free.app';
const HARDCODED_WALLET = [{
    "network_name": "AVALANCHE",
    "address": "0x0f5342B55ABCC0cC78bdB4868375bCA62B6c16eA",
    "success": true
}];

interface RouterResponse {
    fromToken: string;
    toToken: string;
    data: any;
}

async function getTransaction(params: any, quoteData: any, sender: string, receiver: string) {
    const endpoint = "v2/transaction";
    const txDataUrl = `${PATH_FINDER_API_URL}/${endpoint}`;
    
    console.log('🔍 Pathfinder API Request:', {
        url: txDataUrl,
        params,
        quoteData,
        sender,
        receiver
    });

    try {
        console.log('📤 Sending request to Pathfinder API...');
        const res = await axios.post(txDataUrl, {
            ...quoteData,
            slippageTolerance: 0.5,
            senderAddress: sender,
            receiverAddress: receiver,
        });
        console.log('📥 Pathfinder API Response:', res.data);
        return res.data;
    } catch (e: any) {
        console.error('❌ Pathfinder API Error:', {
            message: e.message,
            response: e.response?.data,
            status: e.response?.status,
            headers: e.response?.headers
        });
        throw e;
    }
}

async function testRouterTransaction(
    fromToken: string = "USDT",  // USDT on Avalanche
    toToken: string = "USDC",    // USDC on Avalanche
    fromChainName: string = "AVALANCHE",
    toChainName: string = "AVALANCHE",
    inputAmount: string = "75",
    receiverAddress: string = "0x322C2C28c8eD38cA016F93E3Fd6e809d52d8dC3E"  // Same as sender for testing
) {
    console.log('🚀 Starting Router Transaction Test');
    console.log('📝 Input Parameters:', {
        fromToken,
        toToken,
        fromChainName,
        toChainName,
        inputAmount,
        receiverAddress,
        wallet: HARDCODED_WALLET[0]
    });

    try {
        // First API call to your backend
        const backendRequestBody = {
            fromToken,
            toToken,
            fromChainName,
            toChainName,
            inputAmount
        };
        console.log('📤 Backend Request:', {
            url: `${TRANSACTION_BACKEND}/api/transactions/build/router`,
            body: backendRequestBody
        });

        const response = await fetch(`${TRANSACTION_BACKEND}/api/transactions/build/router`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(backendRequestBody)
        });

        console.log('📥 Backend Response Status:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Backend Error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            throw new Error(`Router transaction failed: ${response.status} ${response.statusText}\n${errorText}`);
        }

        const routerResponse: RouterResponse = await response.json();
        console.log('✅ Backend Response Data:', routerResponse);

        // Prepare pathfinder parameters
        const pathfinderParams = {
            'fromTokenAddress': routerResponse.fromToken,
            'toTokenAddress': routerResponse.toToken,
            'fromTokenChainId': "43114",  // Avalanche C-Chain
            'toTokenChainId': "43114",    // Avalanche C-Chain
            'widgetId': 0,
        };

        console.log('🔄 Preparing Pathfinder Request:', {
            params: pathfinderParams,
            quoteData: routerResponse.data,
            sender: HARDCODED_WALLET[0].address,
            receiver: receiverAddress
        });

        // Second API call to pathfinder
        const txResponse = await getTransaction(
            pathfinderParams,
            routerResponse.data,
            HARDCODED_WALLET[0].address,
            receiverAddress
        );

        console.log('✅ Transaction Complete:', txResponse);
        return txResponse;

    } catch (error: any) {
        console.error('❌ Transaction Error:', {
            message: error.message,
            cause: error.cause,
            stack: error.stack,
            response: error.response?.data
        });
        throw error;
    }
}

export default function TestPage() {
    const handleTest = async () => {
        console.group('🧪 Router Transaction Test');
        try {
            console.log('🏁 Initiating test with wallet:', HARDCODED_WALLET);
            const result = await testRouterTransaction();
            console.log('🎉 Test completed successfully:', result);
        } catch (error: any) {
            console.error('💥 Test failed:', {
                message: error.message,
                cause: error.cause,
                response: error.response?.data
            });
        } finally {
            console.groupEnd();
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Router Transaction Test Page</h1>
            <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">Current Configuration:</h2>
                <pre className="bg-gray-100 p-4 rounded">
                    {JSON.stringify({
                        wallet: HARDCODED_WALLET[0].address,
                        fromToken: "USDT",
                        toToken: "USDC",
                        fromChain: "AVALANCHE",
                        toChain: "AVALANCHE",
                        amount: "75"
                    }, null, 2)}
                </pre>
            </div>
            <button 
                onClick={handleTest}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                Test Router Transaction
            </button>
            <div className="mt-4 text-sm text-gray-600">
                Check browser console (F12) for detailed logs
            </div>
        </div>
    );
}