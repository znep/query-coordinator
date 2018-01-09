import VifMapInteractionHandler from 'common/visualizations/views/map/VifMapInteractionHandler';
import { mapMockVif } from './../../mapMockVif';

describe('VifMapInteractionHandler', () => {
  let vifMapInteractionHandler;
  let mockMap;

  beforeEach(() => {
    mockMap = {
      scrollZoom: { enable: sinon.spy(), disable: sinon.spy() },
      doubleClickZoom: { enable: sinon.spy(), disable: sinon.spy() },
      boxZoom: { enable: sinon.spy(), disable: sinon.spy() },
      touchZoomRotate: { enable: sinon.spy(), disable: sinon.spy() }
    };
    vifMapInteractionHandler = new VifMapInteractionHandler(mockMap);
  });

  describe('initialize', () => {
    describe('when vif.configuration.panAndZoom true', () => {
      it('should enable the map pan and zoom options ', () => {
        vifMapInteractionHandler.initialize(mapMockVif());

        sinon.assert.called(mockMap.scrollZoom.enable);
        sinon.assert.called(mockMap.doubleClickZoom.enable);
        sinon.assert.called(mockMap.boxZoom.enable);
        sinon.assert.called(mockMap.touchZoomRotate.enable);
      });
    });

    describe('when vif.configuration.panAndZoom false', () => {
      it('should disable the map pan and zoom options ', () => {
        const vif = mapMockVif({
          configuration: {
            'panAndZoom': false
          }
        });

        vifMapInteractionHandler.initialize(vif);

        sinon.assert.called(mockMap.scrollZoom.disable);
        sinon.assert.called(mockMap.doubleClickZoom.disable);
        sinon.assert.called(mockMap.boxZoom.disable);
        sinon.assert.called(mockMap.touchZoomRotate.disable);
      });
    });
  });

  describe('update', () => {
    describe('when vif.configuration.panAndZoom true', () => {
      it('should enable the map pan and zoom options ', () => {
        vifMapInteractionHandler.update(mapMockVif());

        sinon.assert.called(mockMap.scrollZoom.enable);
        sinon.assert.called(mockMap.doubleClickZoom.enable);
        sinon.assert.called(mockMap.boxZoom.enable);
        sinon.assert.called(mockMap.touchZoomRotate.enable);
      });
    });

    describe('when vif.configuration.panAndZoom false', () => {
      it('should disable the map pan and zoom options ', () => {
        const vif = mapMockVif({
          configuration: {
            'panAndZoom': false
          }
        });

        vifMapInteractionHandler.update(vif);

        sinon.assert.called(mockMap.scrollZoom.disable);
        sinon.assert.called(mockMap.doubleClickZoom.disable);
        sinon.assert.called(mockMap.boxZoom.disable);
        sinon.assert.called(mockMap.touchZoomRotate.disable);
      });
    });
  });

  describe('getMapInitOptions', () => {
    it('should enable map options ', () => {
      const vif = mapMockVif();

      assert.deepEqual(
        VifMapInteractionHandler.getMapInitOptions(vif),
        {
          scrollZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          touchZoomRotate: true
        }
      );
    });

    it('should disable map options ', () => {
      const vif = mapMockVif({
        configuration: {
          'panAndZoom': false
        }
      });

      assert.deepEqual(
        VifMapInteractionHandler.getMapInitOptions(vif),
        {
          scrollZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
          touchZoomRotate: false
        }
      );
    });
  });
});
