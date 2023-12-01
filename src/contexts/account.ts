import { HumanAddr } from "@libs/types";
import { CreateTxOptions } from "@terra-money/feather.js";
import {
  PostResponse,
  WalletResponse,
  WalletStatus,
} from "@terra-money/wallet-kit";
import { createContext, useContext } from "react";
import { Connection, NetworkInfo } from "utils/consts";

interface AccountCommon {
  availablePost: boolean;
  readonly: boolean;
  network: NetworkInfo;
  status: WalletStatus;
  post: (tx: CreateTxOptions) => Promise<PostResponse>;
  connection: Connection | undefined;
  connect: (id?: string | undefined) => void;
  disconnect: () => void;
  availableWallets: {
      id: string;
      isInstalled: boolean | undefined;
      name: string;
      icon: string;
      website?: string | undefined;
  }[]
}

interface AccountConnected extends AccountCommon {
  connected: true;
  nativeWalletAddress: HumanAddr;
  terraWalletAddress: HumanAddr;
}

interface AccountDisconnected extends AccountCommon {
  connected: false;
  nativeWalletAddress: undefined;
  terraWalletAddress: undefined;
}

export type Account = AccountConnected | AccountDisconnected;

export const AccountContext = createContext<Account | undefined>(undefined);

const useAccount = (): Account & Pick<WalletResponse, "post"> => {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error("The AccountContext has not been defined.");
  }
  return {
    ...context,
  };
};

export { useAccount };
