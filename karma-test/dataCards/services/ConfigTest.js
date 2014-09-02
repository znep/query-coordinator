describe('Socrata config service', function() {
  var configService;

  describe('socrataConfig object present', function() {
    beforeEach(function() {
      module('socrataCommon.services');
      inject(function($injector) {
        configService = $injector.get('ServerConfig');
        configService.setup({
          testKey: 'testValue'
        });
      });
    });

    it('should allow for fetching a value by key', function() {
      expect(configService.get('testKey')).to.exist.and.to.equal('testValue');
    });

    it('should return undefined for undefined keys', function() {
      expect(configService.get('notHere')).to.be.undefined;
    })
  });

  it('should not fail if not setup', function() {
    module('socrataCommon.services');
    inject(function($injector) {
      configService = $injector.get('ServerConfig');
    });
    expect(function() {
      configService.get('key');
    }).to.not.throw();
    expect(configService.get('key')).to.be.undefined;
  });

});
