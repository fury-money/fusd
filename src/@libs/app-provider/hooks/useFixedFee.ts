import { computeGasToLuna } from '@anchor-protocol/app-fns';
import { useDeploymentTarget } from '@anchor-protocol/app-provider';
import { useApp } from '@libs/app-provider';
import { Luna, u } from '@libs/types';

export function useFixedFee(): u<Luna> {
  const {
    target: { isNative },
  } = useDeploymentTarget();
  const { constants, gasPrice } = useApp();

  if (isNative) {
    return computeGasToLuna(gasPrice, constants.fixedGas);
  }

  return '0' as u<Luna>;
}
