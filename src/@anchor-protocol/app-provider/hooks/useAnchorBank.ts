import {
  AnchorTax,
  AnchorTokenBalances,
  DefaultAnchorTokenBalances,
} from "@anchor-protocol/app-fns";
import {
  ANC,
  AncUstLP,
  aUST,
  aLuna,
  aLunaLunaLP,
  CW20Addr,
  LSD,
  NominalType,
  u,
} from "@anchor-protocol/types";
import {
  useCW20Balance,
  useTerraNativeBalances,
  useUstTax,
} from "@libs/app-provider";
import { useMemo } from "react";
import { useAccount } from "contexts/account";
import { useAnchorWebapp } from "../contexts/context";
import { RegisteredLSDs } from "env";

export interface AnchorBank {
  tax: AnchorTax;
  tokenBalances: AnchorTokenBalances;
}

export function useAnchorBank(): AnchorBank {
  const { contractAddress } = useAnchorWebapp();

  const { terraWalletAddress } = useAccount();

  const { taxRate, maxTax } = useUstTax();

  const { uUST, uLuna } = useTerraNativeBalances(terraWalletAddress);

  const uANC = useCW20Balance<ANC>(
    contractAddress.cw20.ANC,
    terraWalletAddress
  );

  const uAncUstLP = useCW20Balance<AncUstLP>(
    contractAddress.cw20.AncUstLP,
    terraWalletAddress
  );

  const uaUST = useCW20Balance<aUST>(
    contractAddress.cw20.aUST,
    terraWalletAddress
  );

  const uaLuna = useCW20Balance<aLuna>(
    contractAddress.cw20.aLuna,
    terraWalletAddress
  );

  const uaLunaLunaLP = useCW20Balance<aLunaLunaLP>(
    contractAddress.cw20.aLunaLunaLP,
    terraWalletAddress
  );

  let lsdBalances: Record<
    RegisteredLSDs,
    u<LSD<RegisteredLSDs>>
  > = {} as Record<RegisteredLSDs, u<LSD<RegisteredLSDs>>>;
  Object.values(RegisteredLSDs).forEach((lsd: RegisteredLSDs) => {
    lsdBalances[lsd] = useCW20Balance<LSD<typeof lsd>>(
      contractAddress.lsds[lsd]?.info.tokenAddress as CW20Addr,
      terraWalletAddress
    );
  });

  return useMemo(() => {
    return {
      tax: {
        taxRate,
        maxTaxUUSD: maxTax,
      },
      tokenBalances: {
        ...DefaultAnchorTokenBalances,
        uUST,
        uANC,
        uAncUstLP,
        uaUST,
        uaLuna,
        uaLunaLunaLP,
        uLuna,
        uLSDs: lsdBalances,
      },
    };
  }, [
    maxTax,
    taxRate,
    uANC,
    uAncUstLP,
    uLuna,
    uUST,
    uaUST,
    uaLuna,
    uaLunaLunaLP,
    lsdBalances,
  ]);
}
