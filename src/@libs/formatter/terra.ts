import { Luna, u, UST } from '@libs/types';

export function stripUUSD(uusd: string): u<UST> {
  const amountMatch = uusd.match(/([0-9]+)ibc/);
  return amountMatch?.[1] as u<UST>;
}

export function stripULuna(uluna: string): u<Luna> {
  return uluna.substring(0, uluna.length - 5) as u<Luna>;
}
