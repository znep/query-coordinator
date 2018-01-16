import VifOverlay from 'common/visualizations/views/map/vifOverlays/VifOverlay';
import MapHelper from 'common/visualizations/helpers/MapHelper';
import { mapMockVif } from './../../../mapMockVif';

describe('VifOverlay', () => {
  let mockMap;
  let vifOverlay;
  let sourceIds = ['lineVectorDataSource'];
  let layerIds = ['lineLayer'];

  beforeEach(() => {
    mockMap = {
      style: {},
      getSource: sinon.stub(),
      removeLayer: sinon.spy(),
      removeSource: sinon.spy()
    };
    vifOverlay = new VifOverlay(mockMap, sourceIds, layerIds);
  });

  describe('loadVif', () => {

    beforeEach(() => {
      vifOverlay.setup = sinon.spy();
      vifOverlay.update = sinon.spy();

      sinon.stub(MapHelper, 'afterMapLoad').
        callsFake((_, callback) => {
          return callback();
        });
    });

    afterEach(() => {
      MapHelper.afterMapLoad.restore();
    });

    describe('on first call', () => {
      it('should setup the overlay', () => {
        const vif = mapMockVif();
        mockMap.getSource.returns(false);

        vifOverlay.loadVif(vif);
        sinon.assert.calledWith(vifOverlay.setup, vif);
      });
    });

    describe('on second call', () => {
      it('should update the overlay', () => {
        const vif = mapMockVif();
        mockMap.getSource.returns(true);

        vifOverlay.loadVif(vif);
        sinon.assert.calledWith(vifOverlay.update, vif);
      });
    });

  });

  describe('destroy', () => {

    describe('layer and source ', () => {
      it('should remove the map layer and source if already loaded', () => {
        mockMap.getSource.returns(true);

        vifOverlay.destroy();

        sinon.assert.calledWith(mockMap.removeLayer, 'lineLayer');
        sinon.assert.calledWith(mockMap.removeSource, 'lineVectorDataSource');
      });

      it('should not remove the map layer and source if not loaded', () => {
        mockMap.getSource.returns(false);

        vifOverlay.destroy();

        sinon.assert.neverCalledWith(mockMap.removeLayer, 'lineLayer');
        sinon.assert.neverCalledWith(mockMap.removeSource, 'lineVectorDataSource');
      });
    });
  });

});
