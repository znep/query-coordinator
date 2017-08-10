import { assert } from 'chai';
import { Header } from 'components/header';
import { FeatureFlags } from 'common/feature_flags';

describe('components/Header', () => {

  before(function() {
    FeatureFlags.useTestFixture();
  });

  it('does not render My Assets unless feature flag is set', () => {
    FeatureFlags.updateTestFixture({ enable_internal_asset_manager_my_assets: false });
    const element = renderComponentWithPropsAndStore(Header);
    assert.isNotNull(element);
    assert.equal(element.querySelectorAll('.all-assets').length, 1);
    assert.equal(element.querySelectorAll('.my-assets').length, 0);
  });

  it('does render My Assets when feature flag is set', () => {
    FeatureFlags.updateTestFixture({ enable_internal_asset_manager_my_assets: true });
    const element = renderComponentWithPropsAndStore(Header);
    assert.isNotNull(element);
    assert.equal(element.querySelectorAll('.all-assets').length, 1);
    assert.equal(element.querySelectorAll('.my-assets').length, 1);
  });

});
