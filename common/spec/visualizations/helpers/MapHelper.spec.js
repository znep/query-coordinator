import MapHelper from 'common/visualizations/helpers/MapHelper';

describe('MapHelper', () => {
  describe('substituteSoqlParams', () => {
    it('should get the data url without tileParams ', () => {
      const tileUrl = 'https://example.com/resource/r6t9-rak2.geojson?$query=select';

      const result = MapHelper.substituteSoqlParams(tileUrl);

      assert.equal(result.url, 'https://example.com/resource/r6t9-rak2.geojson?$query=select');
    });

    it('should get the data url with tileParams ', () => {
      const tileUrl = 'https://example.com/resource/r6t9-rak2.geojson?$query=' +
      'select count(*),snap_for_zoom(point,{snap_zoom}) ' +
      'where {{\'point\' column condition}} ' +
      'group by snap_for_zoom(point, {snap_zoom}) ' +
      'limit 100000 ' +
      '#substituteSoqlParams_tileParams=10|163|395';

      const result = MapHelper.substituteSoqlParams(tileUrl);

      assert.equal(result.url, 'https://example.com/resource/r6t9-rak2.geojson?$query=' +
        'select count(*),snap_for_zoom(point,10) ' +
        'where intersects(point, \'POLYGON(( -122.6953125 37.71859032558815 ,' +
        '-122.6953125 37.996162679728116 ,' +
        '-122.34375 37.996162679728116 ,' +
        '-122.34375 37.71859032558815 ,' +
        '-122.6953125 37.71859032558815 ))\') ' +
        'group by snap_for_zoom(point, 10) ' +
        'limit 100000 ' +
        '#substituteSoqlParams_tileParams=10|163|395');
    });
  });

  describe('afterMapLoad', () => {
    let mockMap;

    beforeEach(() => {
      mockMap = {
        isStyleLoaded: sinon.stub(),
        on: sinon.stub()
      };
    });

    it('should call callback immediately if style already loaded', () => {
      const callback = sinon.spy();
      mockMap.isStyleLoaded.returns(true);

      MapHelper.afterMapLoad(mockMap, callback);

      sinon.assert.called(callback);
    });

    describe('style not already loaded', () => {
      beforeEach(() => { mockMap.isStyleLoaded.returns(false); });

      it('should defer calling callback', () => {
        const callback = sinon.spy();
        MapHelper.afterMapLoad(mockMap, callback);
        sinon.assert.notCalled(callback);
      });

      it('should call callback once style loaded', () => {
        const callback = sinon.spy();
        mockMap.on.callsFake((event, mapEventCallback) => {
          assert.equal(event, 'load');
          mapEventCallback();
        });

        MapHelper.afterMapLoad(mockMap, callback);

        sinon.assert.called(callback);
      });
    });

  });

});
