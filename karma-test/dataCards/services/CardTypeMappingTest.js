(function() {
  'use strict';

  // Use a wide screen for this file. There is a ton of stuff and we're trying to fit
  // it into a small space.

  var mapping = [

    // Amount
    { physical: 'number', logical: 'amount', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                       // UNSUPPORTED
    { physical: 'point', logical: 'amount', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                        // UNSUPPORTED
    { physical: 'text', logical: 'amount', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                         // UNSUPPORTED
    { physical: 'geo_entity', logical: 'amount', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                   // UNSUPPORTED
    { physical: 'timestamp', logical: 'amount', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                    // UNSUPPORTED
    { physical: 'fixed_timestamp', logical: 'amount', expectedDefault: 'invalid', expectedAvailable: [], supported: false },              // UNSUPPORTED
    { physical: 'floating_timestamp', logical: 'amount', expectedDefault: 'invalid', expectedAvailable: [], supported: false },           // UNSUPPORTED
    { physical: 'boolean', logical: 'amount', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                      // UNSUPPORTED
    { physical: 'money', logical: 'amount', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                        // UNSUPPORTED

    // Category
    { physical: 'number', logical: 'category', expectedDefault: 'column', expectedAvailable: ['column', 'search'], supported: true },
    { physical: 'point', logical: 'category', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                      // UNSUPPORTED
    { physical: 'text', logical: 'category', expectedDefault: 'column', expectedAvailable: ['column', 'search'], supported: true },
    { physical: 'geo_entity', logical: 'category', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                 // UNSUPPORTED
    { physical: 'timestamp', logical: 'category', expectedDefault: 'column', expectedAvailable: ['column'], supported: true },
    { physical: 'fixed_timestamp', logical: 'category', expectedDefault: 'column', expectedAvailable: ['column'], supported: true },
    { physical: 'floating_timestamp', logical: 'category', expectedDefault: 'column', expectedAvailable: ['column'], supported: true },
    { physical: 'boolean', logical: 'category', expectedDefault: 'column', expectedAvailable: ['column'], supported: true },
    { physical: 'money', logical: 'category', expectedDefault: 'column', expectedAvailable: ['column'], supported: true },

    // Identifier
    { physical: 'number', logical: 'identifier', expectedDefault: 'search', expectedAvailable: ['search', 'column'], supported: true },
    { physical: 'point', logical: 'identifier', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                    // UNSUPPORTED
    { physical: 'text', logical: 'identifier', expectedDefault: 'search', expectedAvailable: ['search', 'column'], supported: true },
    { physical: 'geo_entity', logical: 'identifier', expectedDefault: 'invalid', expectedAvailable: [], supported: false },               // UNSUPPORTED
    { physical: 'timestamp', logical: 'identifier', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'fixed_timestamp', logical: 'identifier', expectedDefault: 'timeline', sexpectedAvailable: ['timeline'], supported: true },
    { physical: 'floating_timestamp', logical: 'identifier', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'boolean', logical: 'identifier', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                  // UNSUPPORTED
    { physical: 'money', logical: 'identifier', expectedDefault: 'search', expectedAvailable: ['search'], supported: true },

    // Location
    { physical: 'number', logical: 'location', expectedDefault: 'choropleth', expectedAvailable: ['choropleth'], supported: true },
    { physical: 'point', logical: 'location', expectedDefault: 'feature', expectedAvailable: ['feature'], supported: true },
    { physical: 'text', logical: 'location', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                       // UNSUPPORTED
    { physical: 'geo_entity', logical: 'location', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                 // UNSUPPORTED
    { physical: 'timestamp', logical: 'location', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                  // UNSUPPORTED
    { physical: 'fixed_timestamp', logical: 'location', expectedDefault: 'invalid', expectedAvailable: [], supported: false },            // UNSUPPORTED
    { physical: 'floating_timestamp', logical: 'location', expectedDefault: 'invalid', expectedAvailable: [], supported: false },         // UNSUPPORTED
    { physical: 'boolean', logical: 'location', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                    // UNSUPPORTED
    { physical: 'money', logical: 'location', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                      // UNSUPPORTED

    // Time
    { physical: 'number', logical: 'time', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'point', logical: 'time', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                          // UNSUPPORTED
    { physical: 'text', logical: 'time', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                           // UNSUPPORTED
    { physical: 'geo_entity', logical: 'time', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                     // UNSUPPORTED
    { physical: 'timestamp', logical: 'time', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'fixed_timestamp', logical: 'time', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'floating_timestamp', logical: 'time', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'boolean', logical: 'time', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                        // UNSUPPORTED
    { physical: 'money', logical: 'time', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },

    // Text
    { physical: 'number', logical: 'text', expectedDefault: 'search', expectedAvailable: ['search', 'column'], supported: true },
    { physical: 'point', logical: 'text', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                          // UNSUPPORTED
    { physical: 'text', logical: 'text', expectedDefault: 'search', expectedAvailable: ['search', 'column'], supported: true },
    { physical: 'geo_entity', logical: 'text', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                     // UNSUPPORTED
    { physical: 'timestamp', logical: 'text', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'fixed_timestamp', logical: 'text', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'floating_timestamp', logical: 'text', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'boolean', logical: 'text', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                        // UNSUPPORTED
    { physical: 'money', logical: 'text', expectedDefault: 'search', expectedAvailable: ['search'], supported: true },

    // Name
    { physical: 'number', logical: 'name', expectedDefault: 'search', expectedAvailable: ['search', 'column'], supported: true },
    { physical: 'point', logical: 'name', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                          // UNSUPPORTED
    { physical: 'text', logical: 'name', expectedDefault: 'search', expectedAvailable: ['search', 'column'], supported: true },
    { physical: 'geo_entity', logical: 'name', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                     // UNSUPPORTED
    { physical: 'timestamp', logical: 'name', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'fixed_timestamp', logical: 'name', expectedDefault: 'timeline', sexpectedAvailable: ['timeline'], supported: true },
    { physical: 'floating_timestamp', logical: 'name', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'boolean', logical: 'name', expectedDefault: 'invalid', expectedAvailable: [], supported: false },                        // UNSUPPORTED
    { physical: 'money', logical: 'name', expectedDefault: 'search', expectedAvailable: ['search'], supported: true },

    // Table (non user-configurable)
    { physical: '*', logical: '*', expectedDefault: 'table', expectedAvailable: [], supported: true },

    // Junk
    { physical: 'picture', logical: 'photo', expectedDefault: 'invalid', expectedAvailable: [], supported: false }

  ];

  function createColumn(testCase) {
    var column = {
      physicalDatatype: testCase.physical,
      logicalDatatype: testCase.logical,
      name: '{0} {1}'.format(testCase.logical, testCase.physical),
      cardinality: testCase.cardinality || 15
    };
    return column;
  }

  describe('Card Type Mapping Service', function() {

    var ServerConfig;
    var CardTypeMapping;
    var $exceptionHandler;
    var Model;

    function createDatasetFromColumns(columns) {
      var dataset = new Model();
      dataset.defineObservableProperty('columns', _.indexBy(columns, 'name'));
      return dataset;
    }

    function createSingleTestCaseDataset(testCase, fieldName) {
      fieldName = fieldName || 'testColumn';
      var column = createColumn(testCase);
      column.name = fieldName;
      return createDatasetFromColumns([column]);
    }

    beforeEach(module('dataCards'));

    beforeEach(module('dataCards.services'));

    beforeEach(module(function($exceptionHandlerProvider) {
      $exceptionHandlerProvider.mode('log');
    }));

    beforeEach(inject(function($injector) {
      ServerConfig = $injector.get('ServerConfig');
      var serverMocks = $injector.get('serverMocks');
      // We need to simulate the Feature Map feature flag being turned on
      // in order to test card type mappings to feature maps.
      ServerConfig.setup({
        'oduxEnableFeatureMap': true,
        'oduxCardTypeMapping': serverMocks.CARD_TYPE_MAPPING
      });
      CardTypeMapping = $injector.get('CardTypeMapping');
      $exceptionHandler = $injector.get('$exceptionHandler');
      Model = $injector.get('Model');
    }));

    it('should return a fallback for invalid visualization datatype combinations', function() {
      var column = createColumn({ physical: 'nope', logical: 'nope', expectedDefault: 'invalid', expectedAvailable: [], supported: false });
      var dataset = createDatasetFromColumns([column]);
      var mapping = CardTypeMapping.defaultVisualizationForColumn(dataset, column.name);
      expect(mapping).to.equal('invalid');
    });

    describe('defaultVisualizationForColumn', function() {
      _.each(mapping, function(testCase) {
        describe('when encountering the physical/logical datatype pairing "{1}"/"{0}"'.
                 format(testCase.physical, testCase.logical), function() {
          it('should return {0}'.format(testCase.expectedDefault), function() {
            var dataset = createSingleTestCaseDataset(testCase);
            expect(CardTypeMapping.defaultVisualizationForColumn(dataset, 'testColumn')).
              to.equal(testCase.expectedDefault);
          });
        });
      });

      it('should return null for columns with cardinality less than the minimum', function() {
        var column = createColumn({
          physical: 'number',
          logical: 'category',
          cardinality: 1
        });
        var dataset = createDatasetFromColumns([column]);
        expect(CardTypeMapping.defaultVisualizationForColumn(dataset, 'number category')).to.equal(null);
      });
    });

    describe('visualizationSupportedForColumn', function() {
      _.each(mapping, function(testCase) {
        describe('when encountering the physical/logical datatype pairing "{1}"/"{0}"'.
                 format(testCase.physical, testCase.logical), function() {
          it('should return {0}'.format(testCase.supported), function () {
            var dataset = createSingleTestCaseDataset(testCase);
            expect(CardTypeMapping.visualizationSupportedForColumn(dataset, 'testColumn')).
              to.equal(testCase.supported);
          });
        });
      });
    });

    // The following test was disabled on 12/3/14 because CardTypeMapping no longer
    // warns but permits the location/text pairing and instead reports it as unsupported.
    describe('when encountering a deprecated choropleth mapping', function() {
      describe('using defaultVisualizationForColumn', function() {
        xit('should raise an exception', function() {
          var column = {
            physicalDatatype: 'text',
            logicalDatatype: 'location',
            name: 'DEPRECATED'
          };

          CardTypeMapping.defaultVisualizationForColumn(createDatasetFromColumns([column]), 'text location');          
          expect($exceptionHandler.errors.length).to.equal(1);

        });
      });
    });

  });

})();
