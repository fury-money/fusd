import { useAnchorBank, useAnchorWebapp, useNetwork } from '@anchor-protocol/app-provider';
import { Gas, HumanAddr, Luna, u } from '@libs/types';
import { Msg } from '@terra-money/terra.js';
import big from 'big.js';
import { useCallback, useMemo, useState } from 'react';
import { useApp } from '../contexts/app';
import debounce from 'lodash.debounce';
import { simulateFetch } from '@libs/query-client';
import React from "react";
import { InfoTooltip } from '@libs/neumorphism-ui/components/InfoTooltip';

export interface EstimatedFee {
  gasWanted: Gas;
  txFee: u<Luna>;
}

export interface EstimatedHumanFee {
  gasWanted: Gas;
  txFee: u<Luna>;
}

export function defaultFee(): EstimatedFee {
  return {
    gasWanted: 0 as Gas,
    txFee: '0' as u<Luna>,
  };
}

export function useEstimateFee(
  walletAddress: HumanAddr | undefined,
): (msgs: Msg[]) => Promise<EstimatedFee | undefined> {
  const { lcdClient } = useNetwork();
  const { gasPrice, constants } = useApp();
  const { queryClient } = useAnchorWebapp();

  return useCallback(
    async (msgs: Msg[]) => {
      if (!walletAddress) {
        return undefined;
      }

      // We first try simulating the fee with the global method
      const gasWanted = await simulateFetch({
        ...queryClient,
        msgs,
        address: walletAddress,
        lcdClient,
        gasInfo: {
          gasAdjustment: constants.gasAdjustment,  
          //@ts-ignore
          gasPrice: gasPrice,
        }
      })
      if(!gasWanted){
        throw "Gas Wanted is zero, tx Fee compute error"
      }

      return {
        gasWanted: gasWanted as Gas,
        txFee: Math.ceil(gasWanted * parseFloat(gasPrice.uluna)).toString() as u<Luna>
      };
      
    },
    [constants.gasAdjustment, gasPrice, lcdClient, walletAddress, queryClient],
  );
}

export function useFeeEstimationFor(
  walletAddress: HumanAddr | undefined,
): [
  EstimatedFee | undefined,
  string | JSX.Element | undefined,
  (msgs: Msg[] | null) => void,
] {
  const estimateFee = useEstimateFee(walletAddress);
  const [estimatedFeeError, setEstimatedFeeError] = useState<
    string | JSX.Element | undefined
  >();

  const [estimatedFee, setEstimatedFee] = useState<EstimatedFee | undefined>();

  return [
    estimatedFee,
    estimatedFeeError,
    useMemo(() => {
      return debounce((msgs: Msg[] | null) => {
        setEstimatedFeeError(undefined);
        setEstimatedFee(undefined);
        if (!msgs) {
          return;
        }

        estimateFee(msgs)
          .then((estimated) => {
            setEstimatedFeeError(undefined);
            setEstimatedFee(estimated);
          })
          .catch((error) => {
            setEstimatedFeeError(() => (<div style={{display:"flex", alignItems: "center"}}>
                Error simulating the transaction
                <InfoTooltip style={{display: "inline", marginLeft: 10}}>
                  {error.toString()}
                </InfoTooltip>
              </div>)); 
            setEstimatedFee(undefined);
          })
          .then((ui) => {});
      }, 500);
    }, [estimateFee, setEstimatedFeeError, setEstimatedFee]),
  ];
}
