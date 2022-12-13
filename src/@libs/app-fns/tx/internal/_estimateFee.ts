import { CreateTxOptions } from '@terra-money/terra.js';
import { TxFee, TxResultRendering, TxStreamPhase } from '../../models/tx';
/*
export function _createTxOptions(tx: CreateTxOptions, address: string, ) {
  return (_: void) => {
  	let fee = tx.fee
    if (fee) {
    	// If the transaction has no fee declared, we should estimate it online

	const gasPrices: any = await fetchGasPrices()

	const lcdClient = await getLCDClient(gasPrices)
	const memo = 'estimate fee'

	const accountInfo = await lcdClient.auth.accountInfo(address)

	const txOptions: CreateTxOptions = {
		msgs: messages,
		gasPrices,
		gasAdjustment: 1.75,
		feeDenoms: [isClassic() ? 'uusd' : 'uluna'],
		memo,
		// Github issue: https://github.com/terra-money/terra.js/pull/295
		// @ts-ignore
		isClassic: isClassic(),
	}

	const fee = await lcdClient.tx.estimateFee(
		[
			{
				sequenceNumber: accountInfo.getSequenceNumber(),
				publicKey: accountInfo.getPublicKey(),
			},
		],
		txOptions
	)

	return fee
}


      const amounts = tx.fee.amount.map((c) => c.amount.toFixed());
      if (amounts.some((n) => n.indexOf('.') > -1)) {
        throw new Error(`tx_fee shouldn't include decimal points`);
      }
    }

    return fee as TxFee;
  };
}
*/