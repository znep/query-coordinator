(function() {
  'use strict';

  describe('<page-header />', function() {

    var ConfigurationsService;
    var testHelpers;
    var rootScope;

    var CUSTOM_CONFIGURATION = [
      {
        "name": "sign_in",
        "value": "Login"
      },
      {
        "name": "sign_out",
        "value": "Logout"
      },
      {
        "name": "sign_up",
        "value": "Register"
      },
      {
        "name": "logo_url",
        "value": "http://placekitten.com/g/500/200"
      }
    ];

    beforeEach(module('/angular_templates/common/pageHeader.html'));

    beforeEach(module('test'));
    beforeEach(module('socrataCommon.services'));
    beforeEach(module('socrataCommon.directives'));

    beforeEach(inject(function($injector) {
      testHelpers = $injector.get('testHelpers');
      rootScope = $injector.get('$rootScope');
      ConfigurationsService = $injector.get('ConfigurationsService');
    }));

    afterEach(function() {
      testHelpers.TestDom.clear();
    });
    
    function createPageHeader(currentUser) {
      var outerScope = rootScope.$new();
      outerScope.currentUser = currentUser;

      var html = '<page-header current-user="currentUser"></page-header>';
      return testHelpers.TestDom.compileAndAppend(html, outerScope);
    }

    function stubConfigurationsService(returnValue) {
      sinon.stub(ConfigurationsService, 'getThemeConfigurationsObservable').
        returns(Rx.Observable.returnValue(returnValue));
    }

    it('should display if there is no configuration data', function() {
      stubConfigurationsService();
      var element = createPageHeader();
      expect(element).to.have.descendants('img');
      expect(element).to.have.descendants('.page-header-links');
      expect(element.find('.page-header-signin-link')).to.have.text('Sign In').to.have.attr('href').equal('/login?referer_redirect=1');
      expect(element.find('.page-header-signout-link')).to.have.text('Sign Out').to.have.attr('href').equal('/logout');
      expect(element.find('.page-header-signup-link')).to.have.text('Sign Up').to.have.attr('href').equal('/signup?referer_redirect=1');
    });

    it('should display if there is configuration data', function() {
      stubConfigurationsService(CUSTOM_CONFIGURATION);
      var element = createPageHeader();
      expect(element.find('img')).to.have.attr('src').equal('http://placekitten.com/g/500/200');
      expect(element.find('.page-header-signin-link')).to.have.text('Login').to.have.attr('href').equal('/login?referer_redirect=1');
      expect(element.find('.page-header-signout-link')).to.have.text('Logout').to.have.attr('href').equal('/logout');
      expect(element.find('.page-header-signup-link')).to.have.text('Register').to.have.attr('href').equal('/signup?referer_redirect=1');
    });

    describe('background color', function() {
      it('should set the background color if it is configured', function() {
        var customConfiguration = [{
          "name": "header_background_color",
          "value": "#deadbee"
        }];
        stubConfigurationsService(customConfiguration);
        var element = createPageHeader();
        expect(element.scope().pageHeaderStyle).to.eql({ 'background-color': "#deadbee" });
      });
    });

    describe('logged in', function() {

      it('should hide "logged in" links if not logged in', function() {
        stubConfigurationsService();
        var element = createPageHeader();
        expect(element.find('.page-header-signin-link')).to.not.have.class('ng-hide');
        expect(element.find('.page-header-signout-link')).to.have.class('ng-hide');
        expect(element.find('.page-header-signup-link')).to.not.have.class('ng-hide');
      });

      it('should show "logged in" links if logged in', function() {
        stubConfigurationsService();
        var element = createPageHeader(true);
        expect(element.find('.page-header-signin-link')).to.have.class('ng-hide');
        expect(element.find('.page-header-signout-link')).to.not.have.class('ng-hide');
        expect(element.find('.page-header-signup-link')).to.have.class('ng-hide');
      });

    });

  });

})();
