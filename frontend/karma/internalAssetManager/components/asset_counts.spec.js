import { assert } from 'chai';
import { AssetCounts} from 'components/asset_counts';
import sinon from 'sinon';

describe('components/AssetCounts', () => {
  const assetCountsProps = (options = {}) => ({
    assetCounts: {
      charts: 9,
      datasets: 22,
      maps: 14,
      stories: 13
    },
    fetchingAssetCounts: false,
    fetchingAssetCountsError: false,
    ...options
  });

  it('renders an asset-counts div', () => {
    const element = renderComponentWithStore(AssetCounts, assetCountsProps());
    assert.isNotNull(element);
    assert.equal(element.className, 'asset-counts');
  });

  it('renders an asset-counts-item for each non-zero item', () => {
    const element = renderComponentWithStore(AssetCounts, assetCountsProps({
      assetCounts: {
        charts: 19,
        datasets: 0,
        maps: 2,
        stories: 0
      }
    }));
    assert.lengthOf(element.querySelectorAll('.asset-counts-item'), 2);
  });

  it('uses singular names for 1-count assets, and plural for more-than-1-count assets', () => {
    const element = renderComponentWithStore(AssetCounts, assetCountsProps({
      assetCounts: {
        charts: 3,
        datasets: 1,
        maps: 1,
        stories: 2
      }
    }));
    assert.equal(element.querySelector('.asset-counts-item.charts .item-name').textContent, 'Charts');
    assert.equal(element.querySelector('.asset-counts-item.datasets .item-name').textContent, 'Dataset');
    assert.equal(element.querySelector('.asset-counts-item.maps .item-name').textContent, 'Map');
    assert.equal(element.querySelector('.asset-counts-item.stories .item-name').textContent, 'Stories');
  });

});
