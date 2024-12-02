import { calculateUniswapFees } from './quote/uniswap';
import { calculateRouterFees } from './quote/router';
import { calculateLiFiFees } from './quote/lifi';
import { SWAP, CROSS_CHAIN } from './enums';
import { FeeEstimation } from './types';

interface RouteDetails {
    protocol: SWAP | CROSS_CHAIN | "NATIVE" | string;
    fromToken: string;
    toToken: string;
    fromChainName: string;
    toChainName: string;
    inputAmount: string;
    outputAmount: string;
    fee: FeeEstimation;
    userAddress: string;
    receiverAddress: string;
}

interface Quote {
    fromToken: string;
    toToken: string;
    fromChainName: string;
    toChainName: string;
    inputAmount: string;
    userAddress: string;
    receiverAddress: string;
}

function getProtocolName(protocol: SWAP | CROSS_CHAIN | "NATIVE"): string {
    if (protocol === SWAP.UNISWAP) return "UNISWAP";
    if (protocol === CROSS_CHAIN.ROUTER) return "ROUTER_PROTOCOL";
    if (protocol === CROSS_CHAIN.LIFI) return "LIFI";
    if (protocol === "NATIVE") return "NATIVE_TRANSFER";
    return "UNKNOWN";
}

const ONEINCH_DEFAULT_FEE: FeeEstimation = {
    outputAmount: "0",
    gasFee: "0.005",
    gasFeeUSD: "10", 
    liquidityProviderFee: "0.001",
    totalFee: "0.006",
    totalFeeUSD: "12", 
    feePercentage: "0.6"
};

class CrossChainRouteFinder {
    async findBestRoute(quote: Quote): Promise<RouteDetails[]> {
        const routes = await this.generatePossibleRoutes(quote);

        const validRoutes = routes.filter((route): route is RouteDetails[] => 
            route !== null && Array.isArray(route) && route.every((step): step is RouteDetails => step !== null)
        );
        
        if (validRoutes.length === 0) {
            return [];
        }

        // Evaluate each route's total cost
        const evaluatedRoutes = validRoutes.map(routeSteps => {
            const totalFeeUSD = routeSteps.reduce((sum, step) => 
                sum + parseFloat(step.fee.totalFeeUSD), 0);
            
            return {
                steps: routeSteps,
                totalFeeUSD,
                path: routeSteps.map(step => `${step.fromToken}(${step.fromChainName}) -> ${step.toToken}(${step.toChainName}) via ${getProtocolName(step.protocol as any)}`).join(' then '),
                inputAmount: routeSteps[0].inputAmount,
                outputAmount: routeSteps[routeSteps.length - 1].outputAmount
            };
        });

        // Sort by total fee in USD
        evaluatedRoutes.sort((a, b) => a.totalFeeUSD - b.totalFeeUSD);

        // Log all routes for comparison
        console.log('\nAll possible routes:');
        evaluatedRoutes.forEach((route, index) => {
            console.log(`\nRoute ${index + 1}:`);
            console.log(`Path: ${route.path}`);
            console.log(`Total Fee in USD: $${route.totalFeeUSD.toFixed(2)}`);
            console.log(`Output Amount: ${route.outputAmount}`);
            console.log('Steps:');
            route.steps.forEach((step, stepIndex) => {
                console.log(`  Step ${stepIndex + 1}:`);
                console.log(`    Protocol: ${getProtocolName(step.protocol as any)}`);
                console.log(`    From: ${step.fromToken} on ${step.fromChainName}`);
                console.log(`    To: ${step.toToken} on ${step.toChainName}`);
                console.log(`    Fee in USD: $${step.fee.totalFeeUSD}`);
            });
        });

        console.log(`\nBest route found: ${evaluatedRoutes[0].path}`);
        console.log(`Total Fee in USD: $${evaluatedRoutes[0].totalFeeUSD.toFixed(2)}`);

        return evaluatedRoutes[0].steps;
    }

    private async generatePossibleRoutes(quote: Quote): Promise<(RouteDetails[] | null)[]> {
        const routes: (RouteDetails[] | null)[] = [];

        try {
            // Path 1: Direct bridge using Router Protocol
            const directRouterRoute = await this.createCrossChainRoute(quote, CROSS_CHAIN.ROUTER);
            if (directRouterRoute) {
                const finalRoute = await this.addReceiverTransferIfNeeded([directRouterRoute], quote);
                if (finalRoute) routes.push(finalRoute);
            }

            // Path 2: Direct bridge using LiFi
            const directLiFiRoute = await this.createCrossChainRoute(quote, CROSS_CHAIN.LIFI);
            if (directLiFiRoute) {
                const finalRoute = await this.addReceiverTransferIfNeeded([directLiFiRoute], quote);
                if (finalRoute) routes.push(finalRoute);
            }

            // Path 3: Bridge USDC first, then swap to WETH
            // Step 1: Bridge USDC using LiFi
            const bridgeUSDCRoute = await this.createCrossChainRoute({
                ...quote,
                toToken: quote.fromToken, // Keep same token (USDC)
            }, CROSS_CHAIN.LIFI);

            if (bridgeUSDCRoute) {
                // Step 2: Swap USDC to WETH on destination chain
                const swapToWETHRoute = await this.createSwapRoute({
                    ...quote,
                    fromToken: quote.fromToken, // USDC
                    toToken: quote.toToken, // WETH
                    fromChainName: quote.toChainName, // We're now on the destination chain
                    toChainName: quote.toChainName,
                    inputAmount: bridgeUSDCRoute.outputAmount,
                });

                if (swapToWETHRoute) {
                    const finalRoute = await this.addReceiverTransferIfNeeded([bridgeUSDCRoute, swapToWETHRoute], quote);
                    if (finalRoute) routes.push(finalRoute);
                }
            }

            // Path 4: Alternative - Bridge USDC using Router, then swap
            const bridgeUSDCRouterRoute = await this.createCrossChainRoute({
                ...quote,
                toToken: quote.fromToken, // Keep same token (USDC)
            }, CROSS_CHAIN.ROUTER);

            if (bridgeUSDCRouterRoute) {
                const swapToWETHRouterPath = await this.createSwapRoute({
                    ...quote,
                    fromToken: quote.fromToken, // USDC
                    toToken: quote.toToken, // WETH
                    fromChainName: quote.toChainName,
                    toChainName: quote.toChainName,
                    inputAmount: bridgeUSDCRouterRoute.outputAmount,
                });

                if (swapToWETHRouterPath) {
                    const finalRoute = await this.addReceiverTransferIfNeeded(
                        [bridgeUSDCRouterRoute, swapToWETHRouterPath],
                        quote
                    );
                    if (finalRoute) routes.push(finalRoute);
                }
            }

        } catch (error) {
            console.error('Error generating routes:', error);
        }

        return routes;
    }

    private async addReceiverTransferIfNeeded(
        currentRoute: RouteDetails[],
        quote: Quote
    ): Promise<RouteDetails[] | null> {
        if (!currentRoute || currentRoute.length === 0) return null;

        // If userAddress and receiverAddress are the same, no need for additional transfer
        if (quote.userAddress.toLowerCase() === quote.receiverAddress.toLowerCase()) {
            return currentRoute;
        }

        const lastStep = currentRoute[currentRoute.length - 1];
        
        // Create a native transfer step
        const transferStep: RouteDetails = {
            protocol: "NATIVE",
            fromToken: lastStep.toToken,
            toToken: lastStep.toToken,
            fromChainName: lastStep.toChainName,
            toChainName: lastStep.toChainName,
            inputAmount: lastStep.outputAmount,
            outputAmount: lastStep.outputAmount, // Same amount, just transferred
            fee: {
                outputAmount: lastStep.outputAmount,
                gasFee: "21000", // Standard ERC20 transfer gas
                gasFeeUSD: "1", // Approximate USD cost for token transfer
                liquidityProviderFee: "0",
                totalFee: "21000",
                totalFeeUSD: "1",
                feePercentage: "0.1"
            },
            userAddress: quote.userAddress,
            receiverAddress: quote.receiverAddress
        };

        return [...currentRoute, transferStep];
    }

    private async createSwapRoute(quote: Quote): Promise<RouteDetails | null> {
        try {
            const uniswapFee = await calculateUniswapFees(
                quote.fromChainName,
                quote.fromToken,
                quote.toToken,
                quote.inputAmount
            );

            return {
                protocol: SWAP.UNISWAP, // Use enum value directly
                fromToken: quote.fromToken,
                toToken: quote.toToken,
                fromChainName: quote.fromChainName,
                toChainName: quote.toChainName,
                inputAmount: quote.inputAmount,
                outputAmount: uniswapFee.outputAmount,
                fee: uniswapFee,
                userAddress: quote.userAddress,
                receiverAddress: quote.receiverAddress
            };
        } catch (error) {
            console.error('Error creating swap route:', error);
            return null;
        }
    }

    private async createCrossChainRoute(quote: Quote, protocol: CROSS_CHAIN): Promise<RouteDetails | null> {
        try {
            let fee: FeeEstimation;
            if (protocol === CROSS_CHAIN.LIFI) {
                const liFiFee = await calculateLiFiFees(
                    quote.fromToken,
                    quote.toToken,
                    quote.inputAmount,
                    quote.fromChainName,
                    quote.toChainName
                );
                if (!liFiFee) return null;
                fee = liFiFee;
            } else {
                const routerFee = await calculateRouterFees(
                    quote.fromToken,
                    quote.toToken,
                    quote.inputAmount,
                    quote.fromChainName,
                    quote.toChainName
                );
                if (!routerFee) return null;
                fee = routerFee;
            }

            return {
                protocol: protocol,
                fromToken: quote.fromToken,
                toToken: quote.toToken,
                fromChainName: quote.fromChainName,
                toChainName: quote.toChainName,
                inputAmount: quote.inputAmount,
                outputAmount: fee.outputAmount,
                fee: fee,
                userAddress: quote.userAddress,
                receiverAddress: quote.receiverAddress
            };
        } catch (error) {
            console.error('Error creating cross-chain route:', error);
            return null;
        }
    }
}

export default CrossChainRouteFinder;

if (require.main === module) {
    async function run() {
        const routeFinder = new CrossChainRouteFinder();
        const testQuote: Quote = {
            fromToken: "USDC",
            toToken: "WETH",
            fromChainName: "BASE",
            toChainName: "POLYGON",
            inputAmount: String(1000 * 10**6), // 1000 USDC
            userAddress: "0xUser1",
            receiverAddress: "0xUser2",
        };

        try {
            const bestRoute = await routeFinder.findBestRoute(testQuote);
            console.log('\nRoute execution order:');
            bestRoute.forEach((step, index) => {
                console.log(`\nStep ${index + 1}:`);
                console.log(`Protocol: ${getProtocolName(step.protocol as any)}`);
                console.log(`From: ${step.fromToken} (${step.fromChainName})`);
                console.log(`To: ${step.toToken} (${step.toChainName})`);
                console.log(`Fee in USD: $${parseFloat(step.fee.totalFeeUSD).toFixed(2)}`);
            });
        } catch (error) {
            console.error("Error finding best route:", error);
        }
    }
    run();
}