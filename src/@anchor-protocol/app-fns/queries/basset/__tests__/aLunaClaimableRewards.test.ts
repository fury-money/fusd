import {
  TEST_ADDRESSES,
  TEST_WALLET_ADDRESS,
} from '@anchor-protocol/app-fns/test-env';
import { TEST_LCD_CLIENT } from '@libs/app-fns/test-env';
import { aLunaClaimableRewardsQuery } from '../aLunaClaimableRewards';

describe('queries/claimableRewards', () => {
  test('should get result from query', async () => {
    const result = await aLunaClaimableRewardsQuery(
      TEST_WALLET_ADDRESS,
      TEST_ADDRESSES.aluna.reward,
      TEST_LCD_CLIENT,
    );

    expect(result?.rewardState).not.toBeUndefined();
    expect(result?.claimableReward).not.toBeUndefined();
  });
});
