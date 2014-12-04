(function() {
  'use strict';

  // Use a wide screen for this file. There is a ton of stuff and we're trying to fit
  // it into a small space.

  var mapping = [

    // Amount
    { physical: 'number', logical: 'amount', expectedDefault: null, expectedAvailable: [], supported: false },                       // UNSUPPORTED
    { physical: 'point', logical: 'amount', expectedDefault: null, expectedAvailable: [], supported: false },                        // UNSUPPORTED
    { physical: 'text', logical: 'amount', expectedDefault: null, expectedAvailable: [], supported: false },                         // UNSUPPORTED
    { physical: 'geo_entity', logical: 'amount', expectedDefault: null, expectedAvailable: [], supported: false },                   // UNSUPPORTED
    { physical: 'timestamp', logical: 'amount', expectedDefault: null, expectedAvailable: [], supported: false },                    // UNSUPPORTED
    { physical: 'fixed_timestamp', logical: 'amount', expectedDefault: null, expectedAvailable: [], supported: false },              // UNSUPPORTED
    { physical: 'floating_timestamp', logical: 'amount', expectedDefault: null, expectedAvailable: [], supported: false },           // UNSUPPORTED
    { physical: 'boolean', logical: 'amount', expectedDefault: null, expectedAvailable: [], supported: false },                      // UNSUPPORTED
    { physical: 'money', logical: 'amount', expectedDefault: null, expectedAvailable: [], supported: false },                        // UNSUPPORTED

    // Category
    { physical: 'number', logical: 'category', expectedDefault: 'search', expectedAvailable: ['column', 'search'], supported: true },
    { physical: 'point', logical: 'category', expectedDefault: null, expectedAvailable: [], supported: false },                      // UNSUPPORTED
    { physical: 'text', logical: 'category', expectedDefault: 'search', expectedAvailable: ['column', 'search'], supported: true },
    { physical: 'geo_entity', logical: 'category', expectedDefault: null, expectedAvailable: [], supported: false },                 // UNSUPPORTED
    { physical: 'timestamp', logical: 'category', expectedDefault: 'column', expectedAvailable: ['column'], supported: true },
    { physical: 'fixed_timestamp', logical: 'category', expectedDefault: 'column', expectedAvailable: ['column'], supported: true },
    { physical: 'floating_timestamp', logical: 'category', expectedDefault: 'column', expectedAvailable: ['column'], supported: true },
    { physical: 'boolean', logical: 'category', expectedDefault: 'column', expectedAvailable: ['column'], supported: true },
    { physical: 'money', logical: 'category', expectedDefault: 'column', expectedAvailable: ['column'], supported: true },

    // Identifier
    { physical: 'number', logical: 'identifier', expectedDefault: 'search', expectedAvailable: ['search', 'column'], supported: true },
    { physical: 'point', logical: 'identifier', expectedDefault: null, expectedAvailable: [], supported: false },                    // UNSUPPORTED
    { physical: 'text', logical: 'identifier', expectedDefault: 'search', expectedAvailable: ['search', 'column'], supported: true },
    { physical: 'geo_entity', logical: 'identifier', expectedDefault: null, expectedAvailable: [], supported: false },               // UNSUPPORTED
    { physical: 'timestamp', logical: 'identifier', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'fixed_timestamp', logical: 'identifier', expectedDefault: 'timeline', sexpectedAvailable: ['timeline'], supported: true },
    { physical: 'floating_timestamp', logical: 'identifier', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'boolean', logical: 'identifier', expectedDefault: null, expectedAvailable: [], supported: false },                  // UNSUPPORTED
    { physical: 'money', logical: 'identifier', expectedDefault: 'search', expectedAvailable: ['search'], supported: true },

    // Location
    { physical: 'number', logical: 'location', expectedDefault: 'choropleth', expectedAvailable: ['choropleth'], supported: true },
    { physical: 'point', logical: 'location', expectedDefault: 'feature', expectedAvailable: ['feature'], supported: true },
    { physical: 'text', logical: 'location', expectedDefault: null, expectedAvailable: [], supported: false },                       // UNSUPPORTED
    { physical: 'geo_entity', logical: 'location', expectedDefault: null, expectedAvailable: [], supported: false },                 // UNSUPPORTED
    { physical: 'timestamp', logical: 'location', expectedDefault: null, expectedAvailable: [], supported: false },                  // UNSUPPORTED
    { physical: 'fixed_timestamp', logical: 'location', expectedDefault: null, expectedAvailable: [], supported: false },            // UNSUPPORTED
    { physical: 'floating_timestamp', logical: 'location', expectedDefault: null, expectedAvailable: [], supported: false },         // UNSUPPORTED
    { physical: 'boolean', logical: 'location', expectedDefault: null, expectedAvailable: [], supported: false },                    // UNSUPPORTED
    { physical: 'money', logical: 'location', expectedDefault: null, expectedAvailable: [], supported: false },                      // UNSUPPORTED

    // Time
    { physical: 'number', logical: 'time', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'point', logical: 'time', expectedDefault: null, expectedAvailable: [], supported: false },                          // UNSUPPORTED
    { physical: 'text', logical: 'time', expectedDefault: null, expectedAvailable: [], supported: false },                           // UNSUPPORTED
    { physical: 'geo_entity', logical: 'time', expectedDefault: null, expectedAvailable: [], supported: false },                     // UNSUPPORTED
    { physical: 'timestamp', logical: 'time', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'fixed_timestamp', logical: 'time', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'floating_timestamp', logical: 'time', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'boolean', logical: 'time', expectedDefault: null, expectedAvailable: [], supported: false },                        // UNSUPPORTED
    { physical: 'money', logical: 'time', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },

    // Text
    { physical: 'number', logical: 'text', expectedDefault: 'search', expectedAvailable: ['search', 'column'], supported: true },
    { physical: 'point', logical: 'text', expectedDefault: null, expectedAvailable: [], supported: false },                          // UNSUPPORTED
    { physical: 'text', logical: 'text', expectedDefault: 'search', expectedAvailable: ['search', 'column'], supported: true },
    { physical: 'geo_entity', logical: 'text', expectedDefault: null, expectedAvailable: [], supported: false },                     // UNSUPPORTED
    { physical: 'timestamp', logical: 'text', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'fixed_timestamp', logical: 'text', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'floating_timestamp', logical: 'text', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'boolean', logical: 'text', expectedDefault: null, expectedAvailable: [], supported: false },                        // UNSUPPORTED
    { physical: 'money', logical: 'text', expectedDefault: 'search', expectedAvailable: ['search'], supported: true },

    // Name
    { physical: 'number', logical: 'name', expectedDefault: 'search', expectedAvailable: ['search', 'column'], supported: true },
    { physical: 'point', logical: 'name', expectedDefault: null, expectedAvailable: [], supported: false },                          // UNSUPPORTED
    { physical: 'text', logical: 'name', expectedDefault: 'search', expectedAvailable: ['search', 'column'], supported: true },
    { physical: 'geo_entity', logical: 'name', expectedDefault: null, expectedAvailable: [], supported: false },                     // UNSUPPORTED
    { physical: 'timestamp', logical: 'name', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'fixed_timestamp', logical: 'name', expectedDefault: 'timeline', sexpectedAvailable: ['timeline'], supported: true },
    { physical: 'floating_timestamp', logical: 'name', expectedDefault: 'timeline', expectedAvailable: ['timeline'], supported: true },
    { physical: 'boolean', logical: 'name', expectedDefault: null, expectedAvailable: [], supported: false },                        // UNSUPPORTED
    { physical: 'money', logical: 'name', expectedDefault: 'search', expectedAvailable: ['search'], supported: true },

    // Table (non user-configurable)
    { physical: '*', logical: '*', expectedDefault: 'table', expectedAvailable: [], supported: false },

    // Junk
    { physical: 'picture', logical: 'photo', expectedDefault: null, expectedAvailable: [], supported: false },

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
      ServerConfig.setup({
        'oduxEnableFeatureMap': true,
        'oduxCardTypeMapping': {"amount":{"boolean":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"fixed_timestamp":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"floating_timestamp":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"geo_entity":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"money":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"number":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"point":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"text":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"timestamp":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"*":{"lowCardinalityDefault":"table","highCardinalityDefault":"table","available":["table"]}},"category":{"boolean":{"lowCardinalityDefault":"column","highCardinalityDefault":"column","available":["column"]},"fixed_timestamp":{"lowCardinalityDefault":"column","highCardinalityDefault":"column","available":["column"]},"floating_timestamp":{"lowCardinalityDefault":"column","highCardinalityDefault":"column","available":["column"]},"geo_entity":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"money":{"lowCardinalityDefault":"column","highCardinalityDefault":"column","available":["column"]},"number":{"lowCardinalityDefault":"column","highCardinalityDefault":"search","available":["column","search"]},"point":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"text":{"lowCardinalityDefault":"column","highCardinalityDefault":"search","available":["column","search"]},"timestamp":{"lowCardinalityDefault":"column","highCardinalityDefault":"column","available":["column"]},"*":{"lowCardinalityDefault":"table","highCardinalityDefault":"table","available":["table"]}},"identifier":{"boolean":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"fixed_timestamp":{"lowCardinalityDefault":"timeline","highCardinalityDefault":"timeline","available":["timeline"]},"floating_timestamp":{"lowCardinalityDefault":"timeline","highCardinalityDefault":"timeline","available":["timeline"]},"geo_entity":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"money":{"lowCardinalityDefault":"search","highCardinalityDefault":"search","available":["search"]},"number":{"lowCardinalityDefault":"search","highCardinalityDefault":"search","available":["column","search"]},"point":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"text":{"lowCardinalityDefault":"search","highCardinalityDefault":"search","available":["column","search"]},"timestamp":{"lowCardinalityDefault":"timeline","highCardinalityDefault":"timeline","available":["timeline"]},"*":{"lowCardinalityDefault":"table","highCardinalityDefault":"table","available":["table"]}},"location":{"boolean":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"fixed_timestamp":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"floating_timestamp":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"geo_entity":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"money":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"number":{"lowCardinalityDefault":"choropleth","highCardinalityDefault":"choropleth","available":["choropleth"]},"point":{"lowCardinalityDefault":"feature","highCardinalityDefault":"feature","available":["feature"]},"text":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"timestamp":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"*":{"lowCardinalityDefault":"table","highCardinalityDefault":"table","available":["table"]}},"name":{"boolean":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"fixed_timestamp":{"lowCardinalityDefault":"timeline","highCardinalityDefault":"timeline","available":["timeline"]},"floating_timestamp":{"lowCardinalityDefault":"timeline","highCardinalityDefault":"timeline","available":["timeline"]},"geo_entity":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"money":{"lowCardinalityDefault":"search","highCardinalityDefault":"search","available":["search"]},"number":{"lowCardinalityDefault":"search","highCardinalityDefault":"search","available":["column","search"]},"point":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"text":{"lowCardinalityDefault":"search","highCardinalityDefault":"search","available":["column","search"]},"timestamp":{"lowCardinalityDefault":"timeline","highCardinalityDefault":"timeline","available":["timeline"]},"*":{"lowCardinalityDefault":"table","highCardinalityDefault":"table","available":["table"]}},"text":{"boolean":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"fixed_timestamp":{"lowCardinalityDefault":"timeline","highCardinalityDefault":"timeline","available":["timeline"]},"floating_timestamp":{"lowCardinalityDefault":"timeline","highCardinalityDefault":"timeline","available":["timeline"]},"geo_entity":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"money":{"lowCardinalityDefault":"search","highCardinalityDefault":"search","available":["search"]},"number":{"lowCardinalityDefault":"search","highCardinalityDefault":"search","available":["column","search"]},"point":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"text":{"lowCardinalityDefault":"search","highCardinalityDefault":"search","available":["column","search"]},"timestamp":{"lowCardinalityDefault":"timeline","highCardinalityDefault":"timeline","available":["timeline"]},"*":{"lowCardinalityDefault":"table","highCardinalityDefault":"table","available":["table"]}},"time":{"boolean":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"fixed_timestamp":{"lowCardinalityDefault":"timeline","highCardinalityDefault":"timeline","available":["timeline"]},"floating_timestamp":{"lowCardinalityDefault":"timeline","highCardinalityDefault":"timeline","available":["timeline"]},"geo_entity":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"money":{"lowCardinalityDefault":"timeline","highCardinalityDefault":"timeline","available":["timeline"]},"number":{"lowCardinalityDefault":"timeline","highCardinalityDefault":"timeline","available":["timeline"]},"point":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"text":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"timestamp":{"lowCardinalityDefault":"timeline","highCardinalityDefault":"timeline","available":["timeline"]},"*":{"lowCardinalityDefault":"table","highCardinalityDefault":"table","available":["table"]}},"*":{"boolean":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"fixed_timestamp":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"floating_timestamp":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"geo_entity":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"money":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"number":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"point":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"text":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"timestamp":{"lowCardinalityDefault":null,"highCardinalityDefault":null,"available":[]},"*":{"lowCardinalityDefault":"table","highCardinalityDefault":"table","available":["table"]}},":version":"0.2"}
      });
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

          CardTypeMapping.defaultVisualizationForColumn(column);          
          expect($exceptionHandler.errors.length).to.equal(1);

        });
      });
    });

  });

})();
