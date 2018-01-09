import VifOverlay from 'common/visualizations/views/map/vifOverlays/VifOverlay';
import MapHelper from 'common/visualizations/helpers/MapHelper';
import { mapMockVif } from './../../../mapMockVif';

describe('VifOverlay', () => {
  describe('loadVif', () => {
    let vifOverlay;

    beforeEach(() => {
      vifOverlay = new VifOverlay();
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

        vifOverlay.loadVif(vif);

        sinon.assert.called(vifOverlay.setup);
        sinon.assert.notCalled(vifOverlay.update);
      });
    });


    describe('on first call', () => {
      it('should setup the overlay', () => {
        const vif = mapMockVif();

        vifOverlay.loadVif(vif);
        sinon.assert.notCalled(vifOverlay.update);

        vifOverlay.loadVif(vif);
        sinon.assert.called(vifOverlay.update);
      });
    });

  });

});
