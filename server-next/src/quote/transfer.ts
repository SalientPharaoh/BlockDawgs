import { ethers } from 'ethers';

interface BuildTransferParams {
    to: string;
    amount: string;
    chainId: number;
}

export async function buildTransferTransaction(params: BuildTransferParams) {
    const { to, amount } = params;

    if (!ethers.utils.isAddress(to)) {
        throw new Error('Invalid recipient address');
    }

    // Build transaction object
    return {
        to,
        value: ethers.utils.parseEther(amount).toString(),
        data: '0x', // Empty data for native transfer
    };
}
