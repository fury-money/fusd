import React, { useMemo } from 'react';
import { UIElementProps } from '@libs/ui';
import {
  ConnectResponse,
  PostResponse,
  useConnectedWallet,
  useWallet,
} from '@terra-money/wallet-kit';
import { AccountContext, Account } from 'contexts/account';
import { WalletStatus as TerraWalletStatus } from '@terra-money/wallet-kit';
import { HumanAddr } from '../../@libs/types';
import { MAINNET, useNetwork } from '@anchor-protocol/app-provider';
import { ConnectType } from 'utils/consts';
import { useChain, useManager } from '@cosmos-kit/react';
import { WalletStatus } from "@cosmos-kit/core";
import { CreateTxOptions } from '@terra-money/feather.js';
import { Any } from '@terra-money/legacy.proto/google/protobuf/any';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { MsgExecuteContractEncodeObject } from '@cosmjs/cosmwasm-stargate';
import { MsgSendEncodeObject } from '@cosmjs/stargate';
import { toUtf8 } from "@cosmjs/encoding";
import { EncodeObject } from "@cosmjs/proto-signing";
import { MsgExecuteContract as TerraMsgExecuteContract, MsgSend as TerraMsgSend } from "@terra-money/feather.js";

function convert_terra_msg_to_cosmos(tx: CreateTxOptions): EncodeObject[] {

  return tx.msgs.map((msg) => {
    if (msg instanceof TerraMsgExecuteContract) {
      const cosmosMsg: MsgExecuteContractEncodeObject = {
        typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
        value: MsgExecuteContract.fromPartial({
          sender: msg.sender,
          contract: msg.contract,
          msg: toUtf8(JSON.stringify(msg.execute_msg)),
          funds: msg.coins.map((coin) => {
            return {
              denom: coin.denom,
              amount: coin.amount.toString()
            }
          })
        }),
      };
      return cosmosMsg
    } else if (msg instanceof TerraMsgSend) {
      const cosmosMsg: MsgSendEncodeObject = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: MsgSend.fromPartial({
          fromAddress: msg.from_address,
          toAddress: msg.to_address,
          amount: msg.amount.map((coin) => {
            return {
              denom: coin.denom,
              amount: coin.amount.toString()
            }
          })
        }),
      };
      return cosmosMsg
    } else {
      throw "Message not implemented for this wallet"
    }
  })
}
function terra_to_cosmos_status(status: TerraWalletStatus): WalletStatus {

  switch (status) {
    case TerraWalletStatus.CONNECTED: return WalletStatus.Connected
    case TerraWalletStatus.NOT_CONNECTED: return WalletStatus.Disconnected
    case TerraWalletStatus.INITIALIZING: return WalletStatus.Connecting
  }
}

const TerraAccountProvider = ({ children }: UIElementProps): React.JSX.Element => {
  const { network } = useNetwork();

  // Wallet-KIT
  const wallet = useWallet();
  const connectedWallet: (ConnectResponse & { id?: string } | undefined) = useConnectedWallet();

  // Cosmos Kit
  const cosmosKitContext = useChain(network.chainName);



  const account = useMemo<Account>((): Account => {

    // This is the Wallet-kit connector
    let connection_wallet: any = {};
    if (connectedWallet) {
      if (connectedWallet.id) {
        // If id is not defined, it's terra station
        connection_wallet = wallet.availableWallets.filter(({ id }) => id == "station-extension")[0];
      } else {
        // Otherwise, it's ok, it's listed
        connection_wallet = wallet.availableWallets.filter(({ id }) => id == connectedWallet.id)[0];
      }
    } else if (cosmosKitContext.address) {
      // This is the cosmoskit connector
      let icon: string;
      if (cosmosKitContext.wallet?.logo) {
        if ((typeof cosmosKitContext.wallet?.logo) == "string") {
          icon = cosmosKitContext.wallet?.logo as string;
        } else {
          icon = (cosmosKitContext.wallet?.logo as { major: string, minor: string }).major
        }
      } else {
        icon = "No Wallet Connected";
      }

      // We create the post function
      const cosmosPost = async function (tx: CreateTxOptions): Promise<PostResponse> {

        // We need to map all the messages to Encode Objects from @cosmkjs
        const cosmosMsgs = convert_terra_msg_to_cosmos(tx);


        console.log(cosmosMsgs)
        console.log(tx.msgs)

        const executeContractMsg: MsgExecuteContractEncodeObject = {
          typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
          value: MsgExecuteContract.fromPartial({
            sender: "terra1ytj0hhw39j88qsx4yapsr6ker83jv3aj354gmj",
            contract: "terra1zqlcp3aty4p4rjv96h6qdascdn953v6crhwedu5vddxjnp349upscluex6",
            msg: toUtf8(`{"deposit_stable":{}}`),
            funds: [],
          }),
        };




        console.log("brodcasting cosmos");
        const response = await cosmosKitContext.signAndBroadcast(cosmosMsgs, undefined, "Transaction executed on Cavern Protocol", "cosmwasm")
        console.log(response)
        return {
          height: response.height,
          raw_log: JSON.stringify(response.events),
          txhash: response.transactionHash,
          code: response.code,
        }
      };

      return {
        connect: cosmosKitContext.connect,
        disconnect: cosmosKitContext.disconnect,
        connected: (cosmosKitContext.status == WalletStatus.Connected) as true,
        nativeWalletAddress: cosmosKitContext.address as HumanAddr,
        network: MAINNET,
        status: cosmosKitContext.status as WalletStatus,
        terraWalletAddress: cosmosKitContext.address as HumanAddr,
        availablePost: cosmosKitContext.status == WalletStatus.Connected,
        post: cosmosPost,
        connection: {
          id: cosmosKitContext.wallet?.name ?? "No Wallet Connected",
          isInstalled: true,
          name: cosmosKitContext.wallet?.prettyName ?? "No Wallet Connected",
          icon,
          website: undefined,
          type: ConnectType.COSMOS_KIT
        },
        availableWallets: wallet.availableWallets // Only the wallet-kit wallets are available here
      }
    }



    return {
      connect: wallet.connect,
      disconnect: wallet.disconnect,
      connected: !!connectedWallet as true, // Cast to "true" to fix discriminated union
      nativeWalletAddress: connectedWallet?.addresses[network.chainID] as HumanAddr,
      network: MAINNET,
      status: terra_to_cosmos_status(wallet.status as TerraWalletStatus),
      terraWalletAddress: connectedWallet?.addresses[network.chainID] as HumanAddr,
      availablePost: !!connectedWallet as true,
      post: wallet.post,
      connection: connectedWallet ? {
        ...connection_wallet,
        type: ConnectType.WALLET_KIT
      } : undefined,
      availableWallets: wallet.availableWallets
    };
  }, [connectedWallet, wallet.connect, wallet.disconnect, wallet.status, wallet.post, wallet.availableWallets, network.chainID, cosmosKitContext]);

  return (
    <AccountContext.Provider value={account}>
      {children}
    </AccountContext.Provider>
  );
};

export { TerraAccountProvider };
