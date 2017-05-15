import sinon from 'sinon';
import { expect, assert } from 'chai';
describe('Revert button', function() {
  'use strict';

  var testHelpers;
  var rootScope;

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    rootScope = $injector.get('$rootScope');
  }));

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  function createElement(pageHasChanges, revertInitiated) {

    var html = '<revert-button ng-click="revertPage()" page-has-changes="pageHasChanges" revert-initiated="revertInitiated"></revert-button>';
    var scope = rootScope.$new();

    scope.revertPage = sinon.spy(function() {
      return;
    });
    scope.pageHasChanges = pageHasChanges;
    scope.revertInitiated = revertInitiated;

    return testHelpers.TestDom.compileAndAppend(html, scope);

  }

  it('should be disabled when disabled by its parent', function() {

    var revertButton = createElement(false, false);

    assert.isTrue($(revertButton.find('button')).hasClass('disabled'));
  });

  it('should be working when the page has changes and the revert has been initiated', function() {

    var revertButton = createElement(true, true);

    assert.isTrue($(revertButton.find('button')).hasClass('working'));
  });

  it('should display a spinner when the page has changes and the revert has been initiated', function() {

    var revertButton = createElement(true, true);

    assert.lengthOf(revertButton.find('spinner'), 1);
  });

  it('should be enabled when the page has changes and the revert has not been initiated', function() {

    var revertButton = createElement(true, false);

    assert.isFalse($(revertButton.find('button')).hasClass('disabled'));
  });

  it('should call revertPage when clicked', function() {
    var revertButton = createElement(true, false);
    revertButton.scope().revertPage = sinon.spy();

    revertButton.click();

    sinon.assert.calledOnce(revertButton.scope().revertPage);
  });

});
