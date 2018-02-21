import MouseInteractionHandler from 'common/visualizations/views/map/handlers/MouseInteractionHandler';
import PopupHandler from 'common/visualizations/views/map/handlers/PopupHandler';
import { mapMockVif } from 'common/spec/visualizations/mapMockVif';

import {
  clusterFeature,
  lineFeature,
  pointFeature,
  shapeFeature,
  stackFeature
} from './mockGeojsonFeatures';

describe('MouseInteractionHandler', () => {
  let event;
  let handlers;
  let mapCanvas;
  let mockMap;
  let mouseInteractionHandler;
  let popupHandler;
  let renderOptions;
  let vif;

  const simulateMouseEvent = (eventName, event = {}) => {
    handlers[eventName](event);
  };

  beforeEach(() => {
    handlers = {};
    event = {
      lngLat: [10, 0],
      point: {
        x: 506.735595703125,
        y: 459.0096130371094
      }
    };
    mapCanvas = { style: {} };
    mockMap = {
      easeTo: sinon.spy(),
      getCanvas: sinon.stub().returns(mapCanvas),
      getLayer: sinon.stub().returns({}),
      getZoom: sinon.stub(),
      on: (event, handler) => { handlers[event] = handler; },
      queryRenderedFeatures: sinon.stub()
    };
    popupHandler = {
      showPopup: sinon.spy(),
      removePopup: sinon.spy()
    };
    renderOptions = {};
    vif = mapMockVif();

    mouseInteractionHandler = new MouseInteractionHandler(mockMap, popupHandler);
  });

  describe('mouseover', () => {
    beforeEach(() => {
      mockMap.queryRenderedFeatures.returns([]);

      mouseInteractionHandler.setupOrUpdate(vif, renderOptions);
      simulateMouseEvent('mousemove');
    });

    it('should change the mouse cursor to pointer', () => {
      assert.equal(mapCanvas.style.cursor, '');
    });

    it('should hide any existing popups', () => {
      sinon.assert.called(popupHandler.removePopup);
    });
  });

  describe('cluster mouseOver', () => {
    beforeEach(() => {
      mockMap.queryRenderedFeatures.returns([clusterFeature]);

      mouseInteractionHandler.setupOrUpdate(vif, renderOptions);
      simulateMouseEvent('mousemove');
    });

    it('should change the mouse cursor to pointer', () => {
      assert.equal(mapCanvas.style.cursor, 'pointer');
    });

    it('should hide any existing popups', () => {
      sinon.assert.called(popupHandler.removePopup);
    });
  });

  describe('cluster click', () => {
    beforeEach(() => {
      mockMap.queryRenderedFeatures.returns([clusterFeature]);
      mockMap.getZoom.returns(12);

      mouseInteractionHandler.setupOrUpdate(vif, renderOptions);
      simulateMouseEvent('click', event);
    });

    it('should change the mouse cursor to pointer', () => {
      sinon.assert.calledWith(mockMap.easeTo, { center: event.lngLat, zoom: 14 });
    });
  });

  describe('line mouseover', () => {
    beforeEach(() => {
      mockMap.queryRenderedFeatures.returns([lineFeature]);

      mouseInteractionHandler.setupOrUpdate(vif, renderOptions);
      simulateMouseEvent('mousemove', event);
    });

    it('should change the mouse cursor to auto', () => {
      assert.equal(mapCanvas.style.cursor, 'auto');
    });

    it('should show popup for the line', () => {
      sinon.assert.calledWith(popupHandler.showPopup, {
        event: event,
        feature: lineFeature,
        renderOptions: renderOptions,
        vif: vif
      });
    });
  });

  describe('shape mouseover', () => {
    beforeEach(() => {
      mockMap.queryRenderedFeatures.returns([shapeFeature]);

      mouseInteractionHandler.setupOrUpdate(vif, renderOptions);
      simulateMouseEvent('mousemove', event);
    });

    it('should change the mouse cursor to auto', () => {
      assert.equal(mapCanvas.style.cursor, 'auto');
    });

    it('should show popup for the shape', () => {
      sinon.assert.calledWith(popupHandler.showPopup, {
        event: event,
        feature: shapeFeature,
        renderOptions: renderOptions,
        vif: vif
      });
    });
  });

  describe('points mouseover', () => {
    beforeEach(() => {
      mockMap.queryRenderedFeatures.returns([pointFeature]);

      mouseInteractionHandler.setupOrUpdate(vif, renderOptions);
      simulateMouseEvent('mousemove', event);
    });

    it('should change the mouse cursor to auto', () => {
      assert.equal(mapCanvas.style.cursor, 'auto');
    });

    it('should show popup for the point', () => {
      sinon.assert.calledWith(popupHandler.showPopup, {
        event: event,
        feature: pointFeature,
        renderOptions: renderOptions,
        vif: vif
      });
    });
  });

  beforeEach('points mouseover and no flyout title/columns configured', () => {
    beforeEach(() => {
      vif.series[0].mapOptions.mapFlyoutTitleColumnName = undefined;
      vif.series[0].mapOptions.additionalFlyoutColumns = [];
      mockMap.queryRenderedFeatures.returns([pointFeature]);

      mouseInteractionHandler.setupOrUpdate(vif, renderOptions);
      simulateMouseEvent('mousemove');
    });

    it('should not change the mouse cursor to auto', () => {
      assert.equal(mapCanvas.style.cursor, '');
    });

    it('should not show popup for the point', () => {
      sinon.assert.notCalled(popupHandler.showPopup);
    });
  });

  describe('stacks mouseOver', () => {
    beforeEach(() => {
      mockMap.queryRenderedFeatures.returns([stackFeature]);

      mouseInteractionHandler.setupOrUpdate(vif, renderOptions);
      simulateMouseEvent('mousemove', event);
    });

    it('should change the mouse cursor to auto', () => {
      assert.equal(mapCanvas.style.cursor, 'auto');
    });

    it('should show popup for the stack', () => {
      sinon.assert.calledWith(popupHandler.showPopup, {
        event: event,
        feature: stackFeature,
        renderOptions: renderOptions,
        vif: vif
      });
    });
  });
});
