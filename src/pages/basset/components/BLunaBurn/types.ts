import { bLuna, Luna, u } from '@anchor-protocol/types';
import { ConnectedWallet } from '@terra-money/wallet-provider';

export interface BurnComponent {
  burnAmount: bLuna;
  getAmount: Luna;

  setBurnAmount: (nextBurnAmount: bLuna) => void;
  setGetAmount: (nextGetAmount: Luna) => void;

  connectedWallet: ConnectedWallet | undefined;
  fixedFee: u<Luna>;

  setMode: (nextMode: 'burn' | 'swap') => void;
}
