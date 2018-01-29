import VifPointOverlay from 'common/visualizations/views/map/vifOverlays/VifPointOverlay';
import { mapMockVif } from 'common/spec/visualizations/mapMockVif';
import { getBaseMapLayerStyles } from 'common/visualizations/views/map/baseMapStyle';

describe('VifPointOverlay', () => {
  let vifPointOverlay;
  let mockMap;
  let fakeServer;

  beforeEach(() => {
    mockMap = {
      addSource: sinon.spy(),
      addLayer: sinon.spy(),
      getSource: sinon.stub().returns({}),
      removeSource: sinon.spy(),
      removeLayer: sinon.spy(),
      setPaintProperty: sinon.spy(),
      style: {}
    };
    vifPointOverlay = new VifPointOverlay(mockMap);
    vifPointOverlay._pointsAndStacks = {
      setup: sinon.spy(),
      update: sinon.spy()
    };
    vifPointOverlay._clusters = {
      setup: sinon.spy(),
      update: sinon.spy()
    };
    vifPointOverlay._legend = {
      show: sinon.spy(),
      destroy: sinon.spy()
    };

    fakeServer = sinon.createFakeServer();
    fakeServer.autoRespond = true;
  });

  afterEach(() => {
    fakeServer.restore();
  });

  describe('colorPointsBy and resizePointsByColumn not configured', () => {
    describe('colorPointsBy', () => {
      let vif;
      beforeEach(() => {
        vif = mapMockVif({});
        vif.series[0].mapOptions.colorPointsBy = null;
      });
      describe('setUp', () => {
        it('should render points and stacks without colorByCategories column configured', () => {
          const expectedRenderOptions = sinon.match({
            colorByCategories: null,
            aggregateAndResizeBy: '__count__',
            dataUrl: sinon.match("select snap_for_zoom(point,{snap_zoom}),count(*) as __count__ where {{'point' column condition}}"),
            colorBy: '__color_by_category__'
          });

          return vifPointOverlay.setup(vif).then(() => {
            sinon.assert.calledWith(vifPointOverlay._pointsAndStacks.setup, vif, expectedRenderOptions);
          });
        });
      });

      describe('update', () => {
        it('should render points and stacks without colorByCategories column configured', () => {
          const expectedRenderOptions = sinon.match({
            colorByCategories: null,
            aggregateAndResizeBy: '__count__',
            dataUrl: sinon.match("select snap_for_zoom(point,{snap_zoom}),count(*) as __count__ where {{'point' column condition}}"),
            colorBy: '__color_by_category__'
          });

          return vifPointOverlay.update(vif).then(() => {
            sinon.assert.calledWith(vifPointOverlay._pointsAndStacks.update, vif, expectedRenderOptions);
          });
        });
      });
    });

    describe('resizePointsByColumn', () => {
      let vif;
      beforeEach(() => {
        vif = mapMockVif({});
        vif.series[0].mapOptions.resizePointsBy = null;
      });

      describe('setup', () => {
        it('should render points and stacks without resizeByRange column configured', () => {
          const expectedRenderOptions = sinon.match({
            aggregateAndResizeBy: '__count__',
            dataUrl: sinon.match("select snap_for_zoom(point,{snap_zoom}),count(*) as __count__ where {{'point' column condition}}"),
            countBy: '__count__'
          });

          return vifPointOverlay.setup(vif).then(() => {
            sinon.assert.calledWith(vifPointOverlay._pointsAndStacks.setup, vif, expectedRenderOptions);
          });
        });
      });

      describe('update', () => {
        it('should render points and stacks without resizeByRange column configured', () => {
          const expectedRenderOptions = sinon.match({
            aggregateAndResizeBy: '__count__',
            dataUrl: sinon.match("select snap_for_zoom(point,{snap_zoom}),count(*) as __count__ where {{'point' column condition}}"),
            countBy: '__count__'
          });

          return vifPointOverlay.update(vif).then(() => {
            sinon.assert.calledWith(vifPointOverlay._pointsAndStacks.update, vif, expectedRenderOptions);
          });
        });
      });
    });
  });

  describe('colorPointsBy column configured', () => {
    let vif;
    let expectedBuckets;

    beforeEach(() => {
      vif = mapMockVif({});
      vif.series[0].mapOptions.colorPointsBy = 'brokerType';

      const query = 'https://example.com/api/id/r6t9-rak2.json\?$query=' +
        'SELECT%20brokerType%20as%20__color_by_category__%2Ccount\\(\\*\\)%20as%20__count__%20' +
        'GROUP%20BY%20brokerType%20' +
        'ORDER%20BY%20__count__%20desc%20' +
        'LIMIT%205' +
        '&$$read_from_nbe=true' +
        '&$$version=2.1';
      const stubResult = '[{"__color_by_category__": "It"}, {"__color_by_category__": "Cat2"}]';

      fakeServer.respondWith(query,
        [200, { 'Content-Type': 'application/json' }, stubResult]);
      expectedBuckets = [
        sinon.match({ category: 'It', color: '#e41a1c' }),
        sinon.match({ category: 'Cat2', color: '#9e425a' }),
        sinon.match({ category: 'Other', color: '#596a98' })
      ];
    });

    describe('setup', () => {
      it('should setup with colorPointsBy renderOptions', () => {
        const expectedRenderOptions = sinon.match({
          colorByCategories: sinon.match(['It', 'Cat2']),
          dataUrl: sinon.match("CASE(brokerType in ('It','Cat2'),brokerType||'',true,'__$$other$$__') as __color_by_category__"),
          colorBy: '__color_by_category__'
        });

        return vifPointOverlay.setup(vif).then(() => {
          sinon.assert.calledWith(
            vifPointOverlay._pointsAndStacks.setup,
            vif,
            expectedRenderOptions
          );
          sinon.assert.calledWith(
            vifPointOverlay._legend.show,
            expectedBuckets,
            'categorical'
          );
        });
      });
    });

    describe('update', () => {
      it('should setup with colorPointsBy renderOptions', () => {
        const expectedRenderOptions = sinon.match({
          colorByCategories: sinon.match(['It', 'Cat2']),
          dataUrl: sinon.match("CASE(brokerType in ('It','Cat2'),brokerType||'',true,'__$$other$$__') as __color_by_category__"),
          colorBy: '__color_by_category__'
        });

        return vifPointOverlay.update(vif).then(() => {
          sinon.assert.calledWith(
            vifPointOverlay._pointsAndStacks.update,
            vif,
            expectedRenderOptions
          );
          sinon.assert.calledWith(
            vifPointOverlay._legend.show,
            expectedBuckets,
            'categorical'
          );
        });
      });
    });
  });

  describe('resizeBy column configured', () => {
    let vif;
    beforeEach(() => {
      vif = mapMockVif({});
      vif.series[0].mapOptions.resizePointsBy = 'supervisor_district';
      const query = 'https://example.com/api/id/r6t9-rak2.json\?$query=' +
        'SELECT%20min\\(supervisor_district\\)%20as%20__resize_by_min__' +
        '%2Cavg\\(supervisor_district\\)%20as%20__resize_by_avg__' +
        '%2Cmax\\(supervisor_district\\)%20as%20__resize_by_max__&' +
        '$$read_from_nbe=true' +
        '&$$version=2.1';

      const stubResult = '[{"__resize_by__": "It"}, {"__resize_by__": "Cat2"}]';

      fakeServer.respondWith(query,
        [200, { 'Content-Type': 'application/json' }, stubResult]);
    });

    describe('setup', () => {
      it('should setup with resizeBy renderOptions', () => {
        const expectedRenderOptions = sinon.match({
          resizeByRange: { avg: 1, max: 1, min: 0 },
          dataUrl: sinon.match('sum(supervisor_district) as __resize_by__,count(*) as __count__ ' +
            "where {{'point' column condition}} " +
            'AND supervisor_district is NOT NULL ' +
            'group by snap_for_zoom(point,{snap_zoom})'),
          aggregateAndResizeBy: '__resize_by__'
        });

        return vifPointOverlay.setup(vif).then(() => {
          sinon.assert.calledWith(vifPointOverlay._pointsAndStacks.setup, vif, expectedRenderOptions);
        });
      });
    });

    describe('update', () => {
      it('should update with resizeBy renderOptions', () => {
        const expectedRenderOptions = sinon.match({
          resizeByRange: { avg: 1, max: 1, min: 0 },
          dataUrl: sinon.match('sum(supervisor_district) as __resize_by__,count(*) as __count__ ' +
            "where {{'point' column condition}} " +
            'AND supervisor_district is NOT NULL ' +
            'group by snap_for_zoom(point,{snap_zoom})'),
          aggregateAndResizeBy: '__resize_by__'
        });

        return vifPointOverlay.update(vif).then(() => {
          sinon.assert.calledWith(vifPointOverlay._pointsAndStacks.update, vif, expectedRenderOptions);
        });
      });
    });
  });

  describe('destroy', () => {
    it('should remove the map layer, source and legend', () => {
      vifPointOverlay.destroy();

      sinon.assert.calledWith(mockMap.removeLayer, 'stack-circle');
      sinon.assert.calledWith(mockMap.removeLayer, 'stack-count-label');
      sinon.assert.calledWith(mockMap.removeLayer, 'point');
      sinon.assert.calledWith(mockMap.removeSource, 'pointVectorDataSource');
      sinon.assert.called(vifPointOverlay._legend.destroy);
    });
  });
});