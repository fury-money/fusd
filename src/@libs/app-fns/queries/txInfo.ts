import { QueryClient } from '@libs/query-client';
import { Gas, ISODateFormat, Num } from '@libs/types';
import { TxFailed } from '@terra-money/wallet-provider';
import { CreateTxOptions } from '@terra-money/terra.js';
import { PollingTimeout } from '../errors';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type RawLogAttribute = {
  key: string;
  value: string;
};

export type RawLogEvent = {
  type: string;
  attributes: RawLogAttribute[];
};

export type RawLogMsg = {
  msg_index: number;
  log: string;
  events: RawLogEvent[];
};

interface TxInfoRawData {
  TxInfos: {
    TxHash: string;
    Success: boolean;
    RawLog: string;
  }[];
}

export type TxInfoData = {
  TxHash: string;
  Success: boolean;
  RawLog?: RawLogMsg[] | string;
}[];

export interface TxInfoVariables {
  txhash: string;
}

// language=graphql
const TX_INFO_QUERY = `
  query ($txhash: String!) {
    TxInfos(TxHash: $txhash) {
      TxHash
      Success
      RawLog
    }
  }
`;

interface LcdTxs {
  tx: any; // TODO CreateTxOptions + .toJSON()
  tx_response: {
    txhash: string;
    gas_used: Gas<string>;
    gas_wanted: Gas<string>;
    height: Num;
    logs: RawLogMsg[];
    raw_log: string;
    timestamp: ISODateFormat;
  };
}

interface LcdTxsFail {
  code: number;
  codespace: string;
  gas_used: Gas<string>;
  gas_wanted: Gas<string>;
  height: Num;
  raw_log: string;
  timestamp: ISODateFormat;
  tx: any; // TODO CreateTxOptions + .toJSON()
  txhash: string;
}

export interface TxInfoQueryParams {
  queryClient: QueryClient;
  txhash: string;
}

export async function txInfoQuery({
  queryClient,
  txhash,
}: TxInfoQueryParams): Promise<TxInfoData> {
  const fetchTxInfo: Promise<TxInfoData> =
    'lcdEndpoint' in queryClient
      ? queryClient
          .lcdFetcher<LcdTxs | LcdTxsFail>(
            `${queryClient.lcdEndpoint}/cosmos/tx/v1beta1/txs/${txhash}`,
          )
          .then((result) => {
            if ('tx_response' in result) {
              return [
                {
                  TxHash: result.tx_response.txhash,
                  Success: true,
                  RawLog: result.tx_response.raw_log,
                },
              ];
            } else {
              return [];
            }
          })
          .catch((error) => {
            return [];
          })
      : queryClient
          .hiveFetcher<TxInfoVariables, TxInfoRawData>(
            TX_INFO_QUERY,
            { txhash },
            `${queryClient.hiveEndpoint}?txinfo&txhash=${txhash}`,
          )
          .then(({ TxInfos }) => {
            return TxInfos.map(({ TxHash, Success, RawLog: _RawLog }) => {
              let RawLog: TxInfoData[number]['RawLog'] = _RawLog;

              try {
                RawLog = JSON.parse(_RawLog) ?? _RawLog;
              } catch {}

              return {
                TxHash,
                Success,
                RawLog,
              };
            });
          });

  return fetchTxInfo;
}

// ---------------------------------------------
// poll
// ---------------------------------------------
export class TxInfoFailed extends Error {
  constructor(
    public readonly txhash: string,
    public readonly txInfo: TxInfoData,
    message: string,
  ) {
    super(message);
    this.name = 'TxInfoFailed';
  }
}

export type PollTxInfoParams = TxInfoQueryParams & {
  tx?: CreateTxOptions;
  txhash: string;
};

export async function pollTxInfo({
  queryClient,
  tx,
  txhash,
}: PollTxInfoParams): Promise<TxInfoData> {
  const until = Date.now() + 1000 * 60 * 60;
  const untilInterval = Date.now() + 1000 * 60;

  while (true) {
    const txInfo = await txInfoQuery({
      queryClient,
      txhash,
    });

    if (txInfo.length > 0) {
      const fail = txInfo.find(({ RawLog }) => !RawLog);

      if (fail) {
        console.log('txInfo.ts..pollTxInfo()', fail);
        const message =
          typeof fail.RawLog === 'string'
            ? fail.RawLog
            : Array.isArray(fail.RawLog)
            ? fail.RawLog.map(({ log }) => log).join('\n')
            : `Failed broadcast the "${txhash}"`;

        if (tx) {
          throw new TxFailed(tx, txhash, message, fail.RawLog);
        } else {
          throw new TxInfoFailed(txhash, txInfo, message);
        }
      }

      return txInfo;
    } else if (Date.now() < untilInterval) {
      await sleep(500);
    } else if (Date.now() < until) {
      await sleep(1000 * 10);
    } else {
      throw new PollingTimeout(
        `Transaction queued. To verify the status, please check the transaction hash below.`,
        txhash,
      );
    }
  }
}

// ---------------------------------------------
// utils
// ---------------------------------------------
export function pickRawLog(
  txInfo: TxInfoData,
  index: number,
): RawLogMsg | undefined {
  let rawLog = undefined;
  if (typeof txInfo[0].RawLog === 'string') {
    rawLog = JSON.parse(txInfo[0].RawLog);
  }

  return Array.isArray(rawLog) ? rawLog[index] : undefined;
}

export function pickRawLogs(txInfo: TxInfoData): RawLogMsg[] {
  if (Array.isArray(txInfo[0].RawLog)) {
    return txInfo[0].RawLog;
  }
  return [];
}

export function pickEvent(
  rawLog: RawLogMsg,
  eventType: string,
): RawLogEvent | undefined {
  // There is a change of event type from classi to Terra 2.0
  if (eventType === 'from_contract') {
    eventType = 'wasm';
  }
  return rawLog.events.find((event) => event.type === eventType);
}

export function pickAttributeValue<T extends string>(
  fromContract: RawLogEvent,
  index: number,
): T | undefined {
  const attr = fromContract.attributes[index];
  return attr ? (attr.value as T) : undefined;
}

export function pickAttributeValueByKey<T extends string>(
  fromContract: RawLogEvent,
  key: string,
  pick?: (attrs: RawLogAttribute[]) => RawLogAttribute,
): T | undefined {
  const attrs = fromContract.attributes.filter((attr) => key === attr.key);

  if (attrs.length > 1) {
    return (pick?.(attrs) ?? attrs[0])?.value as T | undefined;
  }
  return attrs[0]?.value as T | undefined;
}
