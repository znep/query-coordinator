import VifShapeOverlay from 'common/visualizations/views/map/vifOverlays/VifShapeOverlay';
import { mapMockVif } from './../../../mapMockVif';

describe('VifShapeOverlay', () => {
  let vifShapeOverlay;
  let mockMap;

  beforeEach(() => {
    mockMap = {
      addSource: sinon.spy(),
      removeSource: sinon.spy(),
      addLayer: sinon.spy(),
      removeLayer: sinon.spy(),
      setPaintProperty: sinon.spy()
    };
    vifShapeOverlay = new VifShapeOverlay(mockMap);
  });

  describe('setup', () => {
    it('should set up the Source and Layer', () => {
      const vif = mapMockVif();

      vifShapeOverlay.setup(vif);

      sinon.assert.called(mockMap.addSource);
      sinon.assert.called(mockMap.addLayer);
    });
  });

  describe('update', () => {
    it('should call the set paint property function', () => {
      const vif = mapMockVif({
        series: [
          {
            color: { primary: 'red' }
          }
        ]
      });

      vifShapeOverlay.update(vif);

      sinon.assert.calledWith(mockMap.setPaintProperty, 'shape-line', 'line-color', 'red');
    });
  });

  describe('destroy', () => {
    it('should remove the map layer and source', () => {
      vifShapeOverlay.destroy();

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
        vifShapeOverlay.getDataUrl(vif),
        'https://example.com/resource/r6t9-rak2.geojson?$query=' +
        'select simplify_preserve_topology(snap_to_grid(the_geom,{snap_precision}),{simplify_precision}) ' +
        'where {{\'the_geom\' column condition}} ' +
        'group by simplify_preserve_topology(snap_to_grid(the_geom, {snap_precision}),{simplify_precision}) ' +
        'limit 200000 ' +
        '#substituteSoqlParams_tileParams={z}|{x}|{y}'
      );
    });
  });

});
