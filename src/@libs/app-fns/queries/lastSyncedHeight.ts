import { QueryClient } from '@libs/query-client';
import { ISODateFormat, Num } from '@libs/types';

// language=graphql
const LAST_SYNCED_HEIGHT_QUERY = `
  query {
    LastSyncedHeight
  }
`;

interface LastSyncedHeight {
  LastSyncedHeight: number;
}

interface LcdBlocksLatest {
  block: {
    data: {
      txs: string[];
    };
    evidence: null; // TODO
    header: {
      app_hash: string;
      chain_id: string;
      consensus_hash: string;
      data_hash: string;
      evidence_hash: string;
      height: Num;
      last_block_id: {
        hash: string;
      };
      last_commit_hash: string;
      last_results_hash: string;
      next_validators_hash: string;
      proposer_address: string;
      time: ISODateFormat;
      validators_hash: string;
      version: {
        app: Num;
        block: Num;
      };
    };
    last_commit: {
      block_id: {
        hash: string;
        parts: {
          hash: string;
          total: Num;
        };
        height: Num;
        round: Num;
      };
      height: Num;
      round: Num;
      signatures: Array<{
        block_id_flag: number;
        signature: string;
        timestamp: ISODateFormat;
        validator_address: string;
      }>;
    };
  };
  block_id: {
    hash: string;
    parts: {
      hash: string;
      total: Num;
    };
  };
}

class BlockHeightFetcher {
  private resolvers = new Set<
    [(blockHeight: number) => void, (error: unknown) => void]
  >();
  private fetched: boolean = false;
  private failedCount: number = 0;

  constructor(private client: QueryClient) {}

  fetchBlockHeight = () => {
    return new Promise<number>((resolve, reject) => {
      this.resolvers.add([resolve, reject]);
      this.fetch();
    });
  };

  private fetch = () => {
    if (this.fetched) {
      return;
    }

    this.fetched = true;

    let fetchLatestBlock;

    if('lcdEndpoint' in this.client){
      fetchLatestBlock = this.client
            .lcdFetcher<LcdBlocksLatest>(
              `${this.client.lcdEndpoint}/blocks/latest`,
              this.client.requestInit,
            )
            .then(({ block }) => {
              return +block.header.height;
            })
    }else if ("hiveEndpoint" in this.client){
      return fetchLatestBlock = this.client
            .hiveFetcher<{}, LastSyncedHeight>(
              LAST_SYNCED_HEIGHT_QUERY,
              {},
              this.client.hiveEndpoint + '?last-synced-height',
            )
            .then(({ LastSyncedHeight }) => LastSyncedHeight);
    }else{
      return fetchLatestBlock = this.client
          .batchFetcher.tendermint.latestBlock()
          .then((response) => console.log(response));
    }


    fetchLatestBlock
      .then((blockHeight) => {
        for (const [resolve] of this.resolvers) {
          resolve(blockHeight);
        }
        this.resolvers.clear();
        this.fetched = false;
        this.failedCount = 0;
      })
      .catch((error) => {
        if (this.failedCount > 4) {
          for (const [, reject] of this.resolvers) {
            reject(error);
          }
          this.resolvers.clear();
          this.fetched = false;
          this.failedCount = 0;
        } else {
          console.error(error);
          setTimeout(() => {
            this.fetched = false;
            this.failedCount += 1;
            this.fetch();
          }, 100);
        }
      });
  };
}

const fetchers: Map<string, BlockHeightFetcher> = new Map<
  string,
  BlockHeightFetcher
>();

export function lastSyncedHeightQuery(client: QueryClient): Promise<number> {
  let endpoint;
  if('lcdEndpoint' in client){
    endpoint = client.lcdEndpoint;
  }else if ("hiveEndpoint" in client){
    endpoint = client.hiveEndpoint;
  }else {
    endpoint = "";
  }


  if (!fetchers.has(endpoint)) {
    fetchers.set(endpoint, new BlockHeightFetcher(client));
  }

  return fetchers.get(endpoint)!.fetchBlockHeight();
}
