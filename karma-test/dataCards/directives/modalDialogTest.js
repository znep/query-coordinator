(function() {
  'use strict';

  describe('modalDialog', function() {

    var testHelpers;
    var rootScope;

    beforeEach(module('dataCards'));
    beforeEach(module('dataCards.directives'));
    beforeEach(module('/angular_templates/dataCards/modalDialog.html'));

    beforeEach(inject(function($injector) {
      testHelpers = $injector.get('testHelpers');
      rootScope = $injector.get('$rootScope');
    }));

    function createModal() {
      var scope = rootScope.$new();
      var html = '<modal-dialog id="test-modal"></modal-dialog>';
      return {
        element: testHelpers.TestDom.compileAndAppend(html, scope),
        outerScope: scope,
        scope: scope.$$childHead
      };
    }

    it('should open in response to "modal-open" events that match the modal\'s id attribute', function() {
      var m = createModal();
      expect(m.element.find('.modal-container').is(':visible')).to.be.false;

      m.outerScope.$apply(function() {
        m.outerScope.$broadcast('modal-open', {id: 'test-modal'});
      });

      expect(m.element.find('.modal-container').is(':visible')).to.be.true;
    });

    it('should not open in response to "modal-open" events that do not match the modal\'s id attribute', function() {
      var m = createModal();
      expect(m.element.find('.modal-container').is(':visible')).to.be.false;

      m.outerScope.$apply(function() {
        m.outerScope.$broadcast('modal-open', {id: 'wrong-modal'});
      });

      expect(m.element.find('.modal-container').is(':visible')).to.be.false;
    });

    it('should close an open modal dialog when the "x" button is clicked', function() {
      var m = createModal();
      expect(m.element.find('.modal-container').is(':visible')).to.be.false;

      m.outerScope.$apply(function() {
        m.outerScope.$broadcast('modal-open', {id: 'test-modal'});
      });

      expect(m.element.find('.modal-container').is(':visible')).to.be.true;

      testHelpers.fireEvent(m.element.find('.modal-close-button')[0], 'click');

      expect(m.element.find('.modal-container').is(':visible')).to.be.false;    
    });

    it('should close an open modal dialog when the area outside the dialog is clicked', function() {
      var m = createModal();
      expect(m.element.find('.modal-container').is(':visible')).to.be.false;

      m.outerScope.$apply(function() {
        m.outerScope.$broadcast('modal-open', {id: 'test-modal'});
      });

      expect(m.element.find('.modal-container').is(':visible')).to.be.true;

      testHelpers.fireEvent(m.element.find('.modal-overlay')[0], 'click');

      expect(m.element.find('.modal-container').is(':visible')).to.be.false;    
    });

    xit('should close an open modal dialog when the escape key is pressed', function() {
      // TODO: Randy offers $40 bounty to make this test pass IN ALL BROWSERS... even LYNX
      var m = createModal();
      expect(m.element.find('.modal-container').is(':visible')).to.be.false;

      m.outerScope.$apply(function() {
        m.outerScope.$broadcast('modal-open', {id: 'test-modal'});
      });

      expect(m.element.find('.modal-container').is(':visible')).to.be.true;

      // I DON'T EVEN...
      $('body').trigger($.Event('keydown', { which: 27 }));

      expect(m.element.find('.modal-container').is(':visible')).to.be.false;    
    });

  });

})();
