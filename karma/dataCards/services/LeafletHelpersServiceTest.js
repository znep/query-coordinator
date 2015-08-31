describe('LeafletHelpersService', function() {
  var LeafletHelpersService;

  beforeEach(function () {
    module('socrataCommon.services');
  });

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
});
