describe('componentHTML jQuery plugin', function() {
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
    assert.throws(function() { $component.componentHTML(); });
    assert.throws(function() { $component.componentHTML(1); });
    assert.throws(function() { $component.componentHTML(null); });
    assert.throws(function() { $component.componentHTML(undefined); });
    assert.throws(function() { $component.componentHTML({}); });
    assert.throws(function() { $component.componentHTML([]); });
  });

  it('should throw when not passed a component type', function() {
    assert.throws(function() { $component.componentHTML({value: 'any'}); });
  });

  it('should throw when passed a component type that is not Storyteller.Text', function() {
    assert.throws(function() { $component.componentHTML({type: 'invalid', value: 'any'}); });
  });

  describe('given a valid component type and value', function() {
    var editorId;
    var initialValue = 'testing';
    var componentData = {type: 'html', value: initialValue};
    var theme = 'classic';

    beforeEach(function() {
      storyteller.RichTextEditorManagerMocker.reset();
      $component = $component.componentHTML(componentData, theme);
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

    it('calls applyThemeClass during editor creation', function () {
      sinon.assert.calledWith(storyteller.RichTextEditorManagerMocker.applyThemeClassSpy, theme);
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

        $component.componentHTML({type: 'html', value: newValue});
        sinon.assert.calledWith(storyteller.RichTextEditorManagerMocker.getEditorSpy, editorId);
        sinon.assert.calledWith(storyteller.RichTextEditorManagerMocker.setContentSpy, newValue);
      });
    });
  });
});
