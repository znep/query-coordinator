import { assert } from 'chai';
import { AssetCounts} from 'common/components/AssetBrowser/components/asset_counts';
import sinon from 'sinon';
import { renderComponentWithPropsAndStore } from 'common/spec/helpers';
import { useTestTranslations } from 'common/i18n';
import sharedTranslations from 'common/i18n/config/locales/en.yml';

describe('components/AssetCounts', () => {
  beforeEach(() => {
    useTestTranslations(sharedTranslations.en);
  });

  const assetCountsProps = (options = {}) => ({
    assetCounts: {
      charts: 9,
      datasets: 22,
      maps: 14,
      stories: 13
    },
    fetchingAssetCounts: false,
    fetchingAssetCountsError: false,
    filters: {
      assetTypes: 'datasets'
    },
    ...options
  });

  it('renders an asset-counts div', () => {
    const element = renderComponentWithPropsAndStore(AssetCounts, assetCountsProps());
    assert.isNotNull(element);
    assert.equal(element.className, 'asset-counts');
  });

  it('renders an asset-counts-item for each non-zero item', () => {
    const element = renderComponentWithPropsAndStore(AssetCounts, assetCountsProps({
      assetCounts: {
        charts: 19,
        datasets: 0,
        maps: 2,
        stories: 0
      }
    }));
    assert.lengthOf(element.querySelectorAll('.asset-counts-item'), 2);
  });

  it('uses singular names for 1-count assets', () => {
    const element = renderComponentWithPropsAndStore(AssetCounts, assetCountsProps({
      assetCounts: {
        charts: 1,
        'datalenses,visualizations': 1,
        datasets: 1,
        filters: 1,
        hrefs: 1,
        maps: 1,
        stories: 1
      }
    }));
    assert.equal(element.querySelector('.asset-counts-item.charts .item-name').textContent, 'Chart');
    assert.equal(element.querySelector('.asset-counts-item.datalensesAndVisualizations .item-name').textContent, 'Data Lens');
    assert.equal(element.querySelector('.asset-counts-item.datasets .item-name').textContent, 'Dataset');
    assert.equal(element.querySelector('.asset-counts-item.hrefs .item-name').textContent, 'External Dataset');
    assert.equal(element.querySelector('.asset-counts-item.filters .item-name').textContent, 'Filtered View');
    assert.equal(element.querySelector('.asset-counts-item.maps .item-name').textContent, 'Map');
    assert.equal(element.querySelector('.asset-counts-item.stories .item-name').textContent, 'Story');
  });

  it('uses plural for more-than-1-count assets', () => {
    const element = renderComponentWithPropsAndStore(AssetCounts, assetCountsProps({
      assetCounts: {
        charts: 3,
        'datalenses,visualizations': 3,
        datasets: 3,
        filters: 3,
        hrefs: 3,
        maps: 3,
        stories: 3
      }
    }));
    assert.equal(element.querySelector('.asset-counts-item.charts .item-name').textContent, 'Charts');
    assert.equal(element.querySelector('.asset-counts-item.datalensesAndVisualizations .item-name').textContent, 'Data Lenses');
    assert.equal(element.querySelector('.asset-counts-item.datasets .item-name').textContent, 'Datasets');
    assert.equal(element.querySelector('.asset-counts-item.hrefs .item-name').textContent, 'External Datasets');
    assert.equal(element.querySelector('.asset-counts-item.filters .item-name').textContent, 'Filtered Views');
    assert.equal(element.querySelector('.asset-counts-item.maps .item-name').textContent, 'Maps');
    assert.equal(element.querySelector('.asset-counts-item.stories .item-name').textContent, 'Stories');
  });
});
