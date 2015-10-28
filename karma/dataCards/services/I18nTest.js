describe('I18n', function() {
  'use strict';

  var I18n;
  var ServerConfig;
  var localeStub;

  beforeEach(function() {
    module('dataCards');
    inject(function($injector) {
      ServerConfig = $injector.get('ServerConfig');
      localeStub = sinon.stub(ServerConfig, 'get');
      localeStub.withArgs('locales').returns({
        currentLocale: 'ru',
        defaultLocale: 'en'
      });

      I18n = $injector.get('I18n');
    });
  });

  afterEach(function() {
    localeStub.restore();
  });

  describe('t', function() {
    it('returns an empty string if its input is not a string', function() {
      expect(I18n.t(3)).to.equal('');
      expect(I18n.t(null)).to.equal('');
      expect(I18n.t(undefined)).to.equal('');
      expect(I18n.t(NaN)).to.equal('');
    });

    it('indexes into itself if the key is a string', function() {
      I18n.__someDunderKey = 'dunderooney';
      expect(I18n.t('__someDunderKey')).to.equal('dunderooney');
    });
  });

  describe('a', function() {
    it('produces the link unchanged if the currentLocale equals the defaultLocale', function() {
      localeStub.withArgs('locales').returns({
        currentLocale: 'en',
        defaultLocale: 'en'
      });

      expect(I18n.a('/some/path')).to.equal('/some/path');
    });

    it('appends the locale to the URL if the currentLocale is different from the defaultLocale', function() {
      localeStub.withArgs('locales').returns({
        currentLocale: 'nyan',
        defaultLocale: 'en'
      });

      expect(I18n.a('/some/path')).to.equal('/nyan/some/path');
    });
  });
});
