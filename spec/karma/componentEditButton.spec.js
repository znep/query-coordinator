describe('componentEditButton jQuery plugin', function() {
  'use strict';

  var $component;
  var storyteller = window.socrata.storyteller;

  beforeEach(function() {
    testDom.append('<div>');
    $component = testDom.children('div');
    $component.attr('data-block-id', standardMocks.validBlockId);
    $component.attr('data-component-index', 0);

    $component.componentEditButton();
  });

  it('should return a jQuery object for chaining', function() {
    assert.instanceOf($component.componentEditButton(), $, 'Returned value is not a jQuery collection');
  });

  it('dispatches Actions.ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED', function(done) {
    storyteller.dispatcher.register(function(payload) {
      if (payload.action === Actions.ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED) {
        assert.equal(payload.blockId, standardMocks.validBlockId);
        assert.equal(payload.componentIndex, 0);
        done();
      }
    });
    $component.find('.component-edit-controls-edit-btn').click();
  });
});
