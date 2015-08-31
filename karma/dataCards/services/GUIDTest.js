describe('Request ID service', function() {
  var RequestId;

  beforeEach(function() {
    module('socrataCommon.services')
    inject(function($injector) {
      RequestId = $injector.get('RequestId');
    });
  });

  describe('generate()', function() {
    it('should return a valid Socrata request ID /[a-z0-9]{32}/', function() {
      expect(RequestId.generate).to.exist.and.to.be.a('function');
      var id = RequestId.generate();
      expect(id).to.have.length(32);
      expect(id).to.exist.and.to.match(/[a-z0-9]{32}/)
    });

    it('should return a different request ID every call', function() {
      var id1 = RequestId.generate();
      var id2 = RequestId.generate();
      expect(id1).to.not.equal(id2);
    });

    it('should have equal top-16 characters, but different bottom-16 characters', function() {
      var id1 = RequestId.generate();
      var id1Top = id1.slice(0, 16);
      var id2 = RequestId.generate();
      var id2Top = id2.slice(0, 16);
      expect(id1Top).to.have.length(16);
      expect(id2Top).to.have.length(16);
      expect(id1Top).to.equal(id2Top);
    });
  })

});
