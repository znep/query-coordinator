const angular = require('angular');
const L = require('leaflet');

describe('LeafletHelpersService', function() {
  'use strict';

  var LeafletHelpersService;

  beforeEach(angular.mock.module('dataCards'));

  beforeEach(inject(function($injector) {
    LeafletHelpersService = $injector.get('LeafletHelpersService');
  }));

  describe('#buildBounds', function() {
    it('should exist', function() {
      expect(LeafletHelpersService).to.respondTo('buildBounds');
    });

    it('should return valid bounds for valid input', function() {
      var actual = LeafletHelpersService.buildBounds({
        "southwest":[41.681944,-87.827778],
        "northeast":[42.081944,-87.427778]
      });
      expect(actual).to.be.instanceOf(L.LatLngBounds).and.to.respondTo('isValid');
      expect(actual.isValid()).to.equal(true);
    });

    it('should throw for invalid bounds', function() {
      expect(function() {
        LeafletHelpersService.buildBounds({ foo: [1,1], bar: [1,1] });
      }).to.throw();
    });

  });

  describe('#validateExtent', function() {
    it('should return true for a valid extent', function() {
      var extent = {
        "southwest":[41.681944,-87.827778],
        "northeast":[42.081944,-87.427778]
      };
      expect(LeafletHelpersService.validateExtent(extent)).to.equal(true);
    });

    it('should return false on an extent with invalid southwest values', function() {
      var extent = {
        "southwest":[441.681944,-887.827778],
        "northeast":[42.081944,-87.427778]
      };
      expect(LeafletHelpersService.validateExtent(extent)).to.equal(false);
    });

    it('should return false on an extent with invalid northeast values', function() {
      var extent = {
        "southwest":[41.681944,-87.827778],
        "northeast":[442.081944,-87.427778]
      };
      expect(LeafletHelpersService.validateExtent(extent)).to.equal(false);
    });
  });
});
