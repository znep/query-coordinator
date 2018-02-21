import VifHeatOverlay from 'common/visualizations/views/map/vifOverlays/VifHeatOverlay';
import { mapMockVif } from './../../../mapMockVif';

describe('VifHeatOverlay', () => {
  let vifHeatOverlay;
  let mockMap;
  let vif = mapMockVif();

  beforeEach(() => {
    vif = mapMockVif();
    mockMap = {
      setPaintProperty: sinon.spy(),
      style: {}
    };

    vifHeatOverlay = new VifHeatOverlay(mockMap);
    vifHeatOverlay._heatClusters = {
      setup: sinon.spy(),
      update: sinon.spy(),
      destroy: sinon.spy()
    };

  });

  describe('setup', () => {
    it('should add the map source and layer ', () => {
      const expectedRenderOptions = sinon.match({
        dataUrl: sinon.match('select count(*),snap_to_grid(point,{snap_precision})')
      });

      vifHeatOverlay.setup(vif);

      sinon.assert.calledWith(vifHeatOverlay._heatClusters.setup, vif, expectedRenderOptions);
    });
  });

  describe('destroy', () => {
    it('should remove the map layer and source', () => {
      vifHeatOverlay.destroy();

      sinon.assert.called(vifHeatOverlay._heatClusters.destroy);
    });
  });

  describe('update', () => {
    beforeEach(() => { vifHeatOverlay.setup(mapMockVif()); });

    describe('filters changed', () => {
      it('should resetup sources & layers', () => {
        const expectedRenderOptions = sinon.match({
          dataUrl: sinon.match('https://example.com/resource/r6t9-rak2.geojson?$query=select count(*),snap_to_grid(point,{snap_precision}')
        });

        vifHeatOverlay.update(vif);

        sinon.assert.calledWith(vifHeatOverlay._heatClusters.update, vif, expectedRenderOptions);
      });
    });
  });

  describe('getDataUrl', () => {
    it('should return url with substitution params', () => {
      vif.series[0].dataSource.dimension = { columnName: 'the_geom' };

      assert.equal(
        vifHeatOverlay.getDataUrl(vif),
        'https://example.com/resource/r6t9-rak2.geojson?$query=' +
        'select count(*),snap_to_grid(the_geom,{snap_precision}) ' +
        'where {{\'the_geom\' column condition}} group by snap_to_grid(the_geom, {snap_precision}) ' +
        'limit 100000 #substituteSoqlParams_tileParams={z}|{x}|{y}');
    });
  });
});
