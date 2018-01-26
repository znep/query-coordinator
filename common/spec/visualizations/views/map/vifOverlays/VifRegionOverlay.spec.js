import $ from 'jquery';

import VifRegionOverlay from 'common/visualizations/views/map/vifOverlays/VifRegionOverlay';
import { mapMockVif } from './../../../mapMockVif';

describe('VifRegionOverlay', () => {
  let vifRegionOverlay;
  let mockMap;
  let element = $('<div>', { 'id': 'unified-map-region', 'class': 'map' });
  let fakeServer;
  const vif = mapMockVif({
    configuration: {
      shapefile: {
        uid : 'snuk-a5kv',
        primaryKey: '_feature_id'
      },
      computedColumnName: '@:computed_column'
    },
    series: [{
      color: {
        'primary': '#eb6900',
        'palette': 'alternate1'
      },
      dataSource:{
        dimension: { columnName: 'the_geom' },
        zoom: 17
      }
    }]
  });

  beforeEach(() => {
    mockMap = {
      getSource: sinon.stub().returns({}),
      removeSource: sinon.spy(),
      removeLayer: sinon.spy(),
      style: {}
    };
    vifRegionOverlay = new VifRegionOverlay(mockMap, element);
    vifRegionOverlay._regions = {
      setup: sinon.spy(),
      update: sinon.spy()
    };
    vifRegionOverlay._legend = {
      show: sinon.spy(),
      destroy: sinon.spy()
    };
    fakeServer = sinon.createFakeServer();
    fakeServer.autoRespond = true;
  });


  afterEach(() => {
    fakeServer.restore();
  });

  describe('setup', () => {
    beforeEach(() => {
      const query = 'https://example.com/api/id/r6t9-rak2.json\\?$query=' +
      'SELECT%20%40%3Acomputed_column%20as%20__shape_id__%2C%20count\\(\\*\\)%20as%20__value__%20' +
      'GROUP%20BY%20%40%3Acomputed_column%20' +
      'LIMIT%2010000' +
      '&$$read_from_nbe=true' +
      '&$$version=2.1';
      const stubSOQLResponse = '[' +
      '{"__shape_id__": "1", "__value__": "6"},' +
      '{"__shape_id__": "2", "__value__": "12"},' +
      '{"__shape_id__": "3", "__value__": "20"},' +
      '{"__shape_id__": "4", "__value__": "25"},' +
      '{"__shape_id__": "5", "__value__": "30"}' +
      ']';
      fakeServer.respondWith(query,
        [200, { 'Content-Type': 'application/json' }, stubSOQLResponse]);
    });

    it('should render the shapes and legend based on given vif', () => {
      vif.series[0].mapOptions.numberOfDataClasses = 4;
      const expectedBuckets = [
        sinon.match({ start: 6, end: 12, color: '#e41a1c' }),
        sinon.match({ start: 12, end: 20, color: '#9e425a' }),
        sinon.match({ start: 20, end: 30, color: '#596a98' })
      ];
      const expectedRenderOptions = sinon.match({
        measures: [
          sinon.match({ shapeId: '1', value: 6 }),
          sinon.match({ shapeId: '2', value: 12 }),
          sinon.match({ shapeId: '3', value: 20 }),
          sinon.match({ shapeId: '4', value: 25 }),
          sinon.match({ shapeId: '5', value: 30 })
        ],
        shapeColorConfigs: [
          sinon.match({ shapeId: '1', color: '#e41a1c' }),
          sinon.match({ shapeId: '2', color: '#9e425a' }),
          sinon.match({ shapeId: '3', color: '#596a98' }),
          sinon.match({ shapeId: '4', color: '#596a98' }),
          sinon.match({ shapeId: '5', color: '#596a98' })
        ],
        buckets: [
          sinon.match({ start: 6, end: 12, color: '#e41a1c' }),
          sinon.match({ start: 12, end: 20, color: '#9e425a' }),
          sinon.match({ start: 20, end: 30, color: '#596a98' })
        ],
        dataUrl: sinon.match('snuk-a5kv'),
        shapePrimaryKey: '_feature_id'
      });

      return vifRegionOverlay.setup(vif).then(() => {
        sinon.assert.calledWith(
          vifRegionOverlay._regions.setup,
          vif,
          expectedRenderOptions);
        sinon.assert.calledWith(
          vifRegionOverlay._legend.show,
          expectedBuckets);
      });
    });
  });

  describe('update', () => {
    beforeEach(() => {
      const query = 'https://example.com/api/id/r6t9-rak2.json\\?$query=' +
      'SELECT%20%40%3Acomputed_column%20as%20__shape_id__%2C%20count\\(\\*\\)%20as%20__value__%20' +
      'GROUP%20BY%20%40%3Acomputed_column%20' +
      'LIMIT%2010000' +
      '&$$read_from_nbe=true' +
      '&$$version=2.1';
      const stubSOQLResponse = '[' +
      '{"__shape_id__": "1", "__value__": "6"},' +
      '{"__shape_id__": "2", "__value__": "12"},' +
      '{"__shape_id__": "3", "__value__": "20"},' +
      '{"__shape_id__": "4", "__value__": "25"},' +
      '{"__shape_id__": "5", "__value__": "30"}' +
      ']';
      fakeServer.respondWith(query,
        [200, { 'Content-Type': 'application/json' }, stubSOQLResponse]);
    });

    it('should update the shapes/legend based on given vif', () => {
      const newVif = mapMockVif({
        configuration: {
          shapefile: {
            uid : 'snuk-a5kv',
            primaryKey: '_feature_id'
          },
          computedColumnName: '@:computed_column'
        },
        series: [{
          color: {
            'primary': '#ffffff',
            'palette': 'alternate2'
          },
          dataSource:{
            dimension: { columnName: 'the_geom' },
            zoom: 17
          }
        }]
      });
      newVif.series[0].mapOptions.numberOfDataClasses = 4;
      const expectedBuckets = [
        sinon.match({ start: 6, end: 12, color: '#66c2a5' }),
        sinon.match({ start: 12, end: 20, color: '#9aaf8d' }),
        sinon.match({ start: 20, end: 30, color: '#cf9c76' })
      ];
      const expectedRenderOptions = sinon.match({
        measures: [
          sinon.match({ shapeId: '1', value: 6 }),
          sinon.match({ shapeId: '2', value: 12 }),
          sinon.match({ shapeId: '3', value: 20 }),
          sinon.match({ shapeId: '4', value: 25 }),
          sinon.match({ shapeId: '5', value: 30 })
        ],
        shapeColorConfigs: [
          sinon.match({ shapeId: '1', color: '#66c2a5' }),
          sinon.match({ shapeId: '2', color: '#9aaf8d' }),
          sinon.match({ shapeId: '3', color: '#cf9c76' }),
          sinon.match({ shapeId: '4', color: '#cf9c76' }),
          sinon.match({ shapeId: '5', color: '#cf9c76' })
        ],
        buckets: [
          sinon.match({ start: 6, end: 12, color: '#66c2a5' }),
          sinon.match({ start: 12, end: 20, color: '#9aaf8d' }),
          sinon.match({ start: 20, end: 30, color: '#cf9c76' })
        ],
        dataUrl: sinon.match('snuk-a5kv'),
        shapePrimaryKey: '_feature_id'
      });

      return vifRegionOverlay.update(newVif).then(() => {
        sinon.assert.calledWith(vifRegionOverlay._regions.update,
          newVif,
          expectedRenderOptions
        );
        sinon.assert.calledWith(vifRegionOverlay._legend.show,
          expectedBuckets
        );
      });
    });
  });

  describe('getDataUrl', () => {
    it('should return url with substitution params', () => {
      const vif = mapMockVif({
        configuration: {
          shapefile: {
            uid : 'snuk-a5kv',
            primaryKey: '_feature_id'
          }
        },
        series: [{
          dataSource:{
            dimension: { columnName: 'the_geom' },
            zoom: 17
          }
        }]
      });
      assert.equal(
        vifRegionOverlay.getDataUrl(vif),
        'https://example.com/resource/snuk-a5kv.geojson?$query=' +
        'select simplify_preserve_topology(snap_to_grid(the_geom, {snap_precision}),' +
        '{simplify_precision}), _feature_id where {{\'the_geom\' column condition}} ' +
        'limit 10000 #substituteSoqlParams_tileParams={z}|{x}|{y}'
        );
    });
  });

  describe('destroy', () => {
    it('should remove the map layer, source and legend', () => {
      vifRegionOverlay.destroy();

      sinon.assert.calledWith(mockMap.removeLayer, 'shape-line');
      sinon.assert.calledWith(mockMap.removeSource, 'polygonVectorDataSource');
      sinon.assert.called(vifRegionOverlay._legend.destroy);
    });
  });

});
