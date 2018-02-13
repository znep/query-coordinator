import _ from 'lodash';
import { assert } from 'chai';

import * as vifUtils from 'VifUtils';

describe('VifUtils', () => {
  describe('updateVifWithDefaults', () => {
    let vif;

    it('asserts valid parameters', () => {
      assert.throws(() => { vifUtils.updateVifWithDefaults(); });
      assert.throws(() => { vifUtils.updateVifWithDefaults(null); });
      assert.throws(() => { vifUtils.updateVifWithDefaults('string'); });
      assert.throws(() => { vifUtils.updateVifWithDefaults(42); });
    });

    it('clones vif', () => {
      vif = {};
      assert.notEqual(vifUtils.updateVifWithDefaults(vif), vif, 'objects should not be the same');
    });

    it('adds units', () => {
      vif = { configuration: {}, series: [] };
      const vifWithDefaults = vifUtils.updateVifWithDefaults(vif);
      assert.deepEqual(vifWithDefaults.unit, { one: 'record', other: 'records' });
    });

    it('does not add filters when vif has no series', () => {
      vif = {};
      const vifWithDefaults = vifUtils.updateVifWithDefaults(vif);
      assert.isUndefined(vifWithDefaults.series);
    });

    it('adds filters to each series', () => {
      vif = {
        series: [
          { dataSource: {} },
          { dataSource: {} }
        ]
      };
      const vifWithDefaults = vifUtils.updateVifWithDefaults(vif);
      const expectedSeries = [
        { dataSource: { filters: [] } },
        { dataSource: { filters: [] } }
      ];
      assert.deepEqual(vifWithDefaults.series, expectedSeries);
    });

    it('adds default filter arguments for all filters', () => {
      vif = {
        series: [
          {
            dataSource: {
              filters: [{}, {}]
            }
          }
        ]
      };

      const vifWithDefaults = vifUtils.updateVifWithDefaults(vif);
      const expectedFilters = [{ arguments: null }, { arguments: null }];
      assert.deepEqual(vifWithDefaults.series[0].dataSource.filters, expectedFilters);
    });
  });

  describe('updateVifWithFederatedFromDomain', () => {
    let vif;

    it('asserts valid parameters', () => {
      assert.throws(() => { vifUtils.updateVifWithFederatedFromDomain(); });
      assert.throws(() => { vifUtils.updateVifWithFederatedFromDomain(null); });
      assert.throws(() => { vifUtils.updateVifWithFederatedFromDomain('string'); });
      assert.throws(() => { vifUtils.updateVifWithFederatedFromDomain(42); });
      assert.throws(() => { vifUtils.updateVifWithFederatedFromDomain({}, 1); });
      assert.throws(() => { vifUtils.updateVifWithFederatedFromDomain({}, {}); });
    });

    it('clones vif', () => {
      vif = {};
      assert.notEqual(vifUtils.updateVifWithFederatedFromDomain(vif), vif, 'objects should not be the same');
    });

    it('does nothing if federatedFromDomain is unset', () => {
      vif = {};
      const resultVif = vifUtils.updateVifWithFederatedFromDomain(vif);
      assert.isUndefined(_.get(resultVif, 'origin.federatedFromDomain'));
    });

    it('does nothing if federatedFromDomain is null', () => {
      vif = {};
      const resultVif = vifUtils.updateVifWithFederatedFromDomain(vif, null);
      assert.isUndefined(_.get(resultVif, 'origin.federatedFromDomain'));
    });

    it('does nothing if federatedFromDomain is empty string', () => {
      vif = {};
      const resultVif = vifUtils.updateVifWithFederatedFromDomain(vif, '');
      assert.isUndefined(_.get(resultVif, 'origin.federatedFromDomain'));
    });

    it('adds federatedFromDomain', () => {
      vif = {};
      const resultVif = vifUtils.updateVifWithFederatedFromDomain(vif, 'federated');
      assert.equal(_.get(resultVif, 'origin.federatedFromDomain'), 'federated');
    });
  });

  describe('updateFeatureMapVifWithDefaults', () => {
    let vif;

    it('asserts valid parameters', () => {
      assert.throws(() => { vifUtils.updateFeatureMapVifWithDefaults(); });
      assert.throws(() => { vifUtils.updateFeatureMapVifWithDefaults(null); });
      assert.throws(() => { vifUtils.updateFeatureMapVifWithDefaults('string'); });
      assert.throws(() => { vifUtils.updateFeatureMapVifWithDefaults(42); });
    });

    it('clones vif', () => {
      vif = {};
      assert.notEqual(vifUtils.updateFeatureMapVifWithDefaults(vif), vif, 'objects should not be the same');
    });

    it('sets tileserverHosts from datasource.domain first', () => {
      vif = {
        domain: 'example.org',
        series: [{
          dataSource: {
            domain: 'example.com'
          }
        }]
      };
      const resultVif = vifUtils.updateFeatureMapVifWithDefaults(vif);
      assert.deepEqual(resultVif.configuration.tileserverHosts, ['https://example.com']);
    });

    it('sets tileserverHosts from domain if dataSource.domain does not exist', () => {
      vif = {
        domain: 'example.org',
        series: [{
          dataSource: {}
        }]
      };
      const resultVif = vifUtils.updateFeatureMapVifWithDefaults(vif);
      assert.deepEqual(resultVif.configuration.tileserverHosts, ['https://example.org']);
    });

    it('sets baseLayerUrl', () => {
      vif = {};
      const resultVif = vifUtils.updateFeatureMapVifWithDefaults(vif);
      assert.equal(resultVif.configuration.baseLayerUrl, 'https://a.tiles.mapbox.com/v3/socrata-apps.3ecc65d4/{z}/{x}/{y}.png');
    });

    it('sets baseLayerOpacity', () => {
      vif = {};
      const resultVif = vifUtils.updateFeatureMapVifWithDefaults(vif);
      assert.equal(resultVif.configuration.baseLayerOpacity, 0.8);
    });

    it('sets hover', () => {
      vif = {};
      const resultVif = vifUtils.updateFeatureMapVifWithDefaults(vif);
      assert.isTrue(resultVif.configuration.hover);
    });

    it('sets locateUser', () => {
      vif = {};
      const resultVif = vifUtils.updateFeatureMapVifWithDefaults(vif);
      assert.isTrue(resultVif.configuration.locateUser);
    });

    it('sets panAndZoom', () => {
      vif = {};
      const resultVif = vifUtils.updateFeatureMapVifWithDefaults(vif);
      assert.isTrue(resultVif.configuration.panAndZoom);
    });
  });
});
