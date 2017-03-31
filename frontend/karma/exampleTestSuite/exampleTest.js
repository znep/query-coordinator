import { FeatureFlags } from 'common/feature_flags';

describe('the sample application', () => {
  it('has a working test suite example', () => {
    assert.isTrue(FeatureFlags.value('enable_turboencabulator'));
  });
});
