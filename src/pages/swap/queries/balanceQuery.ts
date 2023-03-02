import { useAnchorWebapp } from "@anchor-protocol/app-provider";
import { useCW20Balance, useNativeBalanceQuery } from "@libs/app-provider";
import { CW20Addr } from "@libs/types";
import { useAccount } from "contexts/account";

export function useBalance(contract_addr: string | undefined){

  const { terraWalletAddress } = useAccount();

  const cw20Balance = useCW20Balance(
    contract_addr?.includes("terra") ? contract_addr as CW20Addr : undefined,
    terraWalletAddress,
  )

  const nativeBalance = useNativeBalanceQuery(
    !contract_addr?.includes("terra") ? contract_addr : undefined,
  )

  if(!cw20Balance || cw20Balance == "0"){
    return nativeBalance.data?.amount ?? "0";
  }else{
    return cw20Balance;
  }
}