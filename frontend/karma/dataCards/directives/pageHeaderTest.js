import sinon from 'sinon';
import { expect, assert } from 'chai';
const angular = require('angular');

describe('pageHeader', function() {
  'use strict';

  var ServerConfig;
  var testHelpers;
  var rootScope;

  var CUSTOM_CONFIGURATION = {
    'sign_in': 'Login',
    'sign_out': 'Logout',
    'sign_up': 'Register',
    'logo_url': 'http://placekitten.com/g/500/200'
  };

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

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
    window.currentUser = currentUser;
    var outerScope = rootScope.$new();
    var html = '<page-header></page-header>';
    return testHelpers.TestDom.compileAndAppend(html, outerScope);
  }

  function stubServerConfigGetTheme(returnValue) {
    sinon.stub(ServerConfig, 'getTheme').returns(returnValue);
  }

  it('should display if the feature flag is set to true', function() {
    stubServerConfigGetTheme();
    sinon.stub(ServerConfig, 'get').withArgs('show_newux_page_header').returns(true);

    var element = createPageHeader();
    assert.isFalse($(element.find('.page-header')).hasClass('ng-hide'));

    ServerConfig.get.restore();
  });

  it('should display if there is no configuration data', function() {
    stubServerConfigGetTheme();
    var element = createPageHeader();
    assert.lengthOf(element.find('img'), 1);
    assert.lengthOf(element.find('.page-header-links'), 1);
    var signin = element.find('.page-header-link-signin');
    var signout = element.find('.page-header-link-signout');
    var signup = element.find('.page-header-link-signup');
    assert.equal(signin.text(), 'Sign In');
    assert.equal(signout.text(), 'Sign Out');
    assert.equal(signup.text(), 'Sign Up');
    assert.equal(signin.attr('href'), '/login?referer_redirect=1');
    assert.equal(signout.attr('href'), '/logout');
    assert.equal(signup.attr('href'), '/signup?referer_redirect=1');
  });

  it('should display if there is configuration data', function() {
    stubServerConfigGetTheme(CUSTOM_CONFIGURATION);
    var element = createPageHeader();
    var signin = element.find('.page-header-link-signin');
    var signout = element.find('.page-header-link-signout');
    var signup = element.find('.page-header-link-signup');
    assert.equal(element.find('img').attr('src'), 'http://placekitten.com/g/500/200');
    assert.equal(signin.text(), 'Login');
    assert.equal(signout.text(), 'Logout');
    assert.equal(signup.text(), 'Register');
    assert.equal(signin.attr('href'), '/login?referer_redirect=1');
    assert.equal(signout.attr('href'), '/logout');
    assert.equal(signup.attr('href'), '/signup?referer_redirect=1');
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
      assert.isFalse($(element.find('.page-header-link-signin')).hasClass('ng-hide'));
      assert.isTrue($(element.find('.page-header-link-signout')).hasClass('ng-hide'));
      assert.isFalse($(element.find('.page-header-link-signup')).hasClass('ng-hide'));
    });

    it('should show "logged in" links if logged in', function() {
      stubServerConfigGetTheme();
      var element = createPageHeader(true);
      assert.isTrue(element.find('.page-header-link-signin').hasClass('ng-hide'));
      assert.isFalse($(element.find('.page-header-link-signout')).hasClass('ng-hide'));
      assert.isTrue(element.find('.page-header-link-signup').hasClass('ng-hide'));
    });

  });

});
