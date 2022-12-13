import { useNetwork } from '@anchor-protocol/app-provider';
import { Gas, HumanAddr, Luna, u } from '@libs/types';
import { Msg } from '@terra-money/terra.js';
import big from 'big.js';
import { useCallback, useMemo, useState } from 'react';
import { useApp } from '../contexts/app';
import debounce from 'lodash.debounce';

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
  return useCallback(
    async (msgs: Msg[]) => {
      if (!walletAddress) {
        return undefined;
      }

      try {
        const { auth_info } = await lcdClient.tx.create(
          [{ address: walletAddress }],
          {
            msgs,
            gasAdjustment: constants.gasAdjustment,
            //@ts-ignore
            gasPrices: gasPrice,
          },
        );
        const estimatedFeeGas = auth_info.fee.amount
          .toArray()
          .reduce((feeTotal, coin) => {
            return feeTotal.plus(coin.amount.toString());
          }, big(0));
        return {
          gasWanted: auth_info.fee.gas_limit as Gas,
          txFee: Math.floor(estimatedFeeGas.toNumber()).toString() as u<Luna>,
        };
      } catch (error) {
        return undefined;
      }
    },
    [constants.gasAdjustment, gasPrice, lcdClient.tx, walletAddress],
  );
}

export function useFeeEstimationFor(
  walletAddress: HumanAddr | undefined,
): [
  EstimatedFee | undefined,
  string | undefined,
  (msgs: Msg[] | null) => void,
] {
  const estimateFee = useEstimateFee(walletAddress);
  const [estimatedFeeError, setEstimatedFeeError] = useState<
    string | undefined
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
          setEstimatedFee(undefined);
          return;
        }

        estimateFee(msgs)
          .then((estimated) => {
            if (estimated) {
              setEstimatedFee(estimated);
            } else {
              setEstimatedFee(undefined);
              setEstimatedFeeError(() => 'Error when estimating the Fee');
            }
          })
          .catch(() => {
            setEstimatedFeeError(() => 'Error when estimating the Fee');
          })
          .then((ui) => {});
      }, 500);
    }, [estimateFee, setEstimatedFeeError]),
  ];
}
