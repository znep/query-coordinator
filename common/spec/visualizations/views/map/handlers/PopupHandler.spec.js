import $ from 'jquery';

import PopupFactory from 'common/visualizations/views/map/PopupFactory';
import PopupHandler from 'common/visualizations/views/map/handlers/PopupHandler';
import { mapMockVif } from 'common/spec/visualizations/mapMockVif';

import {
  pointFeature,
  stackFeature
} from './mockGeojsonFeatures';

describe('PopupHandler', () => {
  const datasetMetadata = {
    columns: [
      {
        dataTypeName: 'string',
        fieldName: 'category',
        name: 'Category Display Name',
        renderTypeName: 'string'
      },
      {
        dataTypeName: 'string',
        fieldName: 'status',
        name: 'Status',
        renderTypeName: 'string'
      },
      {
        dataTypeName: 'calendar_date',
        fieldName: 'start_date',
        name: 'Start Date',
        renderTypeName: 'calendar_date'
      }
    ]
  };
  let fakeServer;
  let mockMap;
  let mockPopup;
  let popupContentElement;
  let popupHandler;
  let renderOptions;
  let vif;

  beforeEach(() => {
    fakeServer = sinon.createFakeServer();
    mockMap = {
      getZoom: sinon.stub().returns(12)
    };
    mockPopup = {
      addTo: sinon.spy(),
      remove: sinon.spy(),
      setDOMContent: (contentElement) => { popupContentElement = contentElement; },
      setLngLat: sinon.spy()
    };
    popupContentElement = $('<div>');
    renderOptions = {
      colorByCategories: [],
      datasetMetadata,
      countBy: 'count'
    };
    vif = mapMockVif();

    sinon.stub(PopupFactory, 'create').returns(mockPopup);
    popupHandler = new PopupHandler(mockMap);
    fakeServer.autoRespond = true;
  });

  afterEach(() => {
    fakeServer.restore();
    PopupFactory.create.restore();
  });

  describe('showPopup', () => {
    it('should set the latLng for the popup', () => {
      popupHandler.showPopup(stackFeature, vif, renderOptions);

      sinon.assert.calledWith(mockPopup.setLngLat, stackFeature.geometry.coordinates);
    });

    it('should add the popup to the map', () => {
      popupHandler.showPopup(stackFeature, vif, renderOptions);

      sinon.assert.calledWith(mockPopup.addTo, mockMap);
    });

    describe('stackFeature. No color by.', () => {
      it('should set the html content for the popup', () => {
        renderOptions.colorByCategories = null;

        popupHandler.showPopup(stackFeature, vif, renderOptions);

        assert.equal(
          $(popupContentElement).html(),
          '<div class="point-map-popup point-popup">' +
          '<div class="popup-title">15489 Things</div>' +
          '</div>'
        );
      });
    });

    describe('stackFeature', () => {
      it('should set the html content for the popup', () => {
        renderOptions.colorByCategories = [
          'Abandoned Vehicle',
          '__$$other$$__',
          'Street and Sidewalk Cleaning',
          'Graffiti Private Property',
          'Graffiti Public Property',
          'SFHA Requests'
        ];

        popupHandler.showPopup(stackFeature, vif, renderOptions);

        assert.equal(
          $(popupContentElement).html(),
          '<div class="point-map-popup point-popup">' +
          '<div class="popup-title">15489 Things</div>' +
          '<ul class="color-breakdown">' +
          '<li style="color: #e41a1c"><div class="count">2645 Things</div><div class="category">Abandoned Vehicle</div></li>' +
          '<li style="color: #3b87a2"><div class="count">1027 Things</div><div class="category">Graffiti Private Property</div></li>' +
          '<li style="color: #449b75"><div class="count">1424 Things</div><div class="category">Graffiti Public Property</div></li>' +
          '<li style="color: #6b886d"><div class="count">6946 Things</div><div class="category">Other</div></li>' +
          '<li style="color: #4daf4a"><div class="count">338 Things</div><div class="category">SFHA Requests</div></li>' +
          '<li style="color: #596a98"><div class="count">3109 Things</div><div class="category">Street and Sidewalk Cleaning</div></li>' +
          '</ul>' +
          '</div>'
        );
      });
    });

    describe('pointFeature', () => {
      const stubResult = JSON.stringify([{
        category: 'homicide',
        status: 'open',
        start_date: '2009-11-10T21:30:00.000'
      }]);
      const expectedQuery = /.*WHERE\%20intersects\(snap_for_zoom\(point\%2C12\)\%2Csnap_for_zoom\('POINT\%20\(-122.44754076004028\%2037.8044394394888\)'\%2C12\)\).*/;

      describe('pointFeature. No title/additional columns for flyouts.', () => {
        it('should set not set any html content for the popup', () => {
          vif.series[0].mapOptions.mapFlyoutTitleColumnName = undefined;
          vif.series[0].mapOptions.additionalFlyoutColumns = undefined;

          popupHandler.showPopup(pointFeature, vif, renderOptions);

          assert.equal($(popupContentElement).html(), '');
        });
      });

      describe('pointFeature. flyout title configured.', () => {
        it('should show loading spinner and then on data load show the title', () => {
          vif.series[0].mapOptions.mapFlyoutTitleColumnName = 'category';
          vif.series[0].mapOptions.additionalFlyoutColumns = undefined;

          const popupPromise = popupHandler.showPopup(pointFeature, vif, renderOptions);
          assert.equal(
            $(popupContentElement).html(),
            '<div class="loading-spinner-container"><div class="loading-spinner"></div></div>'
          );

          fakeServer.respondWith(
            expectedQuery,
            [200, { 'Content-Type': 'application/json' }, stubResult]
          );

          return popupPromise.then(() => {
            assert.equal(
              $(popupContentElement).html(),
              '<div class="point-map-popup point-popup"><div class="popup-title">homicide</div></div>'
            );
          });
        });
      });

      describe('pointFeature. additional columns configured for flyouts.', () => {
        it('should show loading spinner and then on data load show the additional column', () => {
          vif.series[0].mapOptions.mapFlyoutTitleColumnName = undefined;
          vif.series[0].mapOptions.additionalFlyoutColumns = ['status', 'start_date'];

          const popupPromise = popupHandler.showPopup(pointFeature, vif, renderOptions);
          assert.equal(
            $(popupContentElement).html(),
            '<div class="loading-spinner-container"><div class="loading-spinner"></div></div>'
          );

          fakeServer.respondWith(
            expectedQuery,
            [200, { 'Content-Type': 'application/json' }, stubResult]
          );
          return popupPromise.then(() => {
            assert.equal(
              $(popupContentElement).html(),
              '<div class="point-map-popup point-popup">' +
              '<div class="additional-column">' +
              '<div class="column-name">Status</div>' +
              '<div class="column-value">open</div>' +
              '</div>' +
              '<div class="additional-column">' +
              '<div class="column-name">Start Date</div>' +
              '<div class="column-value">2009 Nov 10 09:30:00 PM</div>' +
              '</div>' +
              '</div>'
            );
          });
        });
      });

      describe('pointFeature. flyout title/additional columns configured.', () => {
        it('should show loading spinner and then on data load show the title and additional content', () => {
          vif.series[0].mapOptions.mapFlyoutTitleColumnName = 'category';
          vif.series[0].mapOptions.additionalFlyoutColumns = ['status', 'start_date'];

          const popupPromise = popupHandler.showPopup(pointFeature, vif, renderOptions);
          assert.equal(
            $(popupContentElement).html(),
            '<div class="loading-spinner-container"><div class="loading-spinner"></div></div>'
          );

          fakeServer.respondWith(
            expectedQuery,
            [200, { 'Content-Type': 'application/json' }, stubResult]
          );
          return popupPromise.then(() => {
            assert.equal(
              $(popupContentElement).html(),
              '<div class="point-map-popup point-popup">' +
              '<div class="popup-title">homicide</div>' +
              '<div class="additional-column">' +
              '<div class="column-name">Status</div>' +
              '<div class="column-value">open</div>' +
              '</div>' +
              '<div class="additional-column">' +
              '<div class="column-name">Start Date</div>' +
              '<div class="column-value">2009 Nov 10 09:30:00 PM</div>' +
              '</div>' +
              '</div>'
            );
          });
        });
      });
    });
  });

  describe('removePopup', () => {
    it('should remove popup', () => {
      popupHandler.removePopup();

      sinon.assert.called(mockPopup.remove);
    });
  });
});
