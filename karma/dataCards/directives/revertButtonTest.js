(function() {
  'use strict';

  describe('Revert button', function() {

    var testHelpers;
    var rootScope;

    beforeEach(module('dataCards'));

    beforeEach(function() {
      module('/angular_templates/dataCards/revertButton.html');
      module('/angular_templates/dataCards/spinner.html');
    });

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

      expect(revertButton.find('button')).to.have.class('disabled');
    });

    it('should be working when the page has changes and the revert has been initiated', function() {

      var revertButton = createElement(true, true);

      expect(revertButton.find('button')).to.have.class('working');
    });

    it('should display a spinner when the page has changes and the revert has been initiated', function() {

      var revertButton = createElement(true, true);

      expect(revertButton.find('spinner')).to.exist;
    });

    it('should be enabled when the page has changes and the revert has not been initiated', function() {

      var revertButton = createElement(true, false);

      expect(revertButton.find('button')).to.not.have.class('disabled');
    });

    it('should call revertPage when clicked', function() {
      var revertButton = createElement(true, false);
      revertButton.scope().revertPage = sinon.spy();

      revertButton.click();

      expect(revertButton.scope().revertPage).to.have.been.called;
    });

  });

})();
