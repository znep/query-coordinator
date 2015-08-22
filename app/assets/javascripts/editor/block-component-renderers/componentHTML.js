(function(root, $) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function _setupRichTextEditor($element, componentData) {
    var editorId = _.uniqueId();

    utils.assertHasProperty(componentData, 'value');

    $element.addClass(utils.typeToClassNameForComponentType(componentData.type)).
      attr('data-editor-id', editorId);

    storyteller.richTextEditorManager.createEditor(
      $element,
      editorId,
      componentData.value
    );

    $element.one('destroy', function() {
      storyteller.richTextEditorManager.deleteEditor(editorId);
    });
  }

  function _updateRichTextEditor($element, componentData) {
    var editorId = $element.attr('data-editor-id');
    var editor = storyteller.richTextEditorManager.getEditor(editorId);

    utils.assertHasProperty(componentData, 'value');

    utils.assert(
      editor,
      'Cannot find the rich text editor associated with {0}.'.format(editorId)
    );

    editor.setContent(componentData.value);
  }

  /**
   * @function componentHTML
   * @description
   * Creates a RichTextEditor, and handles setups and updates.
   *
   * Triggers:
   * - rich-text-editor::format-change
   * - rich-text-editor::content-change
   * - rich-text-editor::height-change
   * TODO: Should revisit how components notify StoryRenderer of changed component values..
   * Events:
   * - destory: Tears down the component, i.e. calls deleteEditor on richTextEditorManager
   * @param {object} componentData - An object with a type and value attribute
   * @returns {jQuery} - The rendered layout jQuery element
   */
  function componentHTML(componentData) {
    var $this = $(this);

    utils.assertHasProperty(componentData, 'type');
    utils.assert(
      componentData.type === 'html',
      'Cannot render components of type {0} with jQuery.componentHTML.'.format(componentData.type)
    );

    var needsEditorSetup = !$this.is('[data-editor-id]');

    if (needsEditorSetup) {
      _setupRichTextEditor($this, componentData);
    } else {
      _updateRichTextEditor($this, componentData);
    }

    return $this;
  }

  $.fn.componentHTML = componentHTML;
})(window, jQuery);
