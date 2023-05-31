import { Tokens } from "@anchor-protocol/token-icons";
import { Gas } from "@anchor-protocol/types";
import { AppConstants, AppContractAddress } from "@libs/app-provider";
import { CW20Addr, HumanAddr, NativeDenom } from "@libs/types";
import { RegisteredLSDs } from "env";

export interface AnchorContractAddress extends AppContractAddress {
  aluna: {
    reward: HumanAddr;
    hub: HumanAddr;
    airdropRegistry: HumanAddr;
    validatorsRegistry: HumanAddr;
    custody: HumanAddr;
  };
  crossAnchor: {
    core: HumanAddr;
  };
  moneyMarket: {
    market: HumanAddr;
    overseer: HumanAddr;
    oracle: HumanAddr;
    interestModel: HumanAddr;
    distributionModel: HumanAddr;
  };
  liquidation: {
    liquidationQueueContract: HumanAddr;
  };
  anchorToken: {
    gov: HumanAddr;
    staking: HumanAddr;
    community: HumanAddr;
    distributor: HumanAddr;
    investorLock: HumanAddr;
    teamLock: HumanAddr;
    collector: HumanAddr;
    vesting: HumanAddr;
  };
  terraswap: {
    factory: HumanAddr;
    alunaLunaPair: HumanAddr;
  };
  astroport: {
    generator: HumanAddr;
    astroUstPair: HumanAddr;
    ancUstPair: HumanAddr;
  };
  cw20: {
    aLuna: CW20Addr;
    aUST: CW20Addr;
    ANC: CW20Addr;
    AncUstLP: CW20Addr;
    aLunaLunaLP: CW20Addr;
  };
  native: {
    usd: NativeDenom;
  };
  documents: {
    mainAddress: string;
    tokens: {
      whitepaper: string;
    };
  };
  admin: {
    feeAddress: HumanAddr;
  };
  nameservice: HumanAddr;
  lsds: {
    [key in RegisteredLSDs]: LSDContracts;
  };
}

export interface AnchorConstants extends AppConstants {
  airdropGasWanted: Gas;
  airdropGas: Gas;
  bondGasWanted: Gas;
  astroportGasWanted: Gas;
}

export interface LSDContracts {
  info: {
    cw20?:{
      tokenAddress: string;
      hubAddress: string;
    },
    coin?: {
      denom: string;
    },
    spectrum_lp?:{
      // We need the toke, generator and undelyingToken to get the exchange rate
      token: string;
      generator: string;
      underlyingToken: string;
      // We also need more info for decompounding (optional in the frontend)
      underlyingPair: string;
    },
    amp_lp?:{
      // For getting the exchange rate
      token: string,
      hub: string,
    }
    protocol: string;
    icon: string;
    symbol: Tokens;
    name: string;
    link: string;
    underlyingToken: Tokens;
    underlyingName: Tokens;
  };
  type: string;
  hub: string;
  reward: string;
  token: string;
  custody: string;
}