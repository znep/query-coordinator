describe('componentEditButton jQuery plugin', function() {
  'use strict';

  var $component;
  var storyteller = window.socrata.storyteller;

  beforeEach(function() {
    testDom.append('<div>');
    $component = testDom.children('div');
    $component.attr('data-block-id', standardMocks.validBlockId);
    $component.attr('data-component-index', 0);
  });

  it('should return a jQuery object for chaining', function() {
    assert.instanceOf($component.componentEditButton(), $, 'Returned value is not a jQuery collection');
  });

  describe('not in edit mode', function() {
    it('should have no effect', function() {
      var originalHtml = $component.html();
      $component.componentEditButton(); // empty options = default to non-edit mode
      assert.equal($component.html(), originalHtml);
    });
  });

  describe('in edit mode', function() {
    beforeEach(function() {
      $component.componentEditButton(null, null, { editMode: true });
    });

    describe('edit button', function() {
      it('dispatches Actions.ASSET_SELECTOR_EDIT_EXISTING', function(done) {
        storyteller.dispatcher.register(function(payload) {
          if (payload.action === Actions.ASSET_SELECTOR_EDIT_EXISTING) {
            assert.equal(payload.blockId, standardMocks.validBlockId);
            assert.equal(payload.componentIndex, 0);
            done();
          }
        });
        $component.find('.component-edit-controls-edit-btn').click();
      });
    });
  });
});
