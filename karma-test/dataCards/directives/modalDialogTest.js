(function() {
  'use strict';

  describe('modalDialog', function() {

    var testHelpers;
    var rootScope;

    beforeEach(module('dataCards'));
    beforeEach(module('dataCards.directives'));
    beforeEach(module('/angular_templates/dataCards/modalDialog.html'));
    beforeEach(module('dataCards/modal-dialog.sass'));

    beforeEach(inject(function($injector) {
      testHelpers = $injector.get('testHelpers');
      rootScope = $injector.get('$rootScope');
    }));

    afterEach(function() {
      testHelpers.TestDom.clear();
    });

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

      expect(modal.element.find('.modal-container').is(':visible')).to.equal(true);

      modal.element.find('.modal-overlay').click();
      modal.scope.$digest();

      expect(modal.element.find('.modal-container').is(':visible')).to.equal(false);
    });

    it('should close an open modal dialog when the escape key is pressed', function() {
      // TODO: Randy offers $40 bounty to make this test pass IN ALL BROWSERS... even LYNX
      var modal = createModal(true);

      expect(modal.element.find('.modal-container').is(':visible')).to.be.true;

      // Try some normal keys first and make sure they don't trigger the close
      $('body').trigger($.Event('keydown', { which: 'a'.charCodeAt(0) }));
      modal.scope.$digest();
      expect(modal.element.find('.modal-container').is(':visible')).to.be.true;
      $('body').trigger($.Event('keydown', { which: '~'.charCodeAt(0) }));
      modal.scope.$digest();
      expect(modal.element.find('.modal-container').is(':visible')).to.be.true;

      $('body').trigger($.Event('keydown', { which: 27 }));
      modal.scope.$digest();

      expect(modal.element.find('.modal-container').is(':visible')).to.be.false;
    });

    describe('two dialogs at once', function() {
      it('should close only the topmost when the escape key is pressed', function() {
        var modal1 = createModal(true);
        var modal2 = createModal(true);
        modal2.element.addClass('second');

        var overlay1 = modal1.element.find('.modal-overlay');
        var overlay2 = modal2.element.find('.modal-overlay');

        expect(parseInt(overlay1.css('z-index'), 10)).to.be.below(
          parseInt(overlay2.css('z-index'), 10));

        expect(overlay1.is(':visible')).to.be.true;
        expect(overlay2.is(':visible')).to.be.true;

        $('body').trigger($.Event('keydown', { which: 27 }));
        modal1.outerScope.$digest();

        expect(overlay1.is(':visible')).to.be.true;
        expect(overlay2.is(':visible')).to.be.false;

        $('body').trigger($.Event('keydown', { which: 27 }));
        modal1.outerScope.$digest();

        expect(overlay1.is(':visible')).to.be.false;
        expect(overlay2.is(':visible')).to.be.false;
      });

      it('should close only the topmost when the modal overlay is clicked', function() {
        var modal1 = createModal(true);
        var modal2 = createModal(true);
        modal2.element.addClass('second');

        var overlay1 = modal1.element.find('.modal-overlay');
        var overlay2 = modal2.element.find('.modal-overlay');

        expect(parseInt(overlay1.css('z-index'), 10)).to.be.below(
          parseInt(overlay2.css('z-index'), 10));

        expect(overlay1.is(':visible')).to.be.true;
        expect(overlay2.is(':visible')).to.be.true;

        overlay2.click();
        modal1.outerScope.$digest();

        expect(overlay1.is(':visible')).to.be.true;
        expect(overlay2.is(':visible')).to.be.false;

        overlay1.click();
        modal1.outerScope.$digest();

        expect(overlay1.is(':visible')).to.be.false;
        expect(overlay2.is(':visible')).to.be.false;
      });
    });

  });

})();
