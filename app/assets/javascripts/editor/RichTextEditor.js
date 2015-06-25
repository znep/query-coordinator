;var RichTextEditor = (function(window) {

  'use strict';

  var _ATTRIBUTE_WHITELIST = {
    'a': ['href']
  };

  /**
   * @constructor
   * @param {jQuery} element
   * @param {string} editorId
   * @param {AssetFinder} assetFinder
   * @param {string} [contentToPreload] - The content that should be inserted
   *   into the newly-created editor.
   */
  function RichTextEditor(element, editorId, assetFinder, formats, contentToPreload) {

    if (!(element instanceof jQuery)) {
      throw new Error(
        '`element` argument must be a jQuery object (is of type ' +
        (typeof element) +
        ').'
      );
    }

    if (element.length === 0) {
      throw new Error(
        '`element` did not match any DOM nodes.'
      );
    }

    if (element.length > 1) {
      throw new Error(
        '`element` matches more than one DOM node.'
      );
    }

    if (typeof editorId !== 'number' && typeof editorId !== 'string') {
      throw new Error(
        '`editorId` must be a number or a string (is of type ' +
        (typeof editorId) +
        ').'
      );
    }

    if (!(assetFinder instanceof AssetFinder)) {
      throw new Error(
        '`assetFinder` must be an AssetFinder (is of type ' +
        (typeof assetFinder) +
        ').'
      );
    }

    if (!(formats instanceof Array)) {
      throw new Error(
        '`formats` must be an array (is of type ' +
        (typeof formats) +
        ').'
      );
    }

    if (typeof contentToPreload !== 'undefined' && typeof contentToPreload !== 'string') {
      throw new Error(
        '`contentToPreload` must be a string (is of type ' +
        (typeof contentToPreload) +
        ').'
      );
    }

    var _containerElement = element;
    var _assetFinder = assetFinder;
    var _formats = formats;
    var _contentToPreload = null;
    // _editor is the Squire instance.
    var _editor = null;
    // _editorElement is the <iframe> associated with the Squire instance.
    var _editorElement = null;
    var _formatController = null;
    var _lastContentHeight = 0;
    var _lastActiveFormatsAsString = '';

    if (typeof contentToPreload !== 'undefined') {
      _contentToPreload = contentToPreload;
    }

    _editor = _createEditor();

    /**
     * Public methods
     */

    this.getContentHeight = function() {
      return _lastContentHeight;
    };

    this.getFormatController = function() {
      return _formatController;
    };

    /**
     * This method assumes that jQuery's .remove() function will correctly
     * remove any event listeners attached to _editorElement or any of its
     * children.
     */
    this.destroy = function() {
      _editorElement.remove();
    };

    /**
     * Private methods
     */

    function _createEditor() {

      _containerElement.attr('data-editor-id', editorId);
      _editorElement = $('<iframe>');

      $(_editorElement).load(function (e) {

        _overrideDefaultStyles(e.target.contentWindow.document);
        _editor = new Squire(e.target.contentWindow.document);
        _formatController = new RichTextEditorFormatController(
          _editor,
          _formats
        );

        _editor.addEventListener('input', _handleContentChange);
        _editor.addEventListener('focus', _broadcastFocus);
        _editor.addEventListener('focus', _broadcastFormatChange);
        _editor.addEventListener('blur', _broadcastBlur);
        _editor.addEventListener('select', _broadcastFormatChange);
        _editor.addEventListener('pathChange', _broadcastFormatChange);
        _editor.addEventListener('willPaste', _sanitizeClipboardInput);

        // Pre-load existing content (e.g. if we are editing an
        // existing resource).
        if (_contentToPreload !== null) {
          _editor.setHTML(_contentToPreload);
          _broadcastFormatChange();
        }

        _setupMouseMoveEventBroadcast();
        _handleContentChange();
      });

      _containerElement.append(_editorElement);
    }

    /**
     * Since we will want to override the default browser styles but we are
     * programmatically creating the iframe, we dynamically insert a link tag
     * that points to our override stylesheet once the iframe element has been
     * instantiated.
     *
     * Because we need to access the iframe's `contentWindow.document.head` in
     * order to append a node to the internal document's head, however, we must
     * wait until the iframe's internal document has actually loaded.
     */
    function _overrideDefaultStyles(document) {

      // Prevent flash of unstyled text by setting opacity to zero
      // and then overriding it in the stylesheet.
      $(document.body).css('opacity', 0);

      var styleEl = document.createElement('link');
      styleEl.setAttribute('rel', 'stylesheet');
      styleEl.setAttribute('type', 'text/css');
      styleEl.setAttribute(
        'href',
        _assetFinder.getStyleAssetPath('rich-text-editor-iframe')
      );
      styleEl.onload = function(){ _handleContentChange(); }

      document.head.appendChild(styleEl);
    }

    /**
     * This function is called whenever the content of the editor changes.
     * We need to respond to content changes for two reasons:
     *
     * 1. To adjust the height of the editor element, which is accomplished
     *    by calculating the height of the iframe's internal body and then
     *    alerting the containing scope of the need to re-render (which will
     *    query each text editor for its current height in order to keep the
     *    container elements' heights consistent with the heights of the
     *    editors' content heights).
     * 2. Alert the data layer that the component content associated with this
     *    editor has changed and that it should respond accordingly.
     *
     * In a future refactor, these two purposes might be unified by causing
     * changes to the model to directly trigger a re-render.
     */
    function _handleContentChange() {

      var bodyElement = $(_editor.getDocument()).find('body');
      // These calculations have a tendency to be extremely inconsistent
      // if the internal elements and/or the body have both a top and bottom
      // margin or padding. By adding a margin-bottom to block-level elements
      // and a padding-top to the body itself the browser's layout seems to
      // become a lot more consistent, which translates directly into the
      // height the iframe's content being consistently calculated correctly.
      //
      // I have no idea why having both a top and bottom modifier on the layout
      // of block elements causes things to get so fiddly.
      var contentHeight = parseInt(bodyElement.css('padding-top'), 10);

      // We need to recalculate the height of each individual element rather
      // than just checking the outerHeight of the body because the body
      // height has a tendency of getting out of sync with the visible height
      // of its child elements when you, e.g., add a new line and then delete
      // it. Weird, I know.
      bodyElement.
        children().
        each(function() {
          contentHeight += $(this).outerHeight(true);
        });

      // Sub-pixel heights and other iframe weirdness can sometimes cause
      // the scrollbar to appear with a tiny distance to scroll.
      // Adding one to the computed content height seems to solve this and
      // is more or less imperceptible.
      contentHeight += 1;

      if (contentHeight !== _lastContentHeight) {
        _lastContentHeight = contentHeight;
        _broadcastHeightChange();
      }
      _broadcastContentChange();
    }

    function _emitEvent(name, payload) {

      var eventDetail = {
        id: editorId
      };

      if (typeof payload === 'object') {
        for (var prop in payload) {
          if (prop !== 'id' && payload.hasOwnProperty(prop)) {
            eventDetail[prop] = payload[prop];
          }
        }
      }

      _editorElement[0].dispatchEvent(
        new CustomEvent(
          name,
          { detail: eventDetail, bubbles: true }
        )
      );
    }

    function _broadcastHeightChange() {
      _emitEvent('rich-text-editor::height-change');
    }

    function _broadcastContentChange(e) {
      _emitEvent(
        'rich-text-editor::content-change',
        { content: _editor.getHTML() }
      );
    }

    function _broadcastFormatChange(e) {
      _emitEvent(
        'rich-text-editor::format-change',
        { content: _formatController.getActiveFormats() }
      );
    }

    function _broadcastFocus(e) {
      _emitEvent('rich-text-editor::focus-change', { content: true });
    }

    function _broadcastBlur(e) {
      _emitEvent('rich-text-editor::focus-change', { content: false });
    }

    /**
     * Handles the 'willPaste' event emitted by Squire.
     *
     * The event object will include a `fragment` property which is a
     * document-fragment.
     *
     * This function recursively descends the document-fragment and performs
     * a whitelisting filter operation on the fragment's child nodes.
     * This filter operation will replace non-header block elements with divs
     * and collapse nested container elements into single divs. This is often
     * necessary because the whitelist strips most element attributes and the
     * semantic value of multiple nested divs with different classes, for
     * example, is lost in the process.
     *
     * Note that we mutate the value of e.fragment, which is inserted
     * by Squire into the text editor document at the cursror location
     * after this function returns.
     *
     * @param {Event} e
     *   @prop {DocumentFragment} fragment
     */
    function _sanitizeClipboardInput(e) {

      var _copyWhitelistedAttributes = function(dirtyEl, cleanEl) {

        // This function checks the attribute whitelist on a tag-by-tag
        // basis to determine whether or not the specified element
        // attribute should be copied from the 'dirty' element received
        // from the clipboard into the 'clean' element that will be
        // inserted into the editor iframe's internal document.
        var _attributeIsAllowed = function(nodeName, attrName, whitelist) {
          return (
            whitelist.hasOwnProperty(nodeName) &&
            whitelist[nodeName].indexOf(attrName) > -1
          );
        };
        var attributes = dirtyEl.attributes;
        var attributeCount = attributes.length;

        for (var i = 0; i < attributeCount; i++) {

          var attribute = attributes[i];

          var attributeIsAllowed = _attributeIsAllowed(
            dirtyEl.nodeName.toLowerCase(),
            attribute.name.toLowerCase(),
            _ATTRIBUTE_WHITELIST
          );

          if (attributeIsAllowed) {
            cleanEl.setAttribute(attribute.name, attribute.value);
          }
        }
      };

      function _sanitizeElement(el, attributeWhitelist) {

        var _isHeaderElement = function(nodeName) {
          return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].indexOf(nodeName) > -1;
        };
        var nodeName = el.nodeName.toLowerCase();
        var cleanEl = null;
        var childNodes;
        var childEl;

        // Node Types
        //
        // var Node = {
        //   ELEMENT_NODE                :  1,
        //   ATTRIBUTE_NODE              :  2,
        //   TEXT_NODE                   :  3,
        //   CDATA_SECTION_NODE          :  4,
        //   ENTITY_REFERENCE_NODE       :  5,
        //   ENTITY_NODE                 :  6,
        //   PROCESSING_INSTRUCTION_NODE :  7,
        //   COMMENT_NODE                :  8,
        //   DOCUMENT_NODE               :  9,
        //   DOCUMENT_TYPE_NODE          : 10,
        //   DOCUMENT_FRAGMENT_NODE      : 11,
        //   NOTATION_NODE               : 12
        // };
        if (el.nodeType === 1) {

          if (_isHeaderElement(nodeName)) {
            cleanEl = document.createElement(nodeName);
          } else if (nodeName === 'div' || nodeName === 'span' || nodeName === 'br') {
            // We want to collapse divs and spans into more meaningful
            // nodes so we ignore them and let their children accumulate
            // on the span's parent element.
            cleanEl = document.createDocumentFragment();
          } else if (nodeName === 'p') {
            cleanEl = document.createElement('div');
          } else {
            cleanEl = document.createElement(nodeName);
          }

          _copyWhitelistedAttributes(el, cleanEl, attributeWhitelist);
        } else if (el.nodeType === 3) {
          cleanEl = document.createTextNode(el.textContent);
        } else if (el.nodeType === 11) {
          cleanEl = document.createDocumentFragment();
        }

        if (cleanEl !== null) {

          childNodes = el.childNodes;

          for (var i = 0; i < childNodes.length; i++) {

            childEl = _sanitizeElement(childNodes[i]);

            if (childEl !== null) {
              cleanEl.appendChild(childEl);
            }
          }
        }

        return cleanEl;
      }

      // See function documentation above for:
      //
      // 1. Why this value is reassigned here
      // 2. Why there is no return value
      e.fragment = _sanitizeElement(e.fragment, _ATTRIBUTE_WHITELIST);
    }

    // See: http://stackoverflow.com/a/15318321
    function _setupMouseMoveEventBroadcast(){

      var iframe = _editorElement[0];
      var existingMosueMoveHandler = null;

      // Save any previous onmousemove handler
      var existingMouseMoveHandler = false;

      if (iframe.hasOwnProperty('contentWindow') &&
        iframe.contentWindow.hasOwnProperty('onmousemove')) {

        existingMouseMoveHandler = iframe.contentWindow.onmousemove;
      }

      iframe.contentWindow.onmousemove = function(e) {

        // Fire any existing onmousemove listener 
        if (existingMouseMoveHandler) {
          existingMouseMoveHandler(e);
        }

        // Create a new event for the this window
        var evt = document.createEvent('MouseEvents');

        // We'll need this to offset the mouse move appropriately
        var boundingClientRect = iframe.getBoundingClientRect();

        // Initialize the event, copying exiting event values
        // for the most part
        evt.initMouseEvent( 
          'mousemove', 
          true, // bubbles
          false, // not cancelable 
          window,
          e.detail,
          e.screenX,
          e.screenY, 
          e.clientX + boundingClientRect.left, 
          e.clientY + boundingClientRect.top, 
          e.ctrlKey, 
          e.altKey,
          e.shiftKey, 
          e.metaKey,
          e.button, 
          null // no related element
        );

        // Dispatch the mousemove event on the iframe element
        iframe.dispatchEvent(evt);
      };
    }
  }

  return RichTextEditor;
})(window);
