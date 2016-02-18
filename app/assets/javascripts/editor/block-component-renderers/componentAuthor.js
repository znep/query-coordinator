(function(root, $) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function _synthesizeImageData(componentData) {
    var image = _.get(componentData, 'value.image', {
      url: '/images/large-profile.png',
      documentId: null
    });

    return {
      type: 'image',
      value: image
    };
  }

  function _synthesizeBlurbData(componentData) {
    return {
      type: 'html',
      value: _.get(componentData, 'value.blurb', '')
    };
  }

  function _updateBlurb(event) {
    event.stopPropagation(); // Otherwise StoryRenderer will attempt to treat this as an HTML component.

    var blurbContent = event.originalEvent.detail.content;

    var blockId = utils.findClosestAttribute(event.target, 'data-block-id');
    var componentIndex = utils.findClosestAttribute(event.target, 'data-component-index');

    var value = storyteller.storyStore.getBlockComponentAtIndex(blockId, componentIndex).value;
    _.set(value, 'blurb', blurbContent);

    storyteller.dispatcher.dispatch({
      action: Actions.BLOCK_UPDATE_COMPONENT,
      blockId: blockId,
      componentIndex: componentIndex,
      type: 'author',
      value: value
    });
  }

  function _updateHeight() {
    var $this = $(this);
    var editorHeight = 0;
    var imageHeight = $this.find('.author-image').height();
    var $blurb = $this.find('.author-blurb');
    var negativeTextPadding = parseInt($blurb.css('margin-top'), 10);

    var editorId = $this.find('[data-editor-id]').
      attr('data-editor-id');

    var editor = storyteller.richTextEditorManager.getEditor(editorId);
    if (editor) {
      editorHeight = editor.getContentHeight();
      $this.find('.component-html iframe').height(editorHeight);
    }

    $this.height(Math.max(editorHeight + negativeTextPadding, imageHeight));
  }

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
  function componentAuthor(componentData, theme, options) {

    utils.assertHasProperties(componentData, 'type');
    utils.assert(
      componentData.type === 'author',
      'componentImage: Unsupported component type {0}'.format(
        componentData.type
      )
    );

    function _onDataChanged() {
      _updateHeight.call(this);
    }

    function _onFirstRender() {
      this.append($('<div>', { class: 'author-image col2' }));
      this.append($('<div>', { class: 'author-blurb col10' }));

      this.on('rich-text-editor::content-change', _updateBlurb);
      this.on('rich-text-editor::height-change component::height-change', _updateHeight);

      this.one('destroy', function() {
        $(this).find('.author-image, .author-blurb').trigger('destroy');
        $(this).off('rich-text-editor::content-change', _updateBlurb);
        $(this).off('rich-text-editor::height-change component::height-change', _updateHeight);
      });
    }

    var myOptions = _.extend({}, options, { editMode: false }); // Delegating edit mode to children.
    this.componentBase(componentData, theme, myOptions, _onFirstRender, _onDataChanged);

    this.addClass(utils.typeToClassNameForComponentType(componentData.type));

    // Defer to child renderers.
    this.find('.author-image').componentImage(
      _synthesizeImageData(componentData),
      theme,
      options
    );
    this.find('.author-blurb').componentHTML(
      _synthesizeBlurbData(componentData),
      theme,
      _.extend({}, options, { extraContentClass: 'remove-top-margin' })
    );


    return this;
  }

  $.fn.componentAuthor = componentAuthor;
})(window, jQuery);
