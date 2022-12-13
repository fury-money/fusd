import { NominalType } from './common';

export type HumanAddr = string & NominalType<'HumanAddr'>;
export type CanonicalAddr = string & NominalType<'CanonicalAddr'>;
export type CW20Addr = string & NominalType<'CW20Addr'>;
export type LPAddr = string & NominalType<'LPAddr'>;

export type EVMAddr = string & NominalType<'EVMAddr'>;
export type ERC20Addr = string & NominalType<'ERC20Addr'>;

export type CollateralAddr = CW20Addr | ERC20Addr;

export type NativeDenom =
  | 'uusd'
  | 'uust' // some nebula contract uses denom by uust
  | 'uluna'
  | 'uaud'
  | 'ucad'
  | 'uchf'
  | 'ucny'
  | 'udkk'
  | 'ueur'
  | 'ugbp'
  | 'uhkd'
  | 'uidr'
  | 'uinr'
  | 'ujpy'
  | 'ukrw'
  | 'umnt'
  | 'unok'
  | 'uphp'
  | 'usdr'
  | 'usek'
  | 'usgd'
  | 'uthb'
  | 'ukrt'
  | 'ibc/D70F005DE981F6EFFB3AD1DF85601258D1C01B9DEDC1F7C1B95C0993E83CF389'
  | 'ibc/B3504E092456BA618CC28AC671A71FB08C6CA0FD0BE7C8A5B5A3E2DD933CC9E4';
export type bAssetDenom = string & NominalType<'bAssetDenom'>;
export type AssetDenom = string & NominalType<'AssetDenom'>;
export type Denom = NativeDenom | bAssetDenom | AssetDenom;

export type Base64EncodedJson = string & NominalType<'Base64EncodedJson'>;

export type WASMContractResult = {
  Result: string;
};

export namespace rs {
  export type u8 = number;
  export type u16 = number;
  export type u32 = number;
  export type u64 = number;
  export type Uint128 = string;
  export type Decimal = string;
  export type FPDecimal = string;
}

export enum OrderBy {
  Asc = 'asc',
  Desc = 'desc',
}
