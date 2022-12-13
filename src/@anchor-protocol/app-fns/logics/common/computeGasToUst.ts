import { GasPrice } from '@libs/app-fns';
import { Gas, Luna, u } from '@libs/types';
import { BigSource } from 'big.js';
import { computeGasPrice } from './computeGasPrice';

export const computeGasToLuna = (
  gasPrice: GasPrice,
  gas: Gas<BigSource>,
): u<Luna> => {
  return computeGasPrice(gasPrice, gas, 'uluna') as u<Luna>;
};
