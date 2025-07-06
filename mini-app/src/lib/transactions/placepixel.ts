import { MiniKit } from '@worldcoin/minikit-js';
import CanvasABI from '../../abi/CanvasABI.json';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useEffect } from 'react';

export const usePlacePixelOnContract = (
    onSuccess?: (data: any) => void,
    onError?: (error: Error) => void
) => {
    const { data: hash, writeContractAsync, isPending: isSubmitting, error: submitError } = useWriteContract();

    const placePixel = async (x: number, y: number, color: string) => {
        if (import.meta.env.VITE_DISABLE_TRANSACTION === 'true') {
            console.log('Transactions disabled, skipping contract call.');
            onSuccess?.({ status: 'success', simulated: true });
            return;
        }
        if (!MiniKit.isInstalled()) {
            const contractAddressRonin = '0xDB611E19303debA0C967A6f293E23Fc5D9D58513';
            await writeContractAsync({
                abi: CanvasABI,
                address: contractAddressRonin,
                functionName: 'placePixel',
                args: [x, y, color],
            });
        } else {
            const contractAddress = '0xa5965CE7Be95efa849BD0a7921ebe7C1C69301e6';
            const functionName = 'placePixel';
            try {
                const payload = await MiniKit.commandsAsync.sendTransaction({
                    transaction: [
                        {
                            address: contractAddress,
                            abi: CanvasABI,
                            functionName: functionName,
                            args: [x, y, color],
                        },
                    ],
                });
                onSuccess?.(payload.finalPayload);
            } catch (error) {
                onError?.(error as Error);
                console.error(error);
            }
        }
    };

    const {
        data: receipt,
        isLoading: isConfirming,
        isSuccess: isConfirmed,
        error: confirmationError,
    } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (receipt && isConfirmed) {
            onSuccess?.(receipt);
        }
        if (submitError || confirmationError) {
            onError?.((submitError || confirmationError)!);
        }
    }, [receipt, isConfirmed, onSuccess, submitError, confirmationError, onError]);

    return {
        placePixel,
        isSubmitting,
        isConfirming,
        isConfirmed,
        hash,
        receipt,
        error: submitError || confirmationError,
    };
};
