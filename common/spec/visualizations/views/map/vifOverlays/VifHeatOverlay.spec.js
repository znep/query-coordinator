import VifHeatOverlay from 'common/visualizations/views/map/vifOverlays/VifHeatOverlay';
import { mapMockVif } from './../../../mapMockVif';

describe('VifHeatOverlay', () => {
  let vifHeatOverlay;
  let mockMap;

  beforeEach(() => {
    mockMap = {
      addLayer: sinon.spy(),
      addSource: sinon.spy(),
      getSource: sinon.stub().returns({}),
      moveLayer: sinon.spy(),
      removeSource: sinon.spy(),
      removeLayer: sinon.spy(),
      setPaintProperty: sinon.spy(),
      style: {}
    };
    vifHeatOverlay = new VifHeatOverlay(mockMap);
  });

  describe('setup', () => {
    it('should add the map source and layer ', () => {
      const vif = mapMockVif();

      vifHeatOverlay.setup(vif);

      sinon.assert.calledWith(mockMap.addSource,
        'heatVectorDataSource',
        sinon.match({ geojsonTile: true })
      );

      sinon.assert.calledWith(mockMap.addLayer,
        sinon.match({
          id: 'heatLayer',
          paint: sinon.match({
            'heatmap-weight': sinon.match({
              'property': 'count'
            })
          })
        }),
        'admin_country'
      );
    });
  });

  describe('destroy', () => {
    it('should remove the map layer and source', () => {
      vifHeatOverlay.destroy();

      sinon.assert.calledWith(mockMap.removeLayer, 'heatLayer');
      sinon.assert.calledWith(mockMap.removeSource, 'heatVectorDataSource');
    });
  });

  describe('update', () => {
    beforeEach(() => { vifHeatOverlay.setup(mapMockVif()); });

    describe('filters changed', () => {
      it('should resetup sources & layers', () => {
        const vif = mapMockVif();
        vif.series[0].dataSource.filters = [
          {
            function: 'binaryOperator',
            columnName: 'status',
            arguments: [{ operator: '=', operand: 'Open' }],
            joinOn: 'OR'
          }
        ];

        vifHeatOverlay.update(vif);

        sinon.assert.calledWith(mockMap.removeSource, 'heatVectorDataSource');
        sinon.assert.calledWith(mockMap.removeLayer, 'heatLayer');
        sinon.assert.calledWith(mockMap.addSource, 'heatVectorDataSource', sinon.match({}));
        sinon.assert.calledWith(mockMap.addLayer, sinon.match({ id: 'heatLayer' }));
      });
    });
  });

  describe('getDataUrl', () => {
    it('should return url with substitution params', () => {
      const vif = mapMockVif({
        series: [{
          dataSource: {
            dimension: { columnName: 'the_geom' },
            zoom: 17
          }
        }]
      });
      assert.equal(
        vifHeatOverlay.getDataUrl(vif),
        'https://example.com/resource/r6t9-rak2.geojson?$query=' +
        'select count(*),snap_to_grid(the_geom,{snap_precision}) ' +
        'where {{\'the_geom\' column condition}} group by snap_to_grid(the_geom, {snap_precision}) ' +
        'limit 100000 #substituteSoqlParams_tileParams={z}|{x}|{y}');
    });
  });
});