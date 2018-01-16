import VifPointOverlay from 'common/visualizations/views/map/vifOverlays/VifPointOverlay';
import { mapMockVif } from './../../../mapMockVif';

describe('VifPointOverlay', () => {
  let vifPointOverlay;
  let mockMap;
  const vif = mapMockVif();

  beforeEach(() => {
    mockMap = {
      addSource: sinon.spy(),
      addLayer: sinon.spy(),
      setPaintProperty: sinon.spy()
    };
    vifPointOverlay = new VifPointOverlay(mockMap);
  });

  describe('setup', () => {
    it('should add the map source and layer', () => {

      vifPointOverlay.setup(vif);
      sinon.assert.calledWith(mockMap.addSource,
        'pointVectorDataSource',
        sinon.match({
          geojsonTile: true,
          cluster: true
        })
      );
      sinon.assert.calledWith(mockMap.addLayer,
        sinon.match({
          source: 'pointVectorDataSource',
          id: 'cluster-circle'
        }),
      );
      sinon.assert.calledWith(mockMap.addLayer,
        sinon.match({
          source: 'pointVectorDataSource',
          id: 'cluster-count-label'
        }),
      );
      sinon.assert.calledWith(mockMap.addLayer,
        sinon.match({
          source: 'pointVectorDataSource',
          id: 'cluster-single-label'
        }),
      );
    });
  });

  describe('update', () => {
    it('should call the set paint property function', () => {
      const vif = mapMockVif({
        series: [{
          color: { primary: 'red' }
        }]
      });

      vifPointOverlay.update(vif);
      sinon.assert.calledWith(mockMap.setPaintProperty, 'cluster-circle', 'circle-color', 'red');
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
