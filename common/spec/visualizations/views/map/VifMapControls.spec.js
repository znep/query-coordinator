import _ from 'lodash';
import mapboxgl from 'mapbox-gl';

import VifMapControls from 'common/visualizations/views/map/VifMapControls';
import { mapMockVif } from './../../mapMockVif';

describe('VifMapControls', () => {
  let vifMapControls;
  let mockMap;

  beforeEach(() => {
    mockMap = {
      addControl: sinon.spy(),
      removeControl: sinon.spy()
    };
    vifMapControls = new VifMapControls(mockMap);
  });

  it('should show Navigation controls by default', () => {
    vifMapControls.initialize(mapMockVif());

    sinon.assert.calledWith(mockMap.addControl, sinon.match.instanceOf(mapboxgl.NavigationControl));
  });

  describe('geo location', () => {
    it('should show geo locate control if locateUser true', () => {
      const initialVif = mapMockVif({
        configuration: {
          'locateUser': false
        }
      });
      vifMapControls.initialize(initialVif);
      sinon.assert.neverCalledWith(mockMap.addControl, sinon.match.instanceOf(mapboxgl.GeolocateControl));

      const vif = mapMockVif({
        configuration: {
          'locateUser': true
        }
      });

      vifMapControls.update(vif);
      sinon.assert.calledWith(mockMap.addControl, sinon.match.instanceOf(mapboxgl.GeolocateControl));
    });

    it('should hide geo locate control if locateUser false', () => {
      const initialVif = mapMockVif({
        configuration: {
          'locateUser': true
        }
      });
      vifMapControls.initialize(initialVif);
      sinon.assert.calledWith(mockMap.addControl, sinon.match.instanceOf(mapboxgl.GeolocateControl));

      const vif = mapMockVif({
        configuration: {
          'locateUser': false
        }
      });

      vifMapControls.update(vif);
      sinon.assert.calledWith(mockMap.removeControl, sinon.match.instanceOf(mapboxgl.GeolocateControl));
    });
  });

});
