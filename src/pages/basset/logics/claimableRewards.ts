import type { u, UST } from '@anchor-protocol/types';
import { aluna } from '@anchor-protocol/types';
import { Dec, Int } from '@terra-money/terra.js';
import big, { Big } from 'big.js';

export function claimableRewards(
  holder: aluna.reward.HolderResponse | undefined,
  state: aluna.reward.StateResponse | undefined,
): u<UST<Big>> {
  return holder && state
    ? (big(
        new Int(
          new Int(holder.balance).mul(
            new Dec(state.global_index).minus(new Dec(holder.index)),
          ),
        )
          .add(new Int(holder.pending_rewards))
          .toString(),
      ) as u<UST<Big>>)
    : (big(0) as u<UST<Big>>);
}
