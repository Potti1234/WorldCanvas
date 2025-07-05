import { MiniKit } from '@worldcoin/minikit-js';
import CanvasABI from '../../abi/CanvasABI.json';

export const placePixelOnContract = async (x: number, y: number, color: string) => {
    if (!MiniKit.isInstalled()) {
      console.log('MiniKit not installed');
      return;
    }
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
      return payload.finalPayload.status;
    } catch (error) {
      console.error(error);
    }
  };
