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

    describe('getFeatureSet', function() {
      it('should exist', function() {
        expect(configService).to.respondTo('getFeatureSet');
      });
      it('should return the feature set if it is present', function() {
        configService.override('featureSet', { 'staging_lockdown': true });
        expect(configService.getFeatureSet()).to.eql({ 'staging_lockdown': true });
      });
      it('should return an empty object if no feature set is present', function() {
        expect(configService.getFeatureSet()).to.eql({});
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

    describe('getScalarValue', function() {
      it('should return a scalar value', function() {
        configService.override('testScalar', 123);
        expect(configService.getScalarValue('testScalar')).to.eql(123);
      });
      it('should return a numeric string as a scalar value', function() {
        configService.override('testScalar', '123');
        expect(configService.getScalarValue('testScalar')).to.eql(123);
      });
      describe('non-scalar values', function() {
        it('should return "undefined"', function() {
          configService.override('testScalar', null);
          expect(configService.getScalarValue('testScalar')).to.eql(undefined);
          configService.override('testScalar', NaN);
          expect(configService.getScalarValue('testScalar')).to.eql(undefined);
          configService.override('testScalar', undefined);
          expect(configService.getScalarValue('testScalar')).to.eql(undefined);
          configService.override('testScalar', 'foo');
          expect(configService.getScalarValue('testScalar')).to.eql(undefined);
          configService.override('testScalar', '');
          expect(configService.getScalarValue('testScalar')).to.eql(undefined);
          configService.override('testScalar', {});
          expect(configService.getScalarValue('testScalar')).to.eql(undefined);
          configService.override('testScalar', []);
          expect(configService.getScalarValue('testScalar')).to.eql(undefined);
        });
        it('should return the default value', function() {
          configService.override('testScalar', null);
          expect(configService.getScalarValue('testScalar', 321)).to.eql(321);
          configService.override('testScalar', NaN);
          expect(configService.getScalarValue('testScalar', 321)).to.eql(321);
          configService.override('testScalar', undefined);
          expect(configService.getScalarValue('testScalar', 321)).to.eql(321);
          configService.override('testScalar', 'foo');
          expect(configService.getScalarValue('testScalar', 321)).to.eql(321);
          configService.override('testScalar', '');
          expect(configService.getScalarValue('testScalar', 321)).to.eql(321);
          configService.override('testScalar', {});
          expect(configService.getScalarValue('testScalar', 321)).to.eql(321);
          configService.override('testScalar', []);
          expect(configService.getScalarValue('testScalar', 321)).to.eql(321);
        });
      });
      it('should return the default value when provided and the key is not present', function() {
        expect(configService.getScalarValue('testScalarNotHere', 321)).to.eql(321);
      });
      it('should not return the default value when provided and the key is present', function() {
        configService.override('testScalar', 123);
        expect(configService.getScalarValue('testScalar', 321)).to.eql(123);
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
