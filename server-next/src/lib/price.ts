import axios from 'axios';

// Cache prices for 1 minute to avoid too many API calls
const priceCache: { [key: string]: { price: number; timestamp: number } } = {};
const CACHE_DURATION = 60 * 1000; // 1 minute in milliseconds

// Map token symbols to their CoinGecko IDs
const TOKEN_ID_MAP: { [key: string]: string } = {
    'USDC': 'usd-coin',
    'USDT': 'tether',
    'WETH': 'weth',
    'ETH': 'ethereum',
    'ETHEREUM': 'ethereum',
    'MATIC': 'matic-network',
    'POLYGON': 'matic-network',
    'BNB': 'binancecoin',
    'AVAX': 'avalanche-2',
    'AVALANCHE': 'avalanche-2',
    'FTM': 'fantom',
    'FANTOM': 'fantom',
    'ARBITRUM': 'arbitrum',
    'OPTIMISM': 'optimism',
    'BASE': 'base'
};

export async function getTokenPriceInUSD(tokenSymbol: string): Promise<number> {
    const symbol = tokenSymbol.toUpperCase();
    
    // Check cache first
    const cached = priceCache[symbol];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.price;
    }

    try {
        // Get CoinGecko ID for the token
        const coinGeckoId = TOKEN_ID_MAP[symbol];
        if (!coinGeckoId) {
            console.warn(`No CoinGecko ID mapping found for ${symbol}, defaulting to ethereum price for native gas token`);
            // If no mapping found, try to use ethereum as default for native gas token
            const ethResponse = await axios.get(
                `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`
            );
            const ethPrice = ethResponse.data['ethereum']?.usd;
            if (ethPrice) {
                return ethPrice;
            }
            return 1; // Fallback to 1 USD if even ethereum price fails
        }

        const response = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd`
        );
        
        const price = response.data[coinGeckoId]?.usd;
        if (!price) {
            console.warn(`Price not found for ${symbol} (${coinGeckoId}), using default price of 1 USD`);
            return 1; // Default to 1 USD if price not found
        }

        // Cache the result
        priceCache[symbol] = {
            price,
            timestamp: Date.now()
        };

        return price;
    } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error);
        return 1; // Default to 1 USD in case of error
    }
}

export async function convertGasToUSD(gasFee: string, nativeTokenSymbol: string): Promise<number> {
    const nativeTokenPrice = await getTokenPriceInUSD(nativeTokenSymbol);
    const gasInEther = parseFloat(gasFee) / 1e18; // Convert from wei to ether
    return gasInEther * nativeTokenPrice;
}
