import $ from 'jquery';

import DataProvider from 'common/visualizations/dataProviders/DataProvider';
import VifShapeOverlay from 'common/visualizations/views/map/vifOverlays/VifShapeOverlay';
import { mapMockVif } from 'common/spec/visualizations/mapMockVif';

describe('VifShapeOverlay', () => {
  const visualizationElement = $('<div>', { 'class': 'socrata-visualization' });
  let fakeServer;
  let mockMap;
  let mouseInteractionHandler;
  let vifShapeOverlay;

  beforeEach(() => {
    mockMap = {
      addSource: sinon.spy(),
      addLayer: sinon.spy(),
      getSource: sinon.stub().returns({}),
      setPaintProperty: sinon.spy(),
      style: {}
    };
    mouseInteractionHandler = {
      setupOrUpdate: sinon.spy()
    };
    vifShapeOverlay = new VifShapeOverlay(mockMap, visualizationElement, mouseInteractionHandler);
    vifShapeOverlay._shapes = {
      setup: sinon.spy(),
      update: sinon.spy(),
      destroy: sinon.spy()
    };
    vifShapeOverlay._legend = {
      show: sinon.spy(),
      destroy: sinon.spy()
    };

    // Clearing the dataProviders cache. Otherwise it is returning,
    // old faked responses for same queries.
    DataProvider._instanceCache = {};

    fakeServer = sinon.createFakeServer();
    fakeServer.autoRespond = true;
  });

  afterEach(() => {
    fakeServer.restore();
  });

  describe('colorBoundariesBy not configured', () => {
    let query;
    let vif;
    beforeEach(() => {
      vif = mapMockVif({});
      vif.series[0].mapOptions.colorBoundariesBy = null;
      query = '$query=select simplify_preserve_topology(snap_to_grid(point,{snap_precision}),{simplify_precision}),' +
        "min(:id) as __row_id__ where {{'point' column condition}}";
    });

    it('should render shapes without colorByCategories column configured', async() => {
      const expectedRenderOptions = sinon.match({
        colorByCategories: null,
        dataUrl: sinon.match(query),
        colorBy: '__color_by_category__'
      });

      await vifShapeOverlay.setup(vif);
      sinon.assert.calledWith(vifShapeOverlay._shapes.setup, vif, expectedRenderOptions);

    });

    it('should render shapes without colorByCategories column configured', async() => {
      const expectedRenderOptions = sinon.match({
        colorByCategories: null,
        dataUrl: sinon.match(query),
        colorBy: '__color_by_category__'
      });

      await vifShapeOverlay.update(vif);
      sinon.assert.calledWith(vifShapeOverlay._shapes.update, vif, expectedRenderOptions);

    });
  });

  describe('colorBoundariesBy column configured', () => {
    let vif;
    let expectedBuckets;

    beforeEach(() => {
      vif = mapMockVif({});
      vif.series[0].mapOptions.colorBoundariesBy = 'countyType';
      const query = 'https://example.com/api/id/r6t9-rak2.json\?$query=' +
        'SELECT%20countyType%7C%7C\'\'%20as%20__color_by_category__%2Ccount\\(\\*\\)%20as%20__count__%20' +
        'GROUP%20BY%20countyType%20' +
        'ORDER%20BY%20__count__%20desc%20' +
        'LIMIT%205' +
        '&$$read_from_nbe=true' +
        '&$$version=2.1';

      const stubResult = '[{"__color_by_category__": "Street"}, {"__color_by_category__": "County"}]';

      fakeServer.respondWith(query,
        [200, { 'Content-Type': 'application/json' }, stubResult]);
      expectedBuckets = [
        sinon.match({ category: 'Street', color: '#e41a1c' }),
        sinon.match({ category: 'County', color: '#9e425a' }),
        sinon.match({ category: 'Other', color: '#596a98' })
      ];
    });

    describe('setup', () => {
      it('should setup with colorBoundariesBy renderOptions', async() => {
        const expectedRenderOptions = sinon.match({
          colorByCategories: ['Street', 'County'],
          dataUrl: sinon.match("CASE(countyType||'' in ('Street','County'),countyType||'',true,'__$$other$$__') as __color_by_category__"),
          colorBy: '__color_by_category__'
        });

        await vifShapeOverlay.setup(vif);
        sinon.assert.calledWith(
          vifShapeOverlay._shapes.setup,
          vif,
          expectedRenderOptions
        );
        sinon.assert.calledWith(
          vifShapeOverlay._legend.show,
          expectedBuckets,
          'categorical'
        );
      });
    });

    describe('update', () => {
      it('should update with colorBoundariesBy renderOptions', async() => {
        const expectedRenderOptions = sinon.match({
          colorByCategories: ['Street', 'County'],
          dataUrl: sinon.match("CASE(countyType||'' in ('Street','County'),countyType||'',true,'__$$other$$__') as __color_by_category__"),
          colorBy: '__color_by_category__'
        });

        await vifShapeOverlay.update(vif);
        sinon.assert.calledWith(
          vifShapeOverlay._shapes.update,
          vif,
          expectedRenderOptions
        );
        sinon.assert.calledWith(
          vifShapeOverlay._legend.show,
          expectedBuckets,
          'categorical'
        );
      });
    });
  });

  describe('prepare', () => {
    let vif;
    beforeEach(() => {
      vif = mapMockVif({});
      vif.series[0].mapOptions.colorBoundariesBy = 'countyType';
    });

    it('should throw error', () => {
      let errorResponse = 'Error preparing line map.';

      fakeServer.respondWith([404, { 'Content-Type': 'application/json' }, errorResponse]);

      vifShapeOverlay.setup(vif).then((result) => {
      }, (error) => {
        expect(error.soqlError).to.eq(errorResponse);
      });
    });
  });

  describe('destroy', () => {
    it('should remove the map layer, source and legend', () => {
      vifShapeOverlay.destroy();

      sinon.assert.called(vifShapeOverlay._shapes.destroy);
      sinon.assert.called(vifShapeOverlay._legend.destroy);
    });
  });
});
