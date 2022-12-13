import { useDeploymentTarget, Chain } from '@anchor-protocol/app-provider';
import { ANC, aUST, bLuna, Native, Token } from '@anchor-protocol/types';
import { UST, Luna, NoMicro, u } from '@libs/types';
import { BigSource } from 'big.js';
import { useMemo } from 'react';
import {
  Formatters,
  Formatter,
  FormatterOutputOptions,
  microfy,
  demicrofy,
  formatOutput,
  formatInput,
} from '.';

const createFormatter = <T>(symbol: string, decimals: number): Formatter<T> => {
  return {
    formatOutput: (amount: T & NoMicro, options?: FormatterOutputOptions) =>
      formatOutput(amount, options),
    formatInput: (amount: BigSource): T => formatInput(amount, decimals),
    microfy: (amount: T): u<T> => microfy(amount as T & NoMicro, decimals),
    demicrofy: (amount: u<T> | Token<BigSource>): T =>
      demicrofy(amount, decimals),
    symbol,
    decimals,
  };
};

const useFormatters = (): Formatters => {
  const {
    target: { chain },
  } = useDeploymentTarget();
  return useMemo<Formatters>(() => {
    const tokens = {
      axlUSDC: createFormatter<UST>('axlUSDC', 6),
      ust: createFormatter<UST>('axlUSDC', 6),
      aUST: createFormatter<aUST>('aUST', 6),
      anc: createFormatter<ANC>('ANC', 6),
      luna: createFormatter<Luna>('Luna', 6),
      bLuna: createFormatter<bLuna>('aLuna', 6),
    };
    switch (chain) {
      case Chain.Terra:
        return {
          ...tokens,
          native: createFormatter<Native>('LUNA', 6),
        };
      case Chain.Ethereum:
        return {
          ...tokens,
          native: createFormatter<Native>('ETH', 18),
        };
      case Chain.Avalanche:
        return {
          ...tokens,
          native: createFormatter<Native>('AVAX', 18),
        };
    }
  }, [chain]);
};

export { useFormatters };
