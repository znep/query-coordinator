import $ from 'jquery';
import _ from 'lodash';

import Constants from '../Constants';
import Environment from '../../StorytellerEnvironment';
import StorytellerUtils from '../../StorytellerUtils';
import { richTextEditorManager } from '../RichTextEditorManager';
import { windowSizeBreakpointStore } from '../stores/WindowSizeBreakpointStore';

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
$.fn.componentHTML = componentHTML;

/**
 * Props:
 *
 * In addition to the props listed in componentBase:
 * extraContentClasses
 */
export default function componentHTML(props) {
  props = _.extend({}, props, { editButtonSupported: false });
  const { componentData, theme, extraContentClasses } = props;

  StorytellerUtils.assertHasProperty(componentData, 'type');
  StorytellerUtils.assert(
    componentData.type === 'html',
    `componentHTML: Unsupported component type ${componentData.type}`
  );

  const needsEditorSetup = !this.is('[data-editor-id]');

  this.data('component-rendered-data', componentData); // Cache the data.

  if (needsEditorSetup) {
    _setupRichTextEditor(this, componentData, theme, extraContentClasses);
  } else {
    _updateRichTextEditor(this, componentData, theme);
  }

  this.componentBase(props);

  return this;
}

function _setupRichTextEditor($element, componentData, theme, extraContentClasses) {
  const editorId = _.uniqueId();

  StorytellerUtils.assertHasProperty(componentData, 'value');

  _setupPhantomEditor($element, componentData, theme);

  $element.append(
    $('<div>', {'class': 'component-blinder hidden'})
  );

  $element.addClass(StorytellerUtils.typeToClassNameForComponentType(componentData.type)).
    attr('data-editor-id', editorId);

  const editor = richTextEditorManager.createEditor(
    $element,
    editorId,
    componentData.value
  );

  _applyThemeFontIfPresent(editor, theme);
  editor.applyThemeClass(theme);

  $element.one('destroy', () => {
    richTextEditorManager.deleteEditor(editorId);
    // Disabling per EN-3593 (see below)
    // $element.off('rich-text-editor::content-change', _filterSpuriousContentChanges);
  });

  // EN-3593 Shift + Enter causes text to disappear in RTE
  //
  // Because `_filterSpuriousContentChanges()` will kill `rich-text-editor::content-change`
  // events before they make it to the Story Store and Story Renderer, and the `shift + enter`
  // key combination causes squire to insert a single `<br>` tag, the events necessary to
  // preserve and correctly render whitespace inserted this way were never making it to the
  // proper places.
  //
  // The solution appears to be to *not* filter 'spurious content changes'. The event hook
  // that would do so is therefore being commented out, but left in place in order to help
  // troubleshoot any future issues arising from its not being called.
  // $element.on('rich-text-editor::content-change', _filterSpuriousContentChanges);

  _.each(extraContentClasses, editor.addContentClass);
}

/* eslint-disable no-unused-vars */
function _filterSpuriousContentChanges(event) {
  // Make sure the content actually changed. Squire likes to twiddle <br>s.
  // We want to ignore these.

  const existingValueSignature = _.get($(this).data('component-rendered-data'), 'value', '').
    replace(/<br>/g, '');

  const newValueSignature = event.originalEvent.detail.content.
    replace(/<br>/g, '');

  if (existingValueSignature === newValueSignature) {
    event.stopPropagation();
  }
}
/* eslint-enable no-unused-vars */

/**
* @function _applyThemeFontIfPresent
* @description
* Applies the Google font code as the admin clicks through present custom themes in editor view.
*
* @param editor - The editor element
* @param {Object} theme - The current CSS theme to apply to the HTML content
*/
function _applyThemeFontIfPresent(editor, theme) {
  const customTheme = _.find(Environment.CUSTOM_THEMES, { 'id': parseInt(theme.replace('custom-', ''), 10) });

  if (_.has(customTheme, 'google_font_code')) {
    editor.applyThemeFont(customTheme.google_font_code);
  }
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
  const $phantomContainer = $('<div>', {
    'class': StorytellerUtils.format(
      'theme-{0} {1}', theme, windowSizeBreakpointStore.getWindowSizeClass()
    ),
    'style': StorytellerUtils.format(
      'font-size: {0}', Constants.THEME_BASE_FONT_SIZE
    )
  });

  const $phantomContent = $('<div>', {
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
  $element.one('rich-text-editor::height-change', () => {
    $phantomContainer.remove();
  });
}

function _updateRichTextEditor($element, componentData, theme) {
  const editorId = $element.attr('data-editor-id');
  const editor = richTextEditorManager.getEditor(editorId);

  StorytellerUtils.assertIsOneOfTypes(theme, 'string');
  StorytellerUtils.assertHasProperty(componentData, 'value');

  StorytellerUtils.assert(
    editor,
    `Cannot find the rich text editor associated with ${editorId}.`
  );

  _applyThemeFontIfPresent(editor, theme);
  editor.applyThemeClass(theme);
  editor.setContent(componentData.value);
}

