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

    function createModal(show) {
      var scope = rootScope.$new();
      scope.state = {show: show};
      var html = '<modal-dialog dialog-state="state" id="test-modal"></modal-dialog>';
      return {
        element: testHelpers.TestDom.compileAndAppend(html, scope),
        outerScope: scope,
        scope: scope.$$childHead
      };
    }

    it('should open when the scope state.show is set to true', function() {
      var modal = createModal(false);
      expect(modal.element.find('.modal-container').is(':visible')).to.be.false;

      modal.outerScope.$apply(function() {
        modal.outerScope.state.show = true;
      });

      expect(modal.element.find('.modal-container').is(':visible')).to.be.true;
    });

    it('should close an open modal dialog when the "x" button is clicked', function() {
      var modal = createModal(true);
      expect(modal.element.find('.modal-container').is(':visible')).to.be.true;

      testHelpers.fireEvent(modal.element.find('.modal-close-button')[0], 'click');

      expect(modal.element.find('.modal-container').is(':visible')).to.be.false;    
    });

    it('should close an open modal dialog when the area outside the dialog is clicked', function() {
      var modal = createModal(true);

      expect(modal.element.find('.modal-container').is(':visible')).to.be.true;

      testHelpers.fireMouseEvent(modal.element.find('.modal-overlay')[0], 'mouseup');

      expect(modal.element.find('.modal-container').is(':visible')).to.be.false;    
    });

    it('should close an open modal dialog when the escape key is pressed', function() {
      // TODO: Randy offers $40 bounty to make this test pass IN ALL BROWSERS... even LYNX
      var modal = createModal(true);

      expect(modal.element.find('.modal-container').is(':visible')).to.be.true;

      // Try some normal keys first and make sure they don't trigger the close
      $('body').trigger($.Event('keydown', { which: 'a'.charCodeAt(0) }));
      expect(modal.element.find('.modal-container').is(':visible')).to.be.true;
      $('body').trigger($.Event('keydown', { which: '~'.charCodeAt(0) }));
      expect(modal.element.find('.modal-container').is(':visible')).to.be.true;

      $('body').trigger($.Event('keydown', { which: 27 }));

      expect(modal.element.find('.modal-container').is(':visible')).to.be.false;    
    });

  });

})();
