(function() {
  'use strict';

  describe('<page-header />', function() {

    var ServerConfig;
    var testHelpers;
    var rootScope;

    var CUSTOM_CONFIGURATION = {
      'sign_in': 'Login',
      'sign_out': 'Logout',
      'sign_up': 'Register',
      'logo_url': 'http://placekitten.com/g/500/200'
    };

    beforeEach(module('/angular_templates/common/pageHeader.html'));

    beforeEach(module('test'));
    beforeEach(module('dataCards'));
    beforeEach(module('dataCards.services'));
    beforeEach(module('dataCards.filters'));
    beforeEach(module('socrataCommon.services'));
    beforeEach(module('socrataCommon.directives'));

    beforeEach(inject(function($injector) {
      testHelpers = $injector.get('testHelpers');
      rootScope = $injector.get('$rootScope');
      ServerConfig = $injector.get('ServerConfig');
    }));

    afterEach(function() {
      testHelpers.TestDom.clear();
      ServerConfig.getTheme.restore();
    });

    function createPageHeader(currentUser) {
      var outerScope = rootScope.$new();
      outerScope.currentUser = currentUser;

      var html = '<page-header current-user="currentUser"></page-header>';
      return testHelpers.TestDom.compileAndAppend(html, outerScope);
    }

    function stubServerConfigGetTheme(returnValue) {
      sinon.stub(ServerConfig, 'getTheme').returns(returnValue);
    }

    it('should display if the feature flag is set to true', function() {
      stubServerConfigGetTheme();
      sinon.stub(ServerConfig, 'get').withArgs('showNewuxPageHeader').returns(true);

      var element = createPageHeader();
      expect(element.find('.page-header')).to.not.have.class('ng-hide');

      ServerConfig.get.restore();
    });

    it('should not display if the feature flag is set to false', function() {
      stubServerConfigGetTheme();
      sinon.stub(ServerConfig, 'get').withArgs('showNewuxPageHeader').returns(false);

      var element = createPageHeader();
      expect(element.find('.page-header')).to.have.class('ng-hide');

      ServerConfig.get.restore();
    });

    it('should display if there is no configuration data', function() {
      stubServerConfigGetTheme();
      var element = createPageHeader();
      expect(element).to.have.descendants('img');
      expect(element).to.have.descendants('.page-header-links');
      expect(element.find('.page-header-link-signin')).to.have.text('Sign In').to.have.attr('href').equal('/login?referer_redirect=1');
      expect(element.find('.page-header-link-signout')).to.have.text('Sign Out').to.have.attr('href').equal('/logout');
      expect(element.find('.page-header-link-signup')).to.have.text('Sign Up').to.have.attr('href').equal('/signup?referer_redirect=1');
    });

    it('should display if there is configuration data', function() {
      stubServerConfigGetTheme(CUSTOM_CONFIGURATION);
      var element = createPageHeader();
      expect(element.find('img')).to.have.attr('src').equal('http://placekitten.com/g/500/200');
      expect(element.find('.page-header-link-signin')).to.have.text('Login').to.have.attr('href').equal('/login?referer_redirect=1');
      expect(element.find('.page-header-link-signout')).to.have.text('Logout').to.have.attr('href').equal('/logout');
      expect(element.find('.page-header-link-signup')).to.have.text('Register').to.have.attr('href').equal('/signup?referer_redirect=1');
    });

    describe('background color', function() {
      it('should set the background color if it is configured', function() {
        var customConfiguration = {
          'header_background_color': '#deadbe'
        };
        stubServerConfigGetTheme(customConfiguration);
        var element = createPageHeader();
        expect(element.scope().pageHeaderStyle).to.eql({ 'background-color': "#deadbe" });
      });
    });

    describe('logged in', function() {

      it('should hide "logged in" links if not logged in', function() {
        stubServerConfigGetTheme();
        var element = createPageHeader();
        expect(element.find('.page-header-link-signin')).to.not.have.class('ng-hide');
        expect(element.find('.page-header-link-signout')).to.have.class('ng-hide');
        expect(element.find('.page-header-link-signup')).to.not.have.class('ng-hide');
      });

      it('should show "logged in" links if logged in', function() {
        stubServerConfigGetTheme();
        var element = createPageHeader(true);
        expect(element.find('.page-header-link-signin')).to.have.class('ng-hide');
        expect(element.find('.page-header-link-signout')).to.not.have.class('ng-hide');
        expect(element.find('.page-header-link-signup')).to.have.class('ng-hide');
      });

    });

  });

})();
