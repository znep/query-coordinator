(function() {

  'use strict';

  describe('API Explorer', function() {
    var FAKE4x4 = 'fake-data';
    var TEST_DOMAIN = 'config.ru';
    var DOCUMENTATION_URL = 'http://dev.socrata.com/foundry/#/{0}/{1}'.format(
      TEST_DOMAIN, FAKE4x4);
    var JSON_URL = 'https://{0}/resource/{1}.json'.format(TEST_DOMAIN, FAKE4x4);
    var GEOJSON_URL = 'https://{0}/resource/{1}.geojson'.format(TEST_DOMAIN, FAKE4x4);

    var $window;
    var testHelpers;
    var $rootScope;
    var $httpBackend;
    var Model;

    /**
     * Create the <api-explorer> element with the proper wiring and add it to the dom.
     */
    function addValidElement() {
      var model = new Model();
      model.id = FAKE4x4;
      model.defineObservableProperty('domain', TEST_DOMAIN);
      var scope = $rootScope.$new();
      scope.myTestObservable = Rx.Observable.returnValue(model);
      var element = testHelpers.TestDom.compileAndAppend(
        '<api-explorer class="cards-metadata" dataset-observable="myTestObservable"></api-explorer>',
        scope);
      $httpBackend.flush();
      $rootScope.$digest();
      return element;
    }

    beforeEach(function() {
      module('/angular_templates/dataCards/apiExplorer.html');
      module('/angular_templates/dataCards/selectionLabel.html');
      module('socrataCommon.services');
      module('dataCards.directives');
      module('dataCards.services');
      module('dataCards.models');
      module('dataCards');
      module('test');
      module('dataCards/cards.sass');
      module('dataCards/action-button.sass');
      module('dataCards/flyout.sass');

      $('body').addClass('state-view-cards');

      inject(['$httpBackend', '$rootScope', '$window', 'testHelpers', 'Model', function(_$httpBackend, _$rootScope, _$window, _testHelpers, _Model) {
        $rootScope = _$rootScope;
        $window = _$window;
        testHelpers = _testHelpers;
        Model = _Model;
        $httpBackend = _$httpBackend;
      }]);
    });

    afterEach(function() {
      testHelpers.TestDom.clear();
    });

    describe('the tag itself', function() {
      it('accepts a datasetObservable attribute', function() {
        var scope = $rootScope.$new();
        var TEST_OBSERVABLE = new Rx.Subject();
        scope.myTestObservable = TEST_OBSERVABLE;
        var element = testHelpers.TestDom.compileAndAppend(
          '<api-explorer class="cards-metadata" dataset-observable="myTestObservable"></api-explorer>', scope);
        expect(element.isolateScope().datasetObservable).to.equal(TEST_OBSERVABLE);
      });
    });

    describe('when more than one dataset format is available', function() {
      describe('with a valid Dataset', function() {
        var element;

        beforeEach(function() {
          $httpBackend.whenGET(new RegExp(
            '/resource/[^.]+\\.geojson\\?\\$limit=1')).respond({geojson: true});
          element = addValidElement();
        });

        describe('its default JSON state', function() {
          it('should populate the documentation URL link', function() {
            expect(element.find('[data-action="documentation"]').attr('href')).
              to.equal(DOCUMENTATION_URL);
          });

          it('should populate the selection label with the JSON API URL', function() {
            expect(element.find('.selection-label-inner').text()).to.equal(JSON_URL);
          });

          it('should show the JSON as selected', function() {
            var selected = element.find('button.active');
            expect(selected.length).to.equal(1);
            expect(selected.is('[title="JSON"]')).to.be.true;
          });

          it('should show geoJSON as an option', function() {
            expect(element.find('[title="GeoJSON"]').length).to.equal(1);
          });
        });

        describe('choosing the GeoJSON format', function() {
          beforeEach(function() {
            element.find('[title="GeoJSON"]').click();
          });

          it('should populate the selection label with the GeoJSON API URL', function() {
            expect(element.find('.selection-label-inner').text()).to.equal(GEOJSON_URL);
          });

          it('should keep the documentation URL link', function() {
            expect(element.find('[data-action="documentation"]').attr('href')).to.equal(
              DOCUMENTATION_URL);
          });

          it('should show the GeoJSON as selected', function() {
            var selected = element.find('button.active');
            expect(selected.length).to.equal(1);
            expect(selected.is('[title="GeoJSON"]')).to.be.true;
          });
        });

        describe('re-choosing the JSON format', function() {
          beforeEach(function() {
            element.find('[title="GeoJSON"]').click();
            element.find('[title="JSON"]').click();
          });

          it('should populate the selection label with the JSON API URL', function() {
            expect(element.find('.selection-label-inner').text()).to.equal(JSON_URL);
          });

          it('should populate the documentation URL link', function() {
            expect(element.find('[data-action="documentation"]').attr('href')).to.equal(
              DOCUMENTATION_URL);
          });

          it('should show the JSON as selected', function() {
            var selected = element.find('button.active');
            expect(selected.length).to.equal(1);
            expect(selected.is('[title="JSON"]')).to.be.true;
          });
        });
      });

      describe('with an invalid Dataset', function() {
        var element;

        beforeEach(function() {
          $httpBackend.whenGET(new RegExp(
            '/resource/[^.]*\\.geojson\\?\\$limit=1')).respond({geojson: true});

          var model = new Model();
          model.id = '';
          model.defineObservableProperty('domain', null);
          var scope = $rootScope.$new();
          scope.myTestObservable = Rx.Observable.returnValue(model);
          element = testHelpers.TestDom.compileAndAppend(
            '<api-explorer class="cards-metadata" dataset-observable="myTestObservable"></api-explorer>', scope);
        });

        it('should populate the documentation URL link', function() {
          expect(element.find('[data-action="documentation"]').attr('href')).
            to.equal('#');
        });

        it('should populate the selection label with the JSON API URL', function() {
          expect(element.find('.selection-label-inner').text()).to.equal('#');
        });
      });
    });

    describe('when only one type of dataset is available', function() {
      var element;

      beforeEach(function() {
        $httpBackend.whenGET(new RegExp('/resource/[^.]+\\.geojson\\?\\$limit=1')).
          respond({});
        element = addValidElement();
        element.find('button:visible').click();
        expect(element.find('.tool-panel-main:visible').length).to.equal(1);
      });

      it('should not display the the geojson option', function() {
        expect(element.find('[title="GeoJSON"]:visible').length).to.equal(0);
      });

      it('should populate the documentation URL link', function() {
        expect(element.find('[data-action="documentation"]').attr('href')).to.equal(
          DOCUMENTATION_URL);
      });

      it('should populate the selection label with the JSON API URL', function() {
        expect(element.find('.selection-label-inner').text()).to.equal(JSON_URL);
      });

      it('should show the panel when clicked, and hide it when clicking outside', function() {
        expect(element.find('.tool-panel-inner-container:visible').length).to.equal(1);
        testHelpers.fireMouseEvent(element.find('.tool-panel-inner-container')[0], 'click');
        // no effect
        expect(element.find('.tool-panel-inner-container:visible').length).to.equal(1);
        testHelpers.fireMouseEvent($('body')[0], 'click');
        expect(element.find('.tool-panel-inner-container:visible').length).to.equal(0);
      });

      it('should show the panel when clicked, and hide it when hitting escape', function() {
        expect(element.find('.tool-panel-inner-container:visible').length).to.equal(1);
        testHelpers.fireMouseEvent(element.find('.tool-panel-inner-container')[0], 'click');
        // no effect
        expect(element.find('.tool-panel-inner-container:visible').length).to.equal(1);
        testHelpers.fireEvent(document, 'keydown', {which: 27});
        expect(element.find('.tool-panel-inner-container:visible').length).to.equal(0);
      });

      it('should clean up after itself when the scope is destroyed', inject(function(WindowState) {
        var scope = element.scope();
        var cleanedUp = false;
        scope.$on('cleaned-up', function() {
          cleanedUp = true;
        });

        expect(cleanedUp).to.be.false;

        scope.$broadcast('$destroy');

        expect(cleanedUp).to.be.true;
      }));
    });
  });
})();
