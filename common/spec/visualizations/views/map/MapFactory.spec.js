import $ from 'jquery';
import mapboxgl from 'mapbox-gl';

import MapFactory from 'common/visualizations/views/map/MapFactory';
import GeospaceDataProvider from 'common/visualizations/dataProviders/GeospaceDataProvider';

import { mapMockVif } from './../../mapMockVif';

describe('MapFactory', () => {
  beforeEach(() => {
    mapboxgl.accessToken = 'RANDOM TOKEN';
  });

  describe('build', () => {
    let element = $('<div>', { 'id': 'unified-map-point', 'class': 'map' });
    let mapStub;
    let getFeatureBoundsStub;
    let mapConstructorStub;

    beforeEach(() => {
      mapStub = { fitBounds: sinon.spy() };
      mapConstructorStub = sinon.stub(mapboxgl, 'Map').returns(mapStub);

      getFeatureBoundsStub = sinon.stub(MapFactory, 'getFeatureBounds').
        returns(Promise.resolve(new mapboxgl.LngLatBounds([0, 0], [10, 10])));
    });

    afterEach(() => {
      mapConstructorStub.restore();
      getFeatureBoundsStub.restore();
    });

    it('should render map with the data\'s geometric bounds', (done) => {
      const vif = mapMockVif();

      MapFactory.build(element, vif).then((map) => {
        sinon.assert.calledWith(mapConstructorStub, sinon.match({ center: [5, 5] }));
        sinon.assert.calledWith(mapStub.fitBounds,
          new mapboxgl.LngLatBounds([0, 0], [10, 10]),
          {
            animate: false
          }
        );
        done();
      });
    });

    it('should render map with given center and zoom', (done) => {
      const vif = mapMockVif({
        configuration: {
          mapCenterAndZoom:{
            center: { lat: 47.596, lng: -122.328 },
            zoom: 17
          }
        }
      });

      MapFactory.build(element, vif).then((map) => {
        expect(mapStub.fitBounds.callCount).to.equal(0);
        done();
      });
    });

  });

  describe('getFeatureBounds', () => {
    let extent;
    let geospaceDataProvider;
    const domain = 'example.com';
    const datasetUid = 'r6t9-rak2';

    beforeEach(() => {
      geospaceDataProvider = new GeospaceDataProvider({ domain, datasetUid }, true);

      extent = sinon.stub(geospaceDataProvider, 'getFeatureExtent').
        callsFake((columnName, ignoreInvalidLatLng) => {
          assert.isTrue(ignoreInvalidLatLng);
          assert.isNotNull(columnName);
          return { southwest: [37.707, -122.513], northeast: [37.829, -122.361] };
        });
    });

    afterEach(() => {
      extent.restore();
    });

    it('should call the get feature bounds function', () => {

      MapFactory.getFeatureBounds(mapMockVif()).then((extent) => {

        expect(extent).to.eql(new mapboxgl.LngLatBounds([-122.513, 37.707], [-122.361, 37.829]));
      });
    });
  });
});
