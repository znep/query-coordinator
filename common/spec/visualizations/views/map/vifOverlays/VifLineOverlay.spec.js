import VifLineOverlay from 'common/visualizations/views/map/vifOverlays/VifLineOverlay';
import { mapMockVif } from './../../../mapMockVif';

describe('VifLineOverlay', () => {
  let vifLineOverlay;
  let mockMap;

  beforeEach(() => {
    mockMap = {
      addSource: sinon.spy(),
      removeSource: sinon.spy(),
      addLayer: sinon.spy(),
      removeLayer: sinon.spy(),
      setPaintProperty: sinon.spy()
    };
    vifLineOverlay = new VifLineOverlay(mockMap);
  });

  describe('setup', () => {
    it('should add the map source and layer', () => {
      const vif = mapMockVif();

      vifLineOverlay.setup(vif);

      expect(mockMap.addSource.callCount).to.equal(1);
      expect(mockMap.addLayer.callCount).to.equal(1);
    });
  });

  describe('update', () => {
    it('should call the set paint property function', () => {
      const vif = mapMockVif();

      vifLineOverlay.update(vif);

      expect(mockMap.setPaintProperty.callCount).to.equal(1);
    });
  });

  describe('destroy', () => {
    it('should remove the map layer and source', () => {
      vifLineOverlay.destroy();

      expect(mockMap.removeLayer.callCount).to.equal(1);
      expect(mockMap.removeSource.callCount).to.equal(1);
    });
  });

  describe('getDataUrl', () => {
    it('should return url with substitution params', () => {
      const vif = mapMockVif({
        series: [{
          dataSource:{
            dimension: { columnName: 'the_geom' },
            zoom: 17
          }
        }]
      });

      assert.equal(
        vifLineOverlay.getDataUrl(vif),
        'https://example.com/resource/r6t9-rak2.geojson?$query=' +
        'select simplify_preserve_topology(snap_to_grid(the_geom,{snap_precision}),{simplify_precision}) ' +
        'where {{\'the_geom\' column condition}} ' +
        'group by simplify_preserve_topology(snap_to_grid(the_geom,{snap_precision}),{simplify_precision}) ' +
        'limit 200000 ' +
        '#substituteSoqlParams_tileParams={z}|{x}|{y}'
      );
    });
  });

});
