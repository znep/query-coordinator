import $ from 'jquery';

import PopupFactory from 'common/visualizations/views/map/PopupFactory';
import PopupHandler from 'common/visualizations/views/map/handlers/PopupHandler';
import { mapMockVif } from 'common/spec/visualizations/mapMockVif';

import {
  lineFeature,
  pointFeature,
  shapeFeature,
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
        dataTypeName: 'text',
        fieldName: 'created_at',
        name: 'created_at',
        renderTypeName: 'text'
      },
      {
        dataTypeName: 'text',
        fieldName: 'department',
        name: 'department',
        renderTypeName: 'text'
      },
      {
        dataTypeName: 'text',
        fieldName: 'actual_cost',
        name: 'actual_cost',
        renderTypeName: 'line'
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
  let event;
  let fakeServer;
  let mockMap;
  let mockPopup;
  let popupOptions;
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
    event = {
      lngLat: {
        lng : -95.78099999999999,
        lat : 39.014399999999995
      }
    };
    renderOptions = {
      colorByCategories: [],
      countBy: 'count',
      datasetMetadata,
      idBy: '__row_id__'
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
    beforeEach(() => {
      popupOptions = {
        event: event,
        feature: stackFeature,
        renderOptions: renderOptions,
        vif: vif
      };
    });

    it('should set the latLng for the popup', () => {
      popupHandler.showPopup(popupOptions);

      sinon.assert.calledWith(
        mockPopup.setLngLat,
        stackFeature.geometry.coordinates
      );
    });

    it('should add the popup to the map', () => {
      popupHandler.showPopup(popupOptions);

      sinon.assert.calledWith(mockPopup.addTo, mockMap);
    });

    describe('stackFeature. No color by.', () => {
      it('should set the html content for the popup', () => {
        renderOptions.colorByCategories = null;

        popupHandler.showPopup(popupOptions);

        assert.equal(
          $(popupContentElement).html(),
          '<div class="point-map-popup point-popup">' +
          '<div class="popup-title">15489 Things</div>' +
          '</div>'
        );
      });
    });

    describe('stackFeature', () => {
      beforeEach(() => {
        popupOptions.feature = stackFeature;
      });

      it('should set the html content for the popup', () => {
        renderOptions.colorByCategories = [
          'Abandoned Vehicle',
          '__$$other$$__',
          'Street and Sidewalk Cleaning',
          'Graffiti Private Property',
          'Graffiti Public Property',
          'SFHA Requests'
        ];
        popupHandler.showPopup(popupOptions);

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
      const expectedQueryFormat = /.*WHERE\%20intersects\(snap_for_zoom\(point\%2C12\)\%2Csnap_for_zoom\('POINT\%20\(-122.44754076004028\%2037.8044394394888\)'\%2C12\)\).*/;

      beforeEach(() => {
        popupOptions.feature = pointFeature;
      });

      describe('No title/additional columns for flyouts.', () => {
        it('should set not set any html content for the popup', () => {
          vif.series[0].mapOptions.mapFlyoutTitleColumnName = undefined;
          vif.series[0].mapOptions.additionalFlyoutColumns = undefined;
          popupHandler.showPopup(popupOptions);

          assert.equal($(popupContentElement).html(), '');
        });
      });

      describe('flyout title configured.', () => {
        it('should show loading spinner and then on data load show the title', () => {
          vif.series[0].mapOptions.mapFlyoutTitleColumnName = 'category';
          vif.series[0].mapOptions.additionalFlyoutColumns = undefined;

          const popupPromise = popupHandler.showPopup(popupOptions);
          assert.equal(
            $(popupContentElement).html(),
            '<div class="loading-spinner-container"><div class="loading-spinner"></div></div>'
          );

          fakeServer.respondWith(
            expectedQueryFormat,
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

      describe('additional columns configured for flyouts.', () => {
        it('should show loading spinner and then on data load show the additional column', () => {
          vif.series[0].mapOptions.mapFlyoutTitleColumnName = undefined;
          vif.series[0].mapOptions.additionalFlyoutColumns = ['status', 'start_date'];

          const popupPromise = popupHandler.showPopup(popupOptions);
          assert.equal(
            $(popupContentElement).html(),
            '<div class="loading-spinner-container"><div class="loading-spinner"></div></div>'
          );

          fakeServer.respondWith(
            expectedQueryFormat,
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

      describe('flyout title/additional columns configured.', () => {
        it('should show loading spinner and then on data load show the title and additional content', () => {
          vif.series[0].mapOptions.mapFlyoutTitleColumnName = 'category';
          vif.series[0].mapOptions.additionalFlyoutColumns = ['status', 'start_date'];

          const popupPromise = popupHandler.showPopup(popupOptions);
          assert.equal(
            $(popupContentElement).html(),
            '<div class="loading-spinner-container"><div class="loading-spinner"></div></div>'
          );

          fakeServer.respondWith(
            expectedQueryFormat,
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

    describe('lineFeature', () => {
      const stubResult = JSON.stringify([{
        ':id':'row-a6uq.cdkg-n9cm',
        'actual_cost':'857508',
        'department': 'Public Works',
        'created_at': '2009-11-10T21:30:00.000'
      }]);
      const expectedQueryFormat = /.*WHERE%20%3Aid%20%3D%22row-a6uq.cdkg-n9cm%22.*/;

      beforeEach(() => {
        popupOptions.feature = lineFeature;
      });

      describe('No title/additional columns for flyouts.', () => {
        it('should not set any html content for the popup', () => {
          vif.series[0].mapOptions.mapFlyoutTitleColumnName = undefined;
          vif.series[0].mapOptions.additionalFlyoutColumns = undefined;

          const popupPromise = popupHandler.showPopup(popupOptions);
          assert.equal($(popupContentElement).html(), '');

          fakeServer.respondWith(
            expectedQueryFormat,
            [200, { 'Content-Type': 'application/json' }, stubResult]
          );

          return popupPromise.then(() => {
            assert.equal($(popupContentElement).html(), '');
          });
        });
      });

      describe('flyout title configured.', () => {
        it('should show loading spinner and then on data load show the title', () => {
          vif.series[0].mapOptions.mapFlyoutTitleColumnName = 'actual_cost';
          vif.series[0].mapOptions.additionalFlyoutColumns = undefined;

          const popupPromise = popupHandler.showPopup(popupOptions);
          assert.equal(
            $(popupContentElement).html(),
            '<div class="loading-spinner-container"><div class="loading-spinner"></div></div>'
          );

          fakeServer.respondWith(
            expectedQueryFormat,
            [200, { 'Content-Type': 'application/json' }, stubResult]
          );

          return popupPromise.then(() => {
            assert.equal(
              $(popupContentElement).html(),
              '<div class="point-map-popup point-popup"><div class="popup-title">857508</div></div>'
            );
          });
        });
      });

      describe('additional columns configured for flyouts.', () => {
        it('should show loading spinner and then on data load show the additional column', () => {
          vif.series[0].mapOptions.mapFlyoutTitleColumnName = undefined;
          vif.series[0].mapOptions.additionalFlyoutColumns = ['actual_cost'];

          const popupPromise = popupHandler.showPopup(popupOptions);
          assert.equal(
            $(popupContentElement).html(),
            '<div class="loading-spinner-container"><div class="loading-spinner"></div></div>'
          );

          fakeServer.respondWith(
            expectedQueryFormat,
            [200, { 'Content-Type': 'application/json' }, stubResult]
          );
          return popupPromise.then(() => {
            assert.equal(
              $(popupContentElement).html(),
              '<div class="point-map-popup point-popup">' +
              '<div class="additional-column">' +
              '<div class="column-name">actual_cost</div>' +
              '<div class="column-value">857508</div>' +
              '</div>' +
              '</div>'
            );
          });
        });
      });

      describe('flyout title/additional columns configured.', () => {
        it('should show loading spinner and then on data load show the title and additional content', () => {
          vif.series[0].mapOptions.mapFlyoutTitleColumnName = 'actual_cost';
          vif.series[0].mapOptions.additionalFlyoutColumns = ['department', 'created_at'];

          const popupPromise = popupHandler.showPopup(popupOptions);
          assert.equal(
            $(popupContentElement).html(),
            '<div class="loading-spinner-container"><div class="loading-spinner"></div></div>'
          );

          fakeServer.respondWith(
            expectedQueryFormat,
            [200, { 'Content-Type': 'application/json' }, stubResult]
          );
          return popupPromise.then(() => {
            assert.equal(
              $(popupContentElement).html(),
              '<div class="point-map-popup point-popup">' +
              '<div class="popup-title">857508</div>' +
              '<div class="additional-column">' +
              '<div class="column-name">department</div>' +
              '<div class="column-value">Public Works</div></div>' +
              '<div class="additional-column">' +
              '<div class="column-name">created_at</div>' +
              '<div class="column-value">2009-11-10T21:30:00.000</div>' +
              '</div></div>'
              );
          });
        });
      });
    });

    describe('shapeFeature', () => {
      const stubResult = JSON.stringify([{
        ':id':'row-a6uq.cdkg-n9cm',
        'actual_cost':'857508',
        'department': 'Public Works',
        'created_at': '2009-11-10T21:30:00.000'
      }]);
      const expectedQueryFormat = /.*WHERE%20%3Aid%20%3D%22row-a6uq.cdkg-n9cm%22.*/;

      beforeEach(() => {
        popupOptions.feature = shapeFeature;
      });

      describe('No title/additional columns for flyouts.', () => {
        it('should set not set any html content for the popup', () => {
          vif.series[0].mapOptions.mapFlyoutTitleColumnName = undefined;
          vif.series[0].mapOptions.additionalFlyoutColumns = undefined;

          const popupPromise = popupHandler.showPopup(popupOptions);
          assert.equal($(popupContentElement).html(), '');

          fakeServer.respondWith(
            expectedQueryFormat,
            [200, { 'Content-Type': 'application/json' }, stubResult]
          );

          return popupPromise.then(() => {
            assert.equal($(popupContentElement).html(), '');
          });
        });
      });

      describe('flyout title configured.', () => {
        it('should show loading spinner and then on data load show the title', () => {
          vif.series[0].mapOptions.mapFlyoutTitleColumnName = 'actual_cost';
          vif.series[0].mapOptions.additionalFlyoutColumns = undefined;

          const popupPromise = popupHandler.showPopup(popupOptions);
          assert.equal(
            $(popupContentElement).html(),
            '<div class="loading-spinner-container"><div class="loading-spinner"></div></div>'
          );

          fakeServer.respondWith(
            expectedQueryFormat,
            [200, { 'Content-Type': 'application/json' }, stubResult]
          );

          return popupPromise.then(() => {
            assert.equal(
              $(popupContentElement).html(),
              '<div class="point-map-popup point-popup"><div class="popup-title">857508</div></div>'
            );
          });
        });
      });

      describe('additional columns configured for flyouts.', () => {
        it('should show loading spinner and then on data load show the additional column', () => {
          vif.series[0].mapOptions.mapFlyoutTitleColumnName = undefined;
          vif.series[0].mapOptions.additionalFlyoutColumns = ['actual_cost'];

          const popupPromise = popupHandler.showPopup(popupOptions);
          assert.equal(
            $(popupContentElement).html(),
            '<div class="loading-spinner-container"><div class="loading-spinner"></div></div>'
          );

          fakeServer.respondWith(
            expectedQueryFormat,
            [200, { 'Content-Type': 'application/json' }, stubResult]
          );
          return popupPromise.then(() => {
            assert.equal(
              $(popupContentElement).html(),
              '<div class="point-map-popup point-popup">' +
              '<div class="additional-column">' +
              '<div class="column-name">actual_cost</div>' +
              '<div class="column-value">857508</div>' +
              '</div>' +
              '</div>'
            );
          });
        });
      });

      describe('flyout title/additional columns configured.', () => {
        it('should show loading spinner and then on data load show the title and additional content', () => {
          vif.series[0].mapOptions.mapFlyoutTitleColumnName = 'actual_cost';
          vif.series[0].mapOptions.additionalFlyoutColumns = ['department', 'created_at'];

          const popupPromise = popupHandler.showPopup(popupOptions);
          assert.equal(
            $(popupContentElement).html(),
            '<div class="loading-spinner-container"><div class="loading-spinner"></div></div>'
          );

          fakeServer.respondWith(
            expectedQueryFormat,
            [200, { 'Content-Type': 'application/json' }, stubResult]
          );
          return popupPromise.then(() => {
            assert.equal(
              $(popupContentElement).html(),
              '<div class="point-map-popup point-popup">' +
              '<div class="popup-title">857508</div>' +
              '<div class="additional-column">' +
              '<div class="column-name">department</div>' +
              '<div class="column-value">Public Works</div></div>' +
              '<div class="additional-column">' +
              '<div class="column-name">created_at</div>' +
              '<div class="column-value">2009-11-10T21:30:00.000</div>' +
              '</div></div>'
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
