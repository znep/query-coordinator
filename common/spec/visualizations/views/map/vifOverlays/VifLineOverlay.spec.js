import $ from 'jquery';

import { mapMockVif } from './../../../mapMockVif';

import VifLineOverlay from 'common/visualizations/views/map/vifOverlays/VifLineOverlay';
import { getBaseMapLayerStyles } from 'common/visualizations/views/map/baseMapStyle';
import DataProvider from 'common/visualizations/dataProviders/DataProvider';

describe('VifLineOverlay', () => {
  const visualizationElement = $('<div>', { 'class': 'socrata-visualization' });
  let fakeServer;
  let mockMap;
  let mouseInteractionHandler;
  let vifLineOverlay;


  beforeEach(() => {
    mockMap = {
      addSource: sinon.spy(),
      addLayer: sinon.spy(),
      getSource: sinon.stub().returns({}),
      removeLayer: sinon.spy(),
      removeSource: sinon.spy(),
      setPaintProperty: sinon.spy(),
      style: {}
    };

    mouseInteractionHandler = {
      setupOrUpdate: sinon.spy()
    };

    vifLineOverlay = new VifLineOverlay(mockMap, visualizationElement, mouseInteractionHandler);
    vifLineOverlay._lines = {
      setup: sinon.spy(),
      update: sinon.spy(),
      destroy: sinon.spy()
    };

    vifLineOverlay._legend = {
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

  describe('colorLinesBy and weighLinesByColumn not configured', () => {
    describe('colorLinesBy', () => {
      let vif;
      beforeEach(() => {
        vif = mapMockVif({});
        vif.series[0].mapOptions.colorLinesBy = null;
      });
      describe('setup', () => {
        it('should render lines without colorByCategories column configured', async() => {
          const expectedRenderOptions = sinon.match({
            aggregateAndResizeBy: '__count__',
            countBy: '__count__',
            dataUrl: sinon.match('select simplify_preserve_topology(snap_to_grid(' +
              'point,{snap_precision}),{simplify_precision}),' +
              ' min(:id) as __row_id__,count(*) as __count__'),
            colorBy: '__color_by_category__'
          });

          await vifLineOverlay.setup(vif);
          sinon.assert.calledWith(vifLineOverlay._lines.setup, vif, expectedRenderOptions);
        });
      });

      describe('update', () => {
        it('should render lines without colorByCategories column configured', async() => {
          const expectedRenderOptions = sinon.match({
            aggregateAndResizeBy: '__count__',
            countBy: '__count__',
            dataUrl: sinon.match('query=select simplify_preserve_topology(snap_to_grid(' +
              'point,{snap_precision}),{simplify_precision}),' +
              ' min(:id) as __row_id__,count(*) as __count__'),
            colorBy: '__color_by_category__'
          });

          await vifLineOverlay.update(vif);
          sinon.assert.calledWith(vifLineOverlay._lines.update, vif, expectedRenderOptions);
        });
      });
    });

    describe('weighLinesByColumn', () => {
      let vif;
      beforeEach(() => {
        vif = mapMockVif({});
        vif.series[0].mapOptions.weighLinesBy = null;
      });

      describe('setup', () => {
        it('should render Lines without weighByRange column configured', async() => {
          const expectedRenderOptions = sinon.match({
            aggregateAndResizeBy: '__count__',
            dataUrl: sinon.match('query=select simplify_preserve_topology(snap_to_grid(' +
              'point,{snap_precision}),{simplify_precision}),' +
              ' min(:id) as __row_id__,count(*) as __count__'),
            countBy: '__count__'
          });

          await vifLineOverlay.setup(vif);
          sinon.assert.calledWith(vifLineOverlay._lines.setup, vif, expectedRenderOptions);
        });
      });

      describe('update', () => {
        it('should render Lines without weighByRange column configured', async() => {
          const expectedRenderOptions = sinon.match({
            aggregateAndResizeBy: '__count__',
            dataUrl: sinon.match('query=select simplify_preserve_topology(snap_to_grid(' +
              'point,{snap_precision}),{simplify_precision}),' +
              ' min(:id) as __row_id__,count(*) as __count__'),
            countBy: '__count__'
          });

          await vifLineOverlay.update(vif);
          sinon.assert.calledWith(vifLineOverlay._lines.update, vif, expectedRenderOptions);
        });
      });
    });
  });

  describe('colorLinesBy column configured', () => {
    let vif;
    let expectedBuckets;

    beforeEach(() => {
      vif = mapMockVif({});
      vif.series[0].mapOptions.colorLinesBy = 'agentType';

      const query = /.*example.com\/api\/id\/r6t9-rak2\.json.*/;
      const stubResult = '[{"__color_by_category__": "Place"}, {"__color_by_category__": "City"}]';

      fakeServer.respondWith(query,
        [200, { 'Content-Type': 'application/json' }, stubResult]);
      expectedBuckets = [
        { category: 'Place', id: 'Place', color: '#e41a1c' },
        { category: 'City', id: 'City', color: '#9e425a' },
        { category: 'Other', id: '__$$other$$__', color: '#596a98' }
      ];
    });

    describe('setup', () => {
      it('should setup with colorLinesBy renderOptions', async() => {
        const expectedRenderOptions = sinon.match({
          colorByCategories: sinon.match(['Place', 'City']),
          dataUrl: sinon.match("CASE(agentType||'' in ('Place','City')," +
            "agentType||'',true,'__$$other$$__') as __color_by_category__," +
            'count(*) as __count__ '),
          colorBy: '__color_by_category__'
        });

        await vifLineOverlay.setup(vif);
        sinon.assert.calledWith(
          vifLineOverlay._lines.setup,
          vif,
          expectedRenderOptions
        );
        sinon.assert.calledWith(
          vifLineOverlay._legend.show,
          expectedBuckets,
          'categorical'
        );
      });
    });

    describe('update', () => {
      it('should setup with colorLinesBy renderOptions', async() => {
        const expectedRenderOptions = sinon.match({
          colorByCategories: sinon.match(['Place', 'City']),
          dataUrl: sinon.match("CASE(agentType||'' in ('Place','City')," +
            "agentType||'',true,'__$$other$$__') as __color_by_category__," +
            'count(*) as __count__'),
          colorBy: '__color_by_category__',
          aggregateAndResizeBy: '__count__'
        });

        await vifLineOverlay.update(vif);
        sinon.assert.calledWith(
          vifLineOverlay._lines.update,
          vif,
          expectedRenderOptions
        );
        sinon.assert.calledWith(
          vifLineOverlay._legend.show,
          expectedBuckets,
          'categorical'
        );
      });
    });
  });

  describe('weighBy column configured', () => {
    let vif;
    beforeEach(() => {
      vif = mapMockVif({});
      vif.series[0].mapOptions.weighLinesBy = 'county_district';
      const query = /.*example.com\/api\/id\/r6t9-rak2\.json.*/;

      const stubResult = '[{"__weigh_by__": "Place"}, {"__weigh_by__": "City"}]';

      fakeServer.respondWith(query,
        [200, { 'Content-Type': 'application/json' }, stubResult]);
    });

    describe('setup', () => {
      it('should setup with weighBy renderOptions', async() => {
        const expectedRenderOptions = sinon.match({
          dataUrl: sinon.match('$query=select simplify_preserve_topology(snap_to_grid(' +
            'point,{snap_precision}),{simplify_precision}), min(:id) as __row_id__,' +
            'sum(county_district) as __weigh_by__,count(*) as __count__ ' +
            "where {{'point' column condition}} " +
            'AND county_district is NOT NULL'),
          aggregateAndResizeBy: '__weigh_by__',
          countBy: '__count__'
        });

        await vifLineOverlay.setup(vif);
        sinon.assert.calledWith(vifLineOverlay._lines.setup, vif, expectedRenderOptions);

      });
    });

    describe('update', () => {
      it('should update with weighBy renderOptions', async() => {
        const expectedRenderOptions = sinon.match({
          dataUrl: sinon.match('query=select simplify_preserve_topology(snap_to_grid(' +
            'point,{snap_precision}),{simplify_precision}), min(:id) as __row_id__,' +
            'sum(county_district) as __weigh_by__,count(*) as __count__ ' +
            "where {{'point' column condition}} AND county_district is NOT NULL"),
          aggregateAndResizeBy: '__weigh_by__',
          countBy: '__count__'
        });

        await vifLineOverlay.update(vif);
        sinon.assert.calledWith(vifLineOverlay._lines.update, vif, expectedRenderOptions);
      });
    });
  });

  describe('prepare', () => {
    let vif;
    beforeEach(() => {
      vif = mapMockVif({});
      vif.series[0].mapOptions.weighLinesBy = 'county_district';
    });

    it('should throw error', () => {
      let errorResponse = 'Error preparing line map.';
      fakeServer.respondWith([404, { 'Content-Type': 'application/json' }, errorResponse]);

      vifLineOverlay.setup(vif).then((result) => {}, (error) => {
        expect(error.soqlError).to.eq(errorResponse);
      });
    });
  });

  describe('destroy', () => {
    it('should remove the map layer, source and legend', () => {
      vifLineOverlay.destroy();

      sinon.assert.called(vifLineOverlay._lines.destroy);
      sinon.assert.called(vifLineOverlay._legend.destroy);
    });
  });
});
