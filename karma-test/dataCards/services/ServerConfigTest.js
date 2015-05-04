describe('Socrata config service', function() {
  'use strict';

  var configService;

  describe('socrataConfig object present', function() {
    var originalConfigBlob;

    beforeEach(function() {
      module('socrataCommon.services');
      inject(function($injector) {
        originalConfigBlob = {
          testKey: 'testValue'
        };

        configService = $injector.get('ServerConfig');
        configService.setup(originalConfigBlob);
      });
    });

    it('should allow for fetching a value by key', function() {
      expect(configService.get('testKey')).to.exist.and.to.equal('testValue');
    });

    it('should return undefined for undefined keys', function() {
      expect(configService.get('notHere')).to.be.undefined;
    });

    describe('getTheme', function() {
      it('should exist', function() {
        expect(configService).to.respondTo('getTheme');
      });

      it('should return the theme if it is present', function() {
        configService.override('themeV3', { 'logo_url': 'mylogo.jpg' });
        expect(configService.getTheme()).to.eql({ 'logo_url': 'mylogo.jpg' });
      });

      it('should return an empty object if not present', function() {
        expect(configService.getTheme()).to.eql({});
      });
    });

    describe('override', function() {
      it('should affect what get() returns', function() {
        configService.override('notHere', 'jk actually here');
        expect(configService.get('notHere')).to.equal('jk actually here');
      });

      it('should not modify the blob passed to setup()', function() {
        configService.override('notHere', 'jk actually here');
        expect(originalConfigBlob).to.not.have.key('notHere');
      });
    });
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
