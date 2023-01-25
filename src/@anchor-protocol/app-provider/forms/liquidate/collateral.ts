import {
  liquidationWithdrawCollateralForm,
  LiquidationWithdrawCollateralFormStates,
} from '@anchor-protocol/app-fns/forms/liquidate/collateral';
import { getLiquidationWithdrawCollateralMsg } from '@anchor-protocol/app-fns/tx/liquidate/collateral';
import { useAnchorWebapp } from '@anchor-protocol/app-provider/contexts/context';
import { useAnchorBank } from '@anchor-protocol/app-provider/hooks/useAnchorBank';
import { defaultFee, EstimatedFee, useEstimateFee, useFeeEstimationFor } from '@libs/app-provider';
import { useForm } from '@libs/use-form';
import { useAccount } from 'contexts/account';
import { useCallback, useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';
import { CW20Addr, HumanAddr } from '@libs/types';
import { WhitelistCollateral } from 'queries';

export interface LiquidationWithdrawCollateralFormReturn
  extends LiquidationWithdrawCollateralFormStates {
  updateTxFee: () => void;
}

function useTxFee(tokenAddress: CW20Addr | undefined, tokenWrapperAddr: CW20Addr | undefined) {
  const { terraWalletAddress } = useAccount();

  const { contractAddress} = useAnchorWebapp();
  const [estimatedFee, estimatedFeeError, estimateFee] =
    useFeeEstimationFor(terraWalletAddress);

    useEffect(() => {
      if(!tokenAddress){
        return;
      }
       estimateFee( 
            getLiquidationWithdrawCollateralMsg({
            walletAddr: terraWalletAddress as HumanAddr,
            liquidationQueueAddr:
              contractAddress.liquidation.liquidationQueueContract,
            collateralToken: tokenAddress,
            tokenWrapperAddr: tokenWrapperAddr
          }))
      },
      [terraWalletAddress, contractAddress.liquidation.liquidationQueueContract, tokenAddress, tokenWrapperAddr]
    )

  return ({
    txFee: estimatedFee,
  })
}

export function useLiquidationWithdrawCollateralForm(collateral: WhitelistCollateral| undefined): LiquidationWithdrawCollateralFormReturn {
  const { connected } = useAccount();

  const {
    tokenBalances: { uLuna },
  } = useAnchorBank();

  const {
    txFee
  } = useTxFee(collateral?.collateral_token, (collateral && "info" in collateral) ? collateral.collateral_token : undefined);

  const [, states] = useForm(
    liquidationWithdrawCollateralForm,
    {
      isConnected: connected,
      fixedGas: txFee,
      userULunaBalance: uLuna,
    },
    () => ({}),
  );

  const updateTxFee = useCallback(() => {}, []);

  return {
    ...states,
    updateTxFee,
  };
}
