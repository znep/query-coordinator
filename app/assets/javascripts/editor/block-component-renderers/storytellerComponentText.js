(function (root, $) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function _setupRichTextEditor($element, componentData, themeId) {
    var editorId = _.uniqueId();
    var editor;

    utils.assertHasProperty(componentData, 'value');

    $element.addClass('text-editor').attr('data-editor-id', editorId);

    editor = storyteller.richTextEditorManager.createEditor(
      $element,
      editorId,
      componentData.value
    );
    editor.applyThemeClass(themeId);

    $element.one('destroy', function() {
      storyteller.richTextEditorManager.deleteEditor(editorId);
    });
  }

  function _updateRichTextEditor($element, componentData, themeId) {
    var editorId = $element.attr('data-editor-id');
    var editor = storyteller.richTextEditorManager.getEditor(editorId);

    utils.assertHasProperty(componentData, 'value');

    utils.assert(
      editor,
      'Cannot find the rich text editor associated with {0}.'.format(editorId)
    );

    editor.setContent(componentData.value);
    editor.applyThemeClass(themeId);
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
  function storytellerComponentText(componentData, themeId) {
    var $self = $(this);

    utils.assertHasProperty(componentData, 'type');
    utils.assert(
      componentData.type === 'text',
      'Cannot render components of type {0} with jQuery.storytellerComponentText.'.format(componentData.type)
    );

    var needsEditorSetup = !$self.is('[data-editor-id]');

    if (needsEditorSetup) {
      _setupRichTextEditor($self, componentData, themeId);
    } else {
      _updateRichTextEditor($self, componentData, themeId);
    }

    return $self;
  }

  $.fn.storytellerComponentText = storytellerComponentText;
})(window, jQuery);
