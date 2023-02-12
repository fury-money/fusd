import { aLuna, Luna, u } from "@anchor-protocol/types";
import { ConnectedWallet } from "@terra-money/wallet-provider";

export interface BurnComponent {
  burnAmount: aLuna;
  getAmount: Luna;

  setBurnAmount: (nextBurnAmount: aLuna) => void;
  setGetAmount: (nextGetAmount: Luna) => void;

  connectedWallet: ConnectedWallet | undefined;

  setMode: (nextMode: "burn" | "swap") => void;
}
