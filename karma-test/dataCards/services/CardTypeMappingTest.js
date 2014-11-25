(function() {
  'use strict';

  // Use a wide screen for this file. There is a ton of stuff and we're trying to fit
  // it into a small space.

  var mapping = [

    // Category
    { physical: 'number', logical: 'category', expectedDefault: 'column', expectedAvailable: ['column', 'search'], supported: true },
    { physical: 'point', logical: 'category', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },                  // UNSUPPORTED
    { physical: 'text', logical: 'category', expectedDefault: 'column', expectedAvailable: ['column', 'search'], supported: true },
    { physical: 'geo_entity', logical: 'category', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },             // UNSUPPORTED
    { physical: 'timestamp', logical: 'category', expectedDefault: 'column', expectedAvailable: ['column'], supported: true },
    { physical: 'fixed_timestamp', logical: 'category', expectedDefault: 'column', expectedAvailable: ['column'], supported: true },
    { physical: 'floating_timestamp', logical: 'category', expectedDefault: 'column', expectedAvailable: ['column'], supported: true },
    { physical: 'boolean', logical: 'category', expectedDefault: 'column', expectedAvailable: ['column'], supported: true },
    { physical: 'money', logical: 'category', expectedDefault: 'column', expectedAvailable: ['column'], supported: true },

    // Amount
    { physical: 'number', logical: 'amount', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'point', logical: 'amount', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'text', logical: 'amount', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'geo_entity', logical: 'amount', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'timestamp', logical: 'amount', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'fixed_timestamp', logical: 'amount', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'floating_timestamp', logical: 'amount', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'boolean', logical: 'amount', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'money', logical: 'amount', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },

    // Location
    { physical: 'number', logical: 'location', expectedDefault: 'choropleth', expectedAvailable: ['choropleth'], supported: true },
    { physical: 'point', logical: 'location', expectedDefault: 'feature', expectedAvailable: ['feature'], supported: true },
    { physical: 'text', logical: 'location', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'geo_entity', logical: 'location', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'timestamp', logical: 'location', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'fixed_timestamp', logical: 'location', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'floating_timestamp', logical: 'location', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'boolean', logical: 'location', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'money', logical: 'location', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },

    // Time
    { physical: 'number', logical: 'time', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'point', logical: 'time', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'text', logical: 'time', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'geo_entity', logical: 'time', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'timestamp', logical: 'time', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'fixed_timestamp', logical: 'time', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'floating_timestamp', logical: 'time', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'boolean', logical: 'time', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'money', logical: 'time', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },

    // Text
    { physical: 'number', logical: 'text', expectedDefault: 'search', expectedAvailable: ['search', 'column'], supported: true },
    { physical: 'point', logical: 'text', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'text', logical: 'text', expectedDefault: 'search', expectedAvailable: ['search', 'column'], supported: true },
    { physical: 'geo_entity', logical: 'text', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'timestamp', logical: 'text', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'fixed_timestamp', logical: 'text', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'floating_timestamp', logical: 'text', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'boolean', logical: 'text', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'money', logical: 'text', expectedDefault: 'search', expectedAvailable: ['search'], supported: true },

    // Name
    { physical: 'number', logical: 'name', expectedDefault: 'search', expectedAvailable: ['search', 'column'], supported: true },
    { physical: 'point', logical: 'name', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'text', logical: 'name', expectedDefault: 'search', expectedAvailable: ['search', 'column'], supported: true },
    { physical: 'geo_entity', logical: 'name', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'timestamp', logical: 'name', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'fixed_timestamp', logical: 'name', expectedDefault: 'timeline', sexpectedAvailable: ['timeline'], supported: true },
    { physical: 'floating_timestamp', logical: 'name', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'boolean', logical: 'name', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'money', logical: 'name', expectedDefault: 'search', expectedAvailable: ['search'], supported: true },

    // Identifier
    { physical: 'number', logical: 'identifier', expectedDefault: 'search', expectedAvailable: ['search', 'column'], supported: true },
    { physical: 'point', logical: 'identifier', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'text', logical: 'identifier', expectedDefault: 'search', expectedAvailable: ['search', 'column'], supported: true },
    { physical: 'geo_entity', logical: 'identifier', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'timestamp', logical: 'identifier', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'fixed_timestamp', logical: 'identifier', expectedDefault: 'timeline', sexpectedAvailable: ['timeline'], supported: true },
    { physical: 'floating_timestamp', logical: 'identifier', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'boolean', logical: 'identifier', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },
    { physical: 'money', logical: 'identifier', expectedDefault: 'search', expectedAvailable: ['search'], supported: true },

    // Table (non user-configurable)
    { physical: '', logical: '*', expectedDefault: 'table', expectedAvailable: [], supported: false },

    // Junk
    { physical: 'picture', logical: 'photo', expectedDefault: 'unsupported', expectedAvailable: [], supported: false },

  ];

  function createColumn(testCase) {
    var column = {
      physicalDatatype: testCase.physical,
      logicalDatatype: testCase.logical,
      name: '{0} {1}'.format(testCase.logical, testCase.physical)
    };
    return column;
  }

  describe('Card Type Mapping Service', function() {

    var ServerConfig;
    var CardTypeMapping;
    var $exceptionHandler;

    beforeEach(module('dataCards'));

    beforeEach(module('dataCards.services'));

    beforeEach(module(function($exceptionHandlerProvider) {
      $exceptionHandlerProvider.mode('log');
    }));

    beforeEach(inject(function($injector) {
      ServerConfig = $injector.get('ServerConfig');
      // We need to simulate the Feature Map feature flag being turned on
      // in order to test card type mappings to feature maps.
      ServerConfig.setup({ 'oduxEnableFeatureMap': true });
      CardTypeMapping = $injector.get('CardTypeMapping');
      $exceptionHandler = $injector.get('$exceptionHandler');
    }));

    _.each(mapping, function(testCase) {
      var column = createColumn(testCase);
      describe('when encountering the physical/logical datatype pairing "{1}"/"{0}"'.format(testCase.physical, testCase.logical), function() {
        describe('using defaultVisualizationForColumn', function() {
          it('should return {0}'.format(testCase.expectedDefault), function() {
            expect(CardTypeMapping.defaultVisualizationForColumn(column)).to.equal(testCase.expectedDefault);
          });
        });
        describe('using visualizationSupportedForColumn', function() {
          it('should return {0}'.format(testCase.supported), function () {
            expect(CardTypeMapping.visualizationSupportedForColumn(column)).to.equal(testCase.supported);
          });
        });
      });
    });

    describe('when encountering a deprecated choropleth mapping', function() {
      describe('using defaultVisualizationForColumn', function() {
        it('should raise an exception', function() {
          var column = {
            physicalDatatype: 'text',
            logicalDatatype: 'location',
            name: 'DEPRECATED'
          };

          CardTypeMapping.defaultVisualizationForColumn(column);          
          expect($exceptionHandler.errors.length).to.equal(1);

        });
      });
    });

  });

})();
