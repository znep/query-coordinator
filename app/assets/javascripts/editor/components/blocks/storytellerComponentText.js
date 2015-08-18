(function (root, $) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function _setupRichTextEditor(element, componentData) {
    var editorId = _.uniqueId();

    element.addClass('text-editor').attr('data-editor-id', editorId);

    storyteller.richTextEditorManager.createEditor(
      element,
      editorId,
      componentData.value
    );

    element.one('destroy', function() {
      storyteller.richTextEditorManager.deleteEditor(editorId);
    });
  }

  function _updateRichTextEditor(element, componentData) {
    var editorId = element.attr('data-editor-id');
    var editor = storyteller.richTextEditorManager.getEditor(editorId);

    editor.setContent(componentData.value);
  }

  /**
   * @function storytellerComponentText
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
  function storytellerComponentText(componentData) {
    var self = $(this);

    utils.assertHasProperty(componentData, 'type');
    utils.assertHasProperty(componentData, 'value');

    if (componentData.type !== 'text') {
      throw new Error('Cannot render components of type {0} with $.storytellerComponentText.'.format(componentData.type));
    }

    var needsEditorSetup = !self.is('[data-editor-id]');

    if (needsEditorSetup) {
      _setupRichTextEditor(self, componentData);
    } else {
      _updateRichTextEditor(self, componentData);
    }

    return this;
  }

  $.fn.storytellerComponentText = storytellerComponentText;
})(window, jQuery);
