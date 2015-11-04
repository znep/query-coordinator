(function(root, $) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function _setupRichTextEditor($element, componentData, theme) {
    var editorId = _.uniqueId();
    var editor;

    utils.assertHasProperty(componentData, 'value');

    _setupPhantomEditor($element, componentData, theme);

    $element.addClass(utils.typeToClassNameForComponentType(componentData.type)).
      attr('data-editor-id', editorId);

    editor = storyteller.richTextEditorManager.createEditor(
      $element,
      editorId,
      componentData.value
    );

    editor.applyThemeClass(theme);

    $element.one('destroy', function() {
      storyteller.richTextEditorManager.deleteEditor(editorId);
    });
  }

  /**
   * @function _setupPhantomEditor
   * @description
   * A phantom editor is used on first render to determine the height
   * of the container (roughly) before the actual squire editor is rendered.
   *
   * This system avoids flying blocks on render.
   *
   * @param $element - The container element for this component.
   * @param componentData - The block component data used to render the HTML content.
   * @param theme - The current CSS theme to apply to the HTML content.
   */
  function _setupPhantomEditor($element, componentData, theme) {
    var $phantomContainer = $('<div>', {
      'class': 'theme-{0} {1}'.
        format(theme, storyteller.windowSizeBreakpointStore.getWindowSizeClass()),
      'style': 'font-size: {0}'.format(Constants.THEME_BASE_FONT_SIZE)
    });

    var $phantomContent = $('<div>', {
      'class': 'typeset squire-formatted'
    });

    $phantomContent.css({
      'visibility': 'hidden',
      'position': 'absolute'
    });

    $phantomContent.html(componentData.value);
    $phantomContainer.append($phantomContent);

    $element.append($phantomContainer);

    // Used as a signifier that the editor has loaded.
    $element.one('rich-text-editor::height-change', function() {
      $phantomContainer.remove();
    });
  }

  function _updateRichTextEditor($element, componentData, theme) {
    var editorId = $element.attr('data-editor-id');
    var editor = storyteller.richTextEditorManager.getEditor(editorId);

    utils.assertHasProperty(componentData, 'value');

    utils.assert(
      editor,
      'Cannot find the rich text editor associated with {0}.'.format(editorId)
    );

    editor.applyThemeClass(theme);
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
  function componentHTML(componentData, theme) {
    var $this = $(this);

    utils.assertHasProperty(componentData, 'type');
    utils.assert(
      componentData.type === 'html',
      'Cannot render components of type {0} with jQuery.componentHTML.'.format(componentData.type)
    );

    var needsEditorSetup = !$this.is('[data-editor-id]');

    if (needsEditorSetup) {
      _setupRichTextEditor($this, componentData, theme);
    } else {
      _updateRichTextEditor($this, componentData, theme);
    }

    return $this;
  }

  $.fn.componentHTML = componentHTML;
})(window, jQuery);
