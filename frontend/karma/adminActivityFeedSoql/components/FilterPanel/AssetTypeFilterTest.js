import { assert } from 'chai';

import testStore from '../../testStore';
import AssetTypeFilter from 'components/FilterPanel/AssetTypeFilter';
import assetTypeOptions from 'components/FilterPanel/assetTypeOptions';

describe('AssetTypeFilter', () => {
  const store = testStore({
    filters: {
      assetTypes: null
    }
  });

  const element = renderComponentWithLocalization(AssetTypeFilter, {}, store);

  it('renders', () => {
    assert.isNotNull(element);
    assert.isOk(element.classList.contains('asset-type'));
  });

  it('renders all options', () => {
    assert.equal(
      element.querySelectorAll('.picklist-option').length,
      assetTypeOptions.length
    );
  });

});
