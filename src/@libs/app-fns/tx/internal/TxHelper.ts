import { formatUToken } from "@libs/formatter";
import { Luna, u } from "@libs/types";
import { NetworkInfo } from "utils/consts";
import { CreateTxOptions } from "@terra-money/feather.js";
import { BigSource } from "big.js";
import { TxReceipt, TxResultRendering, TxStreamPhase } from "../../models/tx";
import { getTransactionDetailUrl } from "utils/terrascope";
import { PostResponse } from "@terra-money/wallet-kit";

export class TxHelper {
  private _savedTx: CreateTxOptions | null = null;
  private _savedTxResult: PostResponse | null = null;

  constructor(private $: { txFee: u<Luna>; network: NetworkInfo }) {}

  get savedTx(): CreateTxOptions {
    if (!this._savedTx) {
      throw new Error("Saved Tx not found");
    }
    return this._savedTx;
  }

  saveTx = (tx: CreateTxOptions): void => {
    this._savedTx = tx;
  };

  saveTxResult = (txResult: PostResponse): void => {
    this._savedTxResult = txResult;
  };

  txHashReceipt = (): TxReceipt | null => {
    if (!this._savedTxResult) {
      return null;
    }

    const chainID = this.$.network.name;
    const txhash = this._savedTxResult.txhash;
    const html = `<a href="${getTransactionDetailUrl(
      chainID,
      txhash
    )}" target="_blank" rel="noreferrer">${truncate(txhash)}</a>`;

    return {
      name: "Tx Hash",
      value: {
        html,
      },
    };
  };

  txFeeReceipt = (txFee?: u<Luna<BigSource>>): TxReceipt => {
    return {
      name: "Tx Fee",
      value: formatUToken(txFee ?? this.$.txFee) + " Luna",
    };
  };

  failedToCreateReceipt = (error: Error): TxResultRendering => {
    return {
      value: null,

      phase: TxStreamPhase.SUCCEED,
      receiptErrors: [{ error }],
      receipts: [this.txHashReceipt(), this.txFeeReceipt()],
    } as TxResultRendering;
  };

  failedToFindRawLog = (): TxResultRendering => {
    return this.failedToCreateReceipt(new Error("Undefined RawLog"));
  };

  failedToFindEvents = (...events: string[]): TxResultRendering => {
    return this.failedToCreateReceipt(
      new Error(`Undefined events "${events.join(", ")}"`)
    );
  };

  failedToParseTxResult = (): TxResultRendering => {
    return this.failedToCreateReceipt(new Error("Failed to parse TxResult"));
  };
}

function truncate(text = "", [h, t]: [number, number] = [6, 6]): string {
  const head = text.slice(0, h);
  const tail = text.slice(-1 * t, text.length);
  return text.length > h + t ? [head, tail].join("...") : text;
}
