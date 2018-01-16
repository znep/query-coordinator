import VifLineOverlay from 'common/visualizations/views/map/vifOverlays/VifLineOverlay';
import { mapMockVif } from './../../../mapMockVif';

describe('VifLineOverlay', () => {
  let vifLineOverlay;
  let mockMap;

  beforeEach(() => {
    mockMap = {
      addSource: sinon.spy(),
      addLayer: sinon.spy(),
      setPaintProperty: sinon.spy()
    };
    vifLineOverlay = new VifLineOverlay(mockMap);
  });

  describe('setup', () => {
    it('should add the map source and layer', () => {
      const vif = mapMockVif();

      vifLineOverlay.setup(vif);
      sinon.assert.calledWith(mockMap.addSource,
        'lineVectorDataSource',
        sinon.match({
          geojsonTile: true,
          type: 'vector'
        })
      );
      sinon.assert.calledWith(mockMap.addLayer,
        sinon.match({
          id: 'lineLayer',
          source: 'lineVectorDataSource'
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

      vifLineOverlay.update(vif);
      sinon.assert.calledWith(mockMap.setPaintProperty, 'lineLayer', 'line-color', 'red');
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
