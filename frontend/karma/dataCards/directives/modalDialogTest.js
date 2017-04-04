import { expect, assert } from 'chai';
const angular = require('angular');

describe('modalDialog', function() {
  'use strict';

  var testHelpers;
  var rootScope;

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));
  require('app/styles/dataCards/modal-dialog.scss');

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
    assert.isFalse(modal.element.find('.modal-container').is(':visible'));

    modal.outerScope.$apply(function() {
      modal.outerScope.state.show = true;
    });

    assert.isTrue(modal.element.find('.modal-container').is(':visible'));
  });

  it('should close an open modal dialog when the "x" button is clicked', function() {
    var modal = createModal(true);
    assert.isTrue(modal.element.find('.modal-container').is(':visible'));

    testHelpers.fireEvent(modal.element.find('.modal-close-button')[0], 'click');

    assert.isFalse(modal.element.find('.modal-container').is(':visible'));
  });

  it('should close an open modal dialog when the area outside the dialog is clicked', function() {
    var modal = createModal(true);

    expect(modal.element.find('.modal-container').is(':visible')).to.equal(true);

    modal.element.find('.modal-overlay').click();
    modal.scope.$digest();

    expect(modal.element.find('.modal-container').is(':visible')).to.equal(false);
  });

  it('should toggle the class ".disabled" on the dialog close button when disableCloseDialog is toggled', function() {
    var modal = createModal(true);

    modal.scope.state.disableCloseDialog = true;
    modal.scope.$digest();
    assert.isTrue(modal.element.find('.modal-close-button').hasClass('disabled'));

    modal.scope.state.disableCloseDialog = false;
    modal.scope.$digest();
    assert.isFalse(modal.element.find('.modal-close-button').hasClass('disabled'));
  });

  it('should not close the modal when dialogState.disableCloseDialog is true', function() {
    var modal = createModal(true);

    expect(modal.element.find('.modal-container').is(':visible')).to.equal(true);

    modal.scope.state.disableCloseDialog = true;
    modal.element.find('.modal-overlay').click();
    modal.scope.$digest();

    expect(modal.element.find('.modal-container').is(':visible')).to.equal(true);

    modal.scope.state.disableCloseDialog = false;
    modal.element.find('.modal-overlay').click();
    modal.scope.$digest();

    expect(modal.element.find('.modal-container').is(':visible')).to.equal(false);
  });

  it('should close an open modal dialog when the escape key is pressed', function() {
    // TODO: Randy offers $40 bounty to make this test pass IN ALL BROWSERS... even LYNX
    var modal = createModal(true);

    assert.isTrue(modal.element.find('.modal-container').is(':visible'));

    // Try some normal keys first and make sure they don't trigger the close
    $('body').trigger($.Event('keydown', { which: 'a'.charCodeAt(0) }));
    modal.scope.$digest();
    assert.isTrue(modal.element.find('.modal-container').is(':visible'));
    $('body').trigger($.Event('keydown', { which: '~'.charCodeAt(0) }));
    modal.scope.$digest();
    assert.isTrue(modal.element.find('.modal-container').is(':visible'));

    $('body').trigger($.Event('keydown', { which: 27 }));
    modal.scope.$digest();

    assert.isFalse(modal.element.find('.modal-container').is(':visible'));
  });

  describe('two dialogs at once', function() {
    it('should close only the topmost when the escape key is pressed', function() {
      var modal1 = createModal(true);
      var modal2 = createModal(true);
      modal2.element.addClass('second');

      var overlay1 = modal1.element.find('.modal-overlay');
      var overlay2 = modal2.element.find('.modal-overlay');

      expect(parseInt(overlay1.css('z-index'), 10)).
        to.be.below(parseInt(overlay2.css('z-index'), 10));

      assert.isTrue(overlay1.is(':visible'));
      assert.isTrue(overlay2.is(':visible'));

      $('body').trigger($.Event('keydown', { which: 27 }));
      modal1.outerScope.$digest();

      assert.isTrue(overlay1.is(':visible'));
      assert.isFalse(overlay2.is(':visible'));

      $('body').trigger($.Event('keydown', { which: 27 }));
      modal1.outerScope.$digest();

      assert.isFalse(overlay1.is(':visible'));
      assert.isFalse(overlay2.is(':visible'));
    });

    it('should close only the topmost when the modal overlay is clicked', function() {
      var modal1 = createModal(true);
      var modal2 = createModal(true);
      modal2.element.addClass('second');

      var overlay1 = modal1.element.find('.modal-overlay');
      var overlay2 = modal2.element.find('.modal-overlay');

      expect(parseInt(overlay1.css('z-index'), 10)).
        to.be.below(parseInt(overlay2.css('z-index'), 10));

      assert.isTrue(overlay1.is(':visible'));
      assert.isTrue(overlay2.is(':visible'));

      overlay2.click();
      modal1.outerScope.$digest();

      assert.isTrue(overlay1.is(':visible'));
      assert.isFalse(overlay2.is(':visible'));

      overlay1.click();
      modal1.outerScope.$digest();

      assert.isFalse(overlay1.is(':visible'));
      assert.isFalse(overlay2.is(':visible'));
    });
  });
});
