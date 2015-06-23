;var RichTextEditor = (function(window) {

  var _ATTRIBUTE_WHITELIST = {
    'a': ['href']
  };

  function RichTextEditor(element, editorId, preloadContent) {

    if (!_elementIsJQueryObject(element)) {
      throw new Error(
        '`element` argument must be a jQuery object.'
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

    if (typeof preloadContent !== 'undefined' && typeof preloadContent !== 'string') {
      throw new Error(
        '`preloadContent` must be a string (is of type ' +
        (typeof preloadContent) +
        ').'
      );
    }

    var _containerElement = element;
    var _preloadContent = null;
    var _editorElement = null;
    var _editor = null;
    var _formatController = null;
    var _lastActiveFormatsAsString = '';

    if (typeof preloadContent !== 'undefined') {
      _preloadContent = preloadContent;
    }

    _editor = _createEditor(_containerElement, editorId);

    /**
     * Public methods
     */

    this.destroy = function() {
      _editorElement.remove();
    }

    /**
     * Private methods
     */

    function _elementIsJQueryObject(el) {
      return el instanceof jQuery;
    }

    function _createEditor() {

      _containerElement.attr('data-editor-id', editorId);
      _editorElement = $('<iframe>');

      $(_editorElement).load(function (e) {

        _editor = new Squire(e.target.contentWindow.document);

        _formatController = new RichTextEditorFormatController(_editor);

        _editor.addEventListener(
          'input',
          _broadcastContentChange
        );

        _editor.addEventListener(
          'focus',
          _broadcastFocus
        );

        _editor.addEventListener(
          'focus',
          _broadcastFormatChange
        );

        _editor.addEventListener(
          'blur',
          _broadcastBlur
        );

        _editor.addEventListener(
          'select',
          _broadcastFormatChange
        );

        _editor.addEventListener(
          'pathChange',
          _broadcastFormatChange
        );

        _editor.addEventListener(
          'willPaste',
          _sanitizeClipboardInput
        );

        // Pre-load existing content (e.g. if we are editing an
        // existing resource).
        if (_preloadContent !== null) {
          _editor.setHTML(_preloadContent);
          _broadcastFormatChange();
        }

        _setupMouseMoveEventBroadcast();
      });

      _containerElement.append(_editorElement);
    }

    function _broadcastFocus(e) {

      var e = new CustomEvent(
        'rich-text-editor::focus-change',
        {
          detail: {
            id: editorId,
            content: true
          },
          bubbles: true
        }
      );

      _editorElement[0].dispatchEvent(e);
    }

    function _broadcastBlur(e) {

      var e = new CustomEvent(
        'rich-text-editor::focus-change',
        {
          detail: {
            id: editorId,
            content: false
          },
          bubbles: true
        }
      );

      _editorElement[0].dispatchEvent(e);
    }

    function _broadcastContentChange(e) {

      var e = new CustomEvent(
        'rich-text-editor::content-change',
        {
          detail: {
            id: editorId,
            content: _editor.getHTML()
          },
          bubbles: true
        }
      );

      _editorElement[0].dispatchEvent(e);
    }

    function _broadcastFormatChange(e) {

      var e = new CustomEvent(
        'rich-text-editor::format-change',
        {
          detail: {
            id: editorId,
            content: _formatController.getActiveFormats()
          },
          bubbles: true
        }
      );

      _editorElement[0].dispatchEvent(e);
    }

    function _sanitizeClipboardInput(e) {

      function _addWhitelistedAttributes(dirtyEl, cleanEl) {

        function _attributeIsAllowedForElement(nodeName, attributeName, attributeWhitelist) {
          return (
            attributeWhitelist.hasOwnProperty(nodeName) &&
            attributeWhitelist[nodeName].indexOf(attributeName) > -1
          );
        }

        var attributes = dirtyEl.attributes;
        var attributeCount = attributes.length;

        for (var i = 0; i < attributeCount; i++) {

          var attribute = attributes[i];

          var attributeIsAllowed = _attributeIsAllowedForElement(
            dirtyEl.nodeName.toLowerCase(),
            attribute.name.toLowerCase(),
            _ATTRIBUTE_WHITELIST
          );

          if (attributeIsAllowed) {
            cleanEl.setAttribute(attribute.name, attribute.value);
          }
        }
      }

      function _sanitizeElement(el, attributeWhitelist) {

        function _isSupportedHeaderElement(nodeName) {
          var supportedHeaderElements = ['h1', 'h2', 'h3', 'h4'];
          return supportedHeaderElements.indexOf(nodeName) > -1;
        }

        var nodeName = el.nodeName.toLowerCase();
        var cleanEl = null;
        var childNodes;
        var childEl;

        if (el.nodeType === 1) {

          // We want to collapse divs and spans into more meaningful
          // nodes so we ignore them and let their children accumulate
          // on the span's parent element.
          if (nodeName === 'div' || nodeName === 'span') {
            cleanEl = document.createDocumentFragment();
          } else if (_isSupportedHeaderElement(nodeName)) {
            cleanEl = document.createElement(nodeName);
          } else {

            if (nodeName === 'p') {
              cleanEl = document.createElement('div');
            } else if (nodeName === 'br') {
              cleanEl = document.createDocumentFragment();
            } else {
              cleanEl = document.createElement(nodeName);
            }
          }

          _addWhitelistedAttributes(el, cleanEl, attributeWhitelist);

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

      e.fragment = _sanitizeElement(e.fragment, _ATTRIBUTE_WHITELIST);
    }

    // See: http://stackoverflow.com/a/15318321
    function _setupMouseMoveEventBroadcast(){

      var iframe = _editorElement[0];
      var existingMosueMoveHandler = null;

      // Save any previous onmousemove handler
      var existingMouseMoveHandler = 
        (iframe.hasOwnProperty('contentWindow') &&
          iframe.contentWindow.hasOwnProperty('onmousemove')) ?
        iframe.contentWindow.onmousemove :
        false;

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
