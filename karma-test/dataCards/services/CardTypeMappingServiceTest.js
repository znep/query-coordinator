(function() {
  'use strict';

  var mapping = [
    { logical: 'photo', physical: 'picture', expected: 'unknown', supported: false },
    { logical: '*', physical: 'ignored', expected: 'table', supported: false },
    { logical: 'text', physical: 'text', expected: 'search', supported: true },
    { logical: 'name', physical: 'text', expected: 'search', supported: true },
    { logical: 'identifier', physical: 'text', expected: 'search', supported: true },
    { logical: 'text', physical: 'number', expected: 'search', supported: true },
    { logical: 'name', physical: 'number', expected: 'search', supported: true },
    { logical: 'identifier', physical: 'number', expected: 'search', supported: true },
    { logical: 'text', physical: 'point', expected: 'feature', supported: true },
    { logical: 'name', physical: 'point', expected: 'feature', supported: true },
    { logical: 'identifier', physical: 'point', expected: 'feature', supported: true },
    { logical: 'location', physical: 'point', expected: 'feature', supported: true },
    { logical: 'text', physical: 'fixed_timestamp', expected: 'timeline', supported: true },
    { logical: 'name', physical: 'fixed_timestamp', expected: 'timeline', supported: true },
    { logical: 'identifier', physical: 'fixed_timestamp', expected: 'timeline', supported: true },
    { logical: 'text', physical: 'floating_timestamp', expected: 'timeline', supported: true },
    { logical: 'name', physical: 'floating_timestamp', expected: 'timeline', supported: true },
    { logical: 'identifier', physical: 'floating_timestamp', expected: 'timeline', supported: true },
    { logical: 'time', physical: 'timestamp', expected: 'timeline', supported: true },
    { logical: 'time', physical: 'number', expected: 'timeline', supported: true },
    { logical: 'time', physical: 'fixed_timestamp', expected: 'timeline', supported: true },
    { logical: 'time', physical: 'floating_timestamp', expected: 'timeline', supported: true },
    { logical: 'location', physical: 'number', expected: 'choropleth', supported: true },
    { logical: 'location', physical: 'geo_entity', expected: 'point-ish map', supported: false },
    { logical: 'amount', physical: 'number', expected: 'statBar', supported: false },
    { logical: 'category', physical: 'ignored', expected: 'column', supported: true },
  ];

  var specialCase = { logical: 'location', physical: 'text', expected: 'choropleth' }

  describe('Card Type Mapping Service', function() {
    var ServerConfig;
    var CardTypeMappingService;
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
      CardTypeMappingService = $injector.get('CardTypeMappingService');
      $exceptionHandler = $injector.get('$exceptionHandler');
    }));

    function createColumn(testCase) {
      var column = {
        physicalDatatype: testCase.physical,
        logicalDatatype: testCase.logical,
        name: '{0} {1}'.format(testCase.logical, testCase.physical)
      };
      return column;
    }

    _.each(mapping, function(testCase) {
      var column = createColumn(testCase);
      describe('Logical: {0} - Physical: {1}'.format(testCase.logical, testCase.physical), function() {
        describe('cardTypeForColumn', function() {
          it('should produce {0}'.format(testCase.expected), function() {
            expect(CardTypeMappingService.cardTypeForColumn(column)).to.equal(testCase.expected);
          });
        });
        describe('cardTypeForColumnIsSupported', function() {
          it('should return {0}'.format(testCase.supported), function () {
            expect(CardTypeMappingService.cardTypeForColumnIsSupported(column)).to.equal(testCase.supported);
          });
        });
      });
    });

    describe('Logical: location - Physical: text', function() {
      describe('cardTypeForColumn', function() {
        it('should report error', function() {
          var column = {
            physicalDatatype: 'text',
            logicalDatatype: 'location',
            name: 'bad column'
          };
          CardTypeMappingService.cardTypeForColumn(column);
          expect($exceptionHandler.errors.length).to.equal(1);
        });
      });
    });

  });

})();
