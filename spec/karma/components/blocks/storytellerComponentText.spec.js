describe('StorytellerComponentText jQuery plugin', function() {
  'use strict';

  var node;
  var storyteller = window.socrata.storyteller;

  beforeEach(function() {
    node = testDom.append('<div>');
    storyteller.RichTextEditorManagerMocker.mock();
  });

  afterEach(function() {
    storyteller.RichTextEditorManagerMocker.unmock();
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { node.storytellerComponentText(); });
    assert.throws(function() { node.storytellerComponentText(1); });
    assert.throws(function() { node.storytellerComponentText(null); });
    assert.throws(function() { node.storytellerComponentText(undefined); });
    assert.throws(function() { node.storytellerComponentText({}); });
    assert.throws(function() { node.storytellerComponentText([]); });
  });

  it('should throw when not passed a component type', function() {
    assert.throws(function() { node.storytellerComponentText({value: 'any'}); });
  });

  it('should throw when not passed a component type that is not text', function() {
    assert.throws(function() { node.storytellerComponentText({type: 'invalid', value: 'any'}); });
  });

  describe('given a valid component type and value', function() {
    var element;
    var editorId;
    var initialValue = 'testing';
    var component = {type: 'text', value: initialValue};

    beforeEach(function() {
      storyteller.RichTextEditorManagerMocker.reset();
      element = node.storytellerComponentText(component);
      editorId = element.attr('data-editor-id');
    });

    it('should return a jQuery object for chaining', function() {
      assert.isTrue($.fn.isPrototypeOf(element), 'Returned value is not a jQuery collection');
    });

    it('sets the data-editor-id attribute on the element', function() {
      assert.isTrue(element.is('[data-editor-id]'));
    });

    it('calls createEditor on richTextEditorManager', function () {
      sinon.assert.calledWith(storyteller.RichTextEditorManagerMocker.createEditorSpy, element, editorId, initialValue);
    });

    describe('that is then destroyed', function () {
      it('should call deleteEditor on richTextEditorManager', function () {
        sinon.assert.notCalled(storyteller.RichTextEditorManagerMocker.deleteEditorSpy);

        // It should be safe to destroy multiple times.
        element.trigger('destroy').trigger('destroy');

        sinon.assert.calledOnce(storyteller.RichTextEditorManagerMocker.deleteEditorSpy);
        sinon.assert.calledWithExactly(storyteller.RichTextEditorManagerMocker.deleteEditorSpy, editorId);
      });
    });

    describe('that is then updated', function () {
      it('calls setContent on the correct editor instance', function () {
        var newValue = 'something';

        element.storytellerComponentText({type: 'text', value: newValue});
        sinon.assert.calledWith(storyteller.RichTextEditorManagerMocker.getEditorSpy, editorId);
        sinon.assert.calledWith(storyteller.RichTextEditorManagerMocker.setContentSpy, newValue);
      });
    });
  });
});
