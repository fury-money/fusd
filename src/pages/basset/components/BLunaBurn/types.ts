import { aLuna, Luna } from "@anchor-protocol/types";
import { Account } from "contexts/account";

export interface BurnComponent {
  burnAmount: aLuna;
  getAmount: Luna;

  setBurnAmount: (nextBurnAmount: aLuna) => void;
  setGetAmount: (nextGetAmount: Luna) => void;

  account: Account | undefined;

  setMode: (nextMode: "burn" | "swap") => void;
}
