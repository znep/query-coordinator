import VifPointOverlay from 'common/visualizations/views/map/vifOverlays/VifPointOverlay';
import { mapMockVif } from './../../../mapMockVif';

describe('VifPointOverlay', () => {
  let vifPointOverlay;
  let mockMap;
  const vif = mapMockVif();

  beforeEach(() => {
    mockMap = {
      addSource: sinon.spy(),
      removeSource: sinon.spy(),
      addLayer: sinon.spy(),
      removeLayer: sinon.spy(),
      setPaintProperty: sinon.spy()
    };
    vifPointOverlay = new VifPointOverlay(mockMap);
  });

  describe('setup', () => {
    it('should add the map source and layer', () => {

      vifPointOverlay.setup(vif);

      expect(mockMap.addSource.callCount).to.equal(1);
      expect(mockMap.addLayer.callCount).to.equal(3);
    });
  });

  describe('update', () => {
    it('should call the set paint property function', () => {
      vifPointOverlay.update(vif);

      expect(mockMap.setPaintProperty.callCount).to.equal(1);
    });
  });

  describe('destroy', () => {
    it('should remove the map layer and source', () => {
      vifPointOverlay.destroy();

      expect(mockMap.removeLayer.callCount).to.equal(3);
      expect(mockMap.removeSource.callCount).to.equal(1);
    });
  });

  describe('getDataUrl', () => {
    it('should return url with substitution params', () => {
      assert.equal(
        vifPointOverlay.getDataUrl(vif),
        'https://example.com/resource/r6t9-rak2.geojson?$query=' +
        'select count(*),snap_for_zoom(point,{snap_zoom}) ' +
        'where {{\'point\' column condition}} ' +
        'group by snap_for_zoom(point, {snap_zoom}) ' +
        'limit 100000 ' +
        '#substituteSoqlParams_tileParams={z}|{x}|{y}'
      );
    });
  });

});
