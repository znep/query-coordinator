import $ from 'jquery';
import _ from 'lodash';

import '../componentBase';
import './componentImage';
import './componentHTML';
import Actions from '../Actions';
import StorytellerUtils from '../../StorytellerUtils';
import { assert, assertHasProperties } from 'common/js_utils';
import { storyStore } from '../stores/StoryStore';
import { dispatcher } from '../Dispatcher';
import { richTextEditorManager } from '../RichTextEditorManager';

/**
 * Creates or updates an author component.
 * based on the componentData, theme, and options.
 *
 * @param {object} componentData - Data for author block. See below.
 * @param {string} theme - Theme name. Currently not used.
 * @param {object} options - Renderer settings. Optional. See below.
 *
 *
 * TODO
 * Sample componentData:
 *  {
 *    type: "author",
 *    value: {
 *      blurb: '<p>This author is in such and such department</p>',
 *      image: { // Just a componentImage data blob.
 *        documentId: '1234',
 *        url: 'https://bucket-name.s3.amazonaws.com/uploads/random/image.jpg'
 *      }
 *    }
 *  }
 *
 * Supported options (default):
 *  - editMode (false): If true, renders an edit button on hover. The edit button
 *    dispatches Actions.ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED.
 */
$.fn.componentAuthor = componentAuthor;

export default function componentAuthor(props) {
  props = _.extend({}, props, {
    dataChangedCallback: onDataChanged,
    firstRenderCallback: onFirstRender
  });

  const { componentData, theme, blockId, componentIndex } = props;

  assertHasProperties(componentData, 'type');
  assert(
    componentData.type === 'author',
    `componentAuthor: Unsupported component type ${componentData.type}`
  );

  function onDataChanged(newComponentData) {
    updateHeight.call(this);
    updateImage.call(this, newComponentData);
  }

  function onFirstRender() {
    const blurb = $('<div>', { class: 'author-blurb col10' });
    const imageData = synthesizeImageData(componentData);
    const imageContainer = $('<div>', { class: 'author-image col2 component-image' });
    const image = $('<img>', { src: imageData.value.url });

    this.
      attr('data-url', imageData.value.url).
      append([imageContainer.append(image), blurb]);

    this.on('rich-text-editor::content-change', updateBlurb);
    this.on('rich-text-editor::height-change component::height-change', updateHeight);

    this.one('destroy', function() {
      $(this).find('.author-image, .author-blurb').trigger('destroy');
      $(this).off('rich-text-editor::content-change', updateBlurb);
      $(this).off('rich-text-editor::height-change component::height-change', updateHeight);
    });
  }

  this.
    componentBase(props).
    addClass(StorytellerUtils.typeToClassNameForComponentType(componentData.type)).
    find('.author-blurb').componentHTML({
      blockId,
      componentIndex,
      theme,
      extraContentClasses: ['remove-top-margin'],
      componentData: synthesizeBlurbData(componentData)
    });

  return this;
}

function synthesizeImageData(componentData) {
  const image = _.get(componentData, 'value.image', {
    url: '/images/large-profile.png',
    documentId: null
  });

  return {
    type: 'image',
    value: image
  };
}

function synthesizeBlurbData(componentData) {
  return {
    type: 'html',
    value: _.get(componentData, 'value.blurb', '')
  };
}

function updateImage(componentData) {
  const imageData = synthesizeImageData(componentData);
  const url = $(this).attr('data-url');

  if (imageData.value.url !== url) {
    $(this).attr('data-url', imageData.value.url);
    $(this).find('.author-image img').attr('src', imageData.value.url);
  }
}

function updateBlurb(event) {
  event.stopPropagation(); // Otherwise StoryRenderer will attempt to treat this as an HTML component.

  const { blockId, componentIndex } = StorytellerUtils.findBlockIdAndComponentIndex(event.target);
  const blurbContent = event.originalEvent.detail.content;

  const value = storyStore.getBlockComponentAtIndex(blockId, componentIndex).value;
  _.set(value, 'blurb', blurbContent);

  dispatcher.dispatch({
    action: Actions.BLOCK_UPDATE_COMPONENT,
    blockId: blockId,
    componentIndex: componentIndex,
    type: 'author',
    value: value
  });
}

function updateHeight() {
  let editorHeight = 0;
  const $this = $(this);
  const imageHeight = $this.find('.author-image').height();
  const $blurb = $this.find('.author-blurb');
  const negativeTextPadding = parseInt($blurb.css('margin-top'), 10);

  const editorId = $this.find('[data-editor-id]').
    attr('data-editor-id');

  const editor = richTextEditorManager.getEditor(editorId);

  if (editor) {
    editorHeight = editor.getContentHeight();
    $this.find('.component-html iframe').height(editorHeight);
  }

  $this.height(Math.max(editorHeight + negativeTextPadding, imageHeight));
}
