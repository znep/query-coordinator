(function(root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;

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

    if (!(assetFinder instanceof storyteller.AssetFinder)) {
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

    var self = this;
    var _containerElement = element;
    var _assetFinder = assetFinder;
    var _formats = formats;
    var _contentToPreload = null;
    // _editor is the Squire instance.
    var _editor = null;
    // _editorElement is the <iframe> associated with the Squire instance.
    var _editorElement = null;
    var _editorBodyElement = null;
    var _formatController = null;
    var _lastContentHeight = 0;

    if (typeof contentToPreload !== 'undefined') {
      _contentToPreload = contentToPreload;
    }

    _createEditor();

    /**
     * Public methods
     */

    this.getFormatController = function() {
      return _formatController;
    };

    this.getContent = function() {
      if (_editor) {
        return _editor.getHTML();
      }
    };

    /**
     * Sets the content of the editor.
     * Does not treat the new content as a user-initiated
     * action. If this is not your intention, use a StoryStore action
     * to set the content instead.
     *
     * The practical implication of this not being treated as a
     * user-initiated action is that any sanitization will not be
     * re-broadcast as a content change (so it doesn't end up in undo-redo).
     */
    this.setContent = function(content) {

      if (_editor === null) {
        // Our iframe hasn't loaded yet.
        // Save the content so it is preloaded
        // once the iframe loads.
        _contentToPreload = content;
        return;
      }

      var contentIsDifferent = (
        _editor.getHTML().replace(/<br>/g, '') !==
        content.replace(/<br>/g, '')
      );

      if (_editor && contentIsDifferent) {
        _editor.setHTML(content);
        _handleContentChange();
      }
    };

    this.getContentHeight = function() {
      return _lastContentHeight;
    };

    // Add a `themeName` class to the html root of the iframe
    this.applyThemeClass = function(theme) {
      var htmlElement = _editorElement[0].contentDocument.documentElement;
      var currentClasses = htmlElement ? htmlElement.getAttribute('class') : null;

      if (currentClasses) {
        var newClassList = _.reject(
          htmlElement.getAttribute('class').split(' '),
          function(className) {
            return _.startsWith(className, 'theme-');
          }
        );

        newClassList.push('theme-{0}'.format(theme));

        htmlElement.setAttribute('class', newClassList.join(' '));
        _updateContentHeight();
      }
    };

    /**
     * This method assumes that jQuery's .remove() function will correctly
     * remove any event listeners attached to _editorElement or any of its
     * children.
     */
    this.destroy = function() {
      storyteller.windowSizeBreakpointStore.removeChangeListener(_applyWindowSizeClass);
      _editorElement.remove();
    };

    /**
     * Private methods
     */

    function _createEditor() {

      _containerElement.attr('data-editor-id', editorId);
      _editorElement = $('<iframe>');

      $(_editorElement).load(function(e) {

        _addThemeStyles(e.target.contentWindow.document);
        _editor = new Squire(e.target.contentWindow.document);
        _editorBodyElement = $(_editor.getDocument()).find('body');
        _formatController = new storyteller.RichTextEditorFormatController(
          _editor,
          _formats
        );

        _editor.addEventListener('input', _handleContentChangeByUser);
        _editor.addEventListener('focus', _broadcastFocus);
        _editor.addEventListener('focus', _broadcastFormatChange);
        _editor.addEventListener('blur', _broadcastBlur);
        _editor.addEventListener('select', _broadcastFormatChange);
        _editor.addEventListener('pathChange', _broadcastFormatChange);
        _editor.addEventListener('willPaste', function(e) {
          _sanitizeClipboardInput(e);
          _handleContentChangeByUser();
        });
        _editor.addEventListener('drop', function() {
          // We get no opportunity to edit the dropped content, so sanitize everything.
          _sanitizeCurrentContent();
          _handleContentChangeByUser();
        });

        // Pre-load existing content (e.g. if we are editing an
        // existing resource).
        if (_contentToPreload !== null) {
          _editor.setHTML(_contentToPreload);
          _broadcastFormatChange();
        }

        _setupMouseMoveEventBroadcast();

        storyteller.windowSizeBreakpointStore.addChangeListener(_applyWindowSizeClass);
        _applyWindowSizeClass();
      });

      _containerElement.append(_editorElement);
    }

    function _applyWindowSizeClass() {
      var editorDocument = _editorElement[0].contentDocument;

      if (!editorDocument) {
        return;
      }

      var windowSizeClass = storyteller.windowSizeBreakpointStore.getWindowSizeClass();
      var unusedWindowSizeClasses = storyteller.windowSizeBreakpointStore.getUnusedWindowSizeClasses();

      $(editorDocument.documentElement).
        removeClass(unusedWindowSizeClasses.join(' ')).
        addClass(windowSizeClass);
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
    function _addThemeStyles(document) {
      // Prevent flash of unstyled text by setting opacity to zero
      // and then overriding it in the stylesheet.
      $(document.body).
        css('opacity', 0).
        addClass('typeset squire-formatted');

      var styleEl = document.createElement('link');
      styleEl.setAttribute('rel', 'stylesheet');
      styleEl.setAttribute('type', 'text/css');
      styleEl.setAttribute(
        'href',
        _assetFinder.getStyleAssetPath('themes')
      );

      // There seems to be a race condition in Firefox whereby the onload
      // event triggers before all styles have been applied to the DOM.
      // This manifests itself as the bottom padding on elements not always
      // being taken into account in the height calculation done in
      // _handleContentChange().
      //
      // For the time being I am getting around that issue by letting the
      // browser have 10ms to finalize its layout before invoking
      // _handleContentChange(), which seems to do the trick. This delay
      // is small enough that it should be imperceptible to users.
      styleEl.onload = function() {
        setTimeout(function() {
            _updateContentHeight();
            _broadcastHeightChange();
            $(document.body).css('opacity', '');
          },
          10
        );
      };

      document.head.appendChild(styleEl);
    }

    /**
     * Handles changes to content, whether or not they're initiated by the user.
     */
    function _handleContentChange() {
      _updateContentHeight();
    }

    /**
     * Handles changes to content that have been explicitly initiated by the user.
     */
    function _handleContentChangeByUser() {
      _handleContentChange();
      _broadcastContentChangeWhenSettled();
    }

    /**
     * This function is called whenever the content of the editor changes.
     * We need to respond to content changes to adjust the height of the editor
     * element, which is accomplished by calculating the height of the iframe's
     * internal body and then alerting the containing scope of the need to re-
     * render (which will query each text editor for its current height in
     * order to keep the container elements' heights consistent with the heights
     * of the editors' content heights).
     */
    function _updateContentHeight() {

      // These calculations have a tendency to be extremely inconsistent
      // if the internal elements and/or the body have both a top and bottom
      // margin or padding. By adding a margin-bottom to block-level elements
      // and a padding-top to the body itself the browser's layout seems to
      // become a lot more consistent, which translates directly into the
      // height the iframe's content being consistently calculated correctly.
      //
      // I have no idea why having both a top and bottom modifier on the layout
      // of block elements causes things to get so fiddly.
      var contentHeight = parseInt(_editorBodyElement.css('padding-top'), 10);

      // We need to recalculate the height of each individual element rather
      // than just checking the outerHeight of the body because the body
      // height has a tendency of getting out of sync with the visible height
      // of its child elements when you, e.g., add a new line and then delete
      // it. Weird, I know.
      _editorBodyElement.
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
      }
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
        new storyteller.CustomEvent(
          name,
          { detail: eventDetail, bubbles: true }
        )
      );
    }

    function _broadcastHeightChange() {
      _emitEvent(
        'rich-text-editor::height-change'
      );
    }

    /**
     * Broadcast rich-text-editor::content-change when this function stops being called for a while.
     * Ideally we'd know exactly when it's safe to broadcast this event, but unfortunately different
     * input scenarios (typing, pasting, dragging, browser-level undo-redo) have completely different
     * ordering/presence of squire events (input, willPaste, drop, etc). This wouldn't be a problem, but
     * we can't leak intermediate unsanitized content (otherwise it would show up in undo/redo buffers).
     * Instead of maintaining a huge brittle state machine, we bite the async bullet and broadcast
     * the event when things settle down for a frame. This guaranees that all pasting, dropping,
     * typing, and (critically) sanitization have run.
     */
    var _broadcastContentChangeWhenSettled = _.debounce(_broadcastContentChangeNow, 1);

    function _broadcastContentChangeNow() {
      _emitEvent(
        'rich-text-editor::content-change',
        { content: _editor.getHTML() }
      );
    }

    function _broadcastFormatChange() {
      _emitEvent(
        'rich-text-editor::format-change',
        { content: _formatController.getActiveFormats() }
      );
    }

    function _broadcastFocus() {
      _emitEvent('rich-text-editor::focus-change', { content: true });
    }

    function _broadcastBlur() {
      _emitEvent('rich-text-editor::focus-change', { content: false });
    }

    /**
     * Handles the 'willPaste' event emitted by Squire.
     *
     * The event object will include a `fragment` property which is a
     * document-fragment.
     *
     * e.fragment represents the content that was pasted. By mutating it,
     * we can control what gets inserted into the DOM. We take this opportunity
     * to sanitize the content.
     *
     * @param {Event} e
     *   @prop {DocumentFragment} fragment
     */
    function _sanitizeClipboardInput(e) {
      e.fragment = storyteller.Sanitizer.sanitizeElement(e.fragment);
    }

    /**
     * Passes the content currently in the edfitor through Sanitizer.
     */
    function _sanitizeCurrentContent() {
      // Get the content and sanitize it.
      var iframe = _editorElement[0];
      var sanitized = storyteller.Sanitizer.sanitizeElement(iframe.contentWindow.document.body);

      // Insert the sanitized content into a div so we can get the HTML.
      var div = document.createElement('div');
      div.appendChild(sanitized.cloneNode(true));

      // Set the new content.
      _editor.setHTML(div.innerHTML);
    }

    // See: http://stackoverflow.com/a/15318321
    function _setupMouseMoveEventBroadcast() {

      var iframe = _editorElement[0];

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

  root.socrata.storyteller.RichTextEditor = RichTextEditor;
})(window);
