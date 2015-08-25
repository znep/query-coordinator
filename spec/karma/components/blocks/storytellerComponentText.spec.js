describe('storytellerComponentText jQuery plugin', function() {
  'use strict';

  var $component;
  var storyteller = window.socrata.storyteller;

  beforeEach(function() {
    testDom.append('<div>');
    $component = testDom.children('div');
    storyteller.RichTextEditorManagerMocker.mock();
  });

  afterEach(function() {
    storyteller.RichTextEditorManagerMocker.unmock();
  });

  it('should throw when passed invalid arguments', function() {
    assert.throws(function() { $component.storytellerComponentText(); });
    assert.throws(function() { $component.storytellerComponentText(1); });
    assert.throws(function() { $component.storytellerComponentText(null); });
    assert.throws(function() { $component.storytellerComponentText(undefined); });
    assert.throws(function() { $component.storytellerComponentText({}); });
    assert.throws(function() { $component.storytellerComponentText([]); });
  });

  it('should throw when not passed a component type', function() {
    assert.throws(function() { $component.storytellerComponentText({value: 'any'}); });
  });

  it('should throw when passed a component type that is not text', function() {
    assert.throws(function() { $component.storytellerComponentText({type: 'invalid', value: 'any'}); });
  });

  describe('given a valid component type and value', function() {
    var editorId;
    var initialValue = 'testing';
    var componentData = {type: 'text', value: initialValue};
    var themeId = 'classic';

    beforeEach(function() {
      storyteller.RichTextEditorManagerMocker.reset();
      $component = $component.storytellerComponentText(componentData, themeId);
      editorId = $component.attr('data-editor-id');
    });

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, jQuery);
    });

    it('sets the data-editor-id attribute on the $component', function() {
      assert.isTrue($component.is('[data-editor-id]'));
    });

    it('calls createEditor on richTextEditorManager', function () {
      sinon.assert.calledWith(storyteller.RichTextEditorManagerMocker.createEditorSpy, $component, editorId, initialValue);
    });

    it('calls setTheme during editor creation', function () {
      sinon.assert.calledWith(storyteller.RichTextEditorManagerMocker.setThemeSpy, themeId);
    });

    describe('that is then destroyed', function () {
      it('should call deleteEditor on richTextEditorManager', function () {
        sinon.assert.notCalled(storyteller.RichTextEditorManagerMocker.deleteEditorSpy);

        // It should be safe to destroy multiple times.
        $component.trigger('destroy').trigger('destroy');

        sinon.assert.calledOnce(storyteller.RichTextEditorManagerMocker.deleteEditorSpy);
        sinon.assert.calledWithExactly(storyteller.RichTextEditorManagerMocker.deleteEditorSpy, editorId);
      });
    });

    describe('that is then updated', function () {
      it('calls setContent on the correct editor instance', function () {
        var newValue = 'something';

        $component.storytellerComponentText({type: 'text', value: newValue});
        sinon.assert.calledWith(storyteller.RichTextEditorManagerMocker.getEditorSpy, editorId);
        sinon.assert.calledWith(storyteller.RichTextEditorManagerMocker.setContentSpy, newValue);
      });
    });
  });
});
