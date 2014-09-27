(function() {

  'use strict';

  describe('<selection-label/>', function() {
    var FAKE4x4 = 'fake-data';
    var TEST_DOMAIN = 'config.ru';

    var $window;
    var testHelpers;
    var $rootScope;
    var $httpBackend;
    var Model;

    beforeEach(function() {
      module('/angular_templates/dataCards/apiExplorer.html');
      module('/angular_templates/dataCards/selectionLabel.html');
      module('socrataCommon.services');
      module('dataCards.directives');
      module('dataCards.services');
      module('dataCards.models');
      module('dataCards');
      module('test');

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

    it('accept a datasetObservable attribute', function() {
      var scope = $rootScope.$new();
      var TEST_OBSERVABLE = new Rx.Subject();
      scope.myTestObservable = TEST_OBSERVABLE;
      var element = testHelpers.TestDom.compileAndAppend('<api-explorer dataset-observable="myTestObservable"></api-explorer>', scope);
      expect(element.isolateScope().datasetObservable).to.equal(TEST_OBSERVABLE);
    });

    describe('URLs', function() {
      var scope;
      var element;

      beforeEach(function() {
        $httpBackend.whenGET(new RegExp('/resource/[^.]*\\.geojson\\?\\$limit=1')).respond({geojson: true});
      });

      describe('with a valid Dataset', function() {

        beforeEach(function() {
          var model = new Model();
          model.id = FAKE4x4;
          model.defineObservableProperty('domain', TEST_DOMAIN);
          scope = $rootScope.$new();
          scope.myTestObservable = Rx.Observable.return(model);
          element = testHelpers.TestDom.compileAndAppend('<api-explorer dataset-observable="myTestObservable"></api-explorer>', scope);
          $httpBackend.flush();
          $rootScope.$digest();
        });

        it('should populate the documentation URL link', function() {
          var EXPECTED_URL = 'http://dev.socrata.com/foundry/#/{0}/{1}'.format(TEST_DOMAIN, FAKE4x4);
          expect(element.find('[data-action="documentation"]').attr('href')).to.equal(EXPECTED_URL);
        });

        it('should populate the selection label with the JSON API URL', function() {
          var EXPECTED_URL = 'https://{0}/resource/{1}.json'.format(TEST_DOMAIN, FAKE4x4);
          expect(element.find('.selection-label-inner').text()).to.equal(EXPECTED_URL);
        });

        it('should have the "format" selectable', function() {
          expect(element.find('[title="JSON"]').is(':visible')).to.be.true;
        });

        it('should switch the "format" when GeoJSON is selected', function() {
          var EXPECTED_URL = 'https://{0}/views/{1}/rows.geojson'.format(TEST_DOMAIN, FAKE4x4);
          element.find('[title="GeoJSON"]').click();
          expect(element.find('.selection-label-inner').text()).to.equal(EXPECTED_URL);
        })

      });

      describe('with an invalid Dataset', function() {

        beforeEach(function() {
          var model = new Model();
          model.id = '';
          model.defineObservableProperty('domain', null);
          scope = $rootScope.$new();
          scope.myTestObservable = Rx.Observable.return(model);
          element = testHelpers.TestDom.compileAndAppend('<api-explorer dataset-observable="myTestObservable"></api-explorer>', scope);
        });

        it('should populate the documentation URL link', function() {
          expect(element.find('[data-action="documentation"]').attr('href')).to.equal('#');
        });

        it('should populate the selection label with the JSON API URL', function() {
          expect(element.find('.selection-label-inner').text()).to.equal('#');
        });

      });

    });

    describe('when no GeoJSON available for dataset', function() {
      var scope;
      var element;

      beforeEach(function() {
        $httpBackend.whenGET(new RegExp('/resource/[^.]*\\.geojson\\?\\$limit=0')).respond({});
        var model = new Model();
        model.id = FAKE4x4;
        model.defineObservableProperty('domain', TEST_DOMAIN);
        scope = $rootScope.$new();
        scope.myTestObservable = Rx.Observable.return(model);
        element = testHelpers.TestDom.compileAndAppend('<api-explorer dataset-observable="myTestObservable"></api-explorer>', scope);
      });

      it('should ')

    });

  });

})();
