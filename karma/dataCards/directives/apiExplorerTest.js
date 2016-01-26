describe('API Explorer', function() {
  'use strict';

  var FAKE4x4 = 'fake-data';
  var TEST_DOMAIN = 'config.ru';
  var DOCUMENTATION_URL = 'https://dev.socrata.com/foundry/{0}/{1}'.format(TEST_DOMAIN, FAKE4x4);
  var JSON_URL = 'https://{0}/resource/{1}.json'.format(TEST_DOMAIN, FAKE4x4);
  var GEOJSON_URL = 'https://{0}/resource/{1}.geojson'.format(TEST_DOMAIN, FAKE4x4);

  var $httpBackend;
  var $rootScope;
  var $window;
  var testHelpers;
  var Mockumentary;

  /**
   * Create the <api-explorer> element with the proper wiring and add it to the dom.
   */
  function addValidElement() {
    var scope = $rootScope.$new();

    var page = Mockumentary.createPage({datasetId: FAKE4x4}, {id: FAKE4x4, domain: TEST_DOMAIN});
    scope.page = page;

    var apiExplorerHtml = '<api-explorer></api-explorer>';
    var element = testHelpers.TestDom.compileAndAppend(apiExplorerHtml, scope);
    $httpBackend.flush();
    $rootScope.$digest();
    return element;
  }

  beforeEach(angular.mock.module('dataCards'));
  beforeEach(angular.mock.module('dataCards/cards.scss'));
  beforeEach(angular.mock.module('dataCards/action-button.scss'));
  beforeEach(angular.mock.module('dataCards/flyout.scss'));

  beforeEach(function() {
    $('body').addClass('state-view-cards');

    inject([
      '$httpBackend',
      '$rootScope',
      '$window',
      'testHelpers',
      'Mockumentary',
      function(
        _$httpBackend,
        _$rootScope,
        _$window,
        _testHelpers,
        _Mockumentary) {

      $httpBackend = _$httpBackend;
      $rootScope = _$rootScope;
      $window = _$window;
      testHelpers = _testHelpers;
      Mockumentary = _Mockumentary;
    }]);
  });

  afterEach(function() {
    testHelpers.TestDom.clear();
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

        var scope = $rootScope.$new();

        var page = Mockumentary.createPage({datasetId: ''}, {id: '', domain: null});
        scope.page = page;

        element = testHelpers.TestDom.compileAndAppend('<api-explorer></api-explorer>', scope);
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

    it('should show the panel when clicked, and hide it when clicking the tool-panel element', function() {
      expect(element.find('.tool-panel-inner-container:visible').length).to.equal(1);
      testHelpers.fireMouseEvent(element.find('.tool-panel-inner-container')[0], 'click');
      // no effect
      expect(element.find('.tool-panel-inner-container:visible').length).to.equal(1);
      testHelpers.fireMouseEvent(element.find('.tool-panel')[0], 'click');
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

  describe('if editMode is true', function() {
    var element;
    var scope;

    beforeEach(function() {
      $httpBackend.whenGET(new RegExp('/resource/[^.]+\\.geojson\\?\\$limit=1')).
        respond({});
      element = addValidElement();
      scope = element.scope();
    });

    it('should give the api-explorer button class "disabled"', function() {
       scope.$safeApply(function() {
         scope.editMode = true;
       });
       expect(element.find('button').hasClass('disabled')).to.be.true;
    });

    it('should not open the panel on click', function() {
       scope.$safeApply(function() {
         scope.editMode = true;
       });
      testHelpers.fireMouseEvent(element.find('button')[0], 'click');
      expect(element.find('.tool-panel-inner-container:visible').length).to.equal(0);
    });
  });
});
