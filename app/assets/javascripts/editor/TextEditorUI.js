;var TextEditorUI = (function() {

  var _FORMATS = [
    { id: 'heading1', tag: 'h2', name: 'Heading 1', dropdown: true },
    { id: 'heading2', tag: 'h3', name: 'Heading 2', dropdown: true },
    { id: 'heading3', tag: 'h4', name: 'Heading 3', dropdown: true },
    { id: 'heading4', tag: 'h5', name: 'Heading 4', dropdown: true },
    { id: 'text', tag: null, name: 'Paragraph', dropdown: true },
    { id: 'bold', tag: 'b', name: 'Bold', dropdown: false, group: 0 },
    { id: 'italic', tag: 'i', name: 'Italic', dropdown: false, group: 0 },
    { id: 'left', tag: 'p', name: 'Align Left', dropdown: false, group: 1 },
    { id: 'center', tag: 'p', name: 'Center', dropdown: false, group: 1 },
    { id: 'right', tag: 'p', name: 'Align Right', dropdown: false, group: 1 },
    { id: 'orderedList', tag: 'ol', name: 'Ordered List', dropdown: false, group: 2 },
    { id: 'unorderedList', tag: 'ul', name: 'Unordered List', dropdown: false, group: 2 },
    { id: 'blockquote', tag: 'blockquote', name: 'Block Quote', dropdown: false, group: 2 },
    { id: 'link', tag: 'a', name: 'Link', dropdown: false, group: 3 }
  ];

  function TextEditorUI(element, editorId, preloadContent) {

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
        '`editorId` must be a number or a string (is a ' +
        (typeof editorId) +
        ').'
      );
    }

    if (typeof preloadContent !== 'undefined' && typeof preloadContent !== 'string') {
      throw new Error(
        '`preloadContent` must be a string (is a ' +
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

      //_editorElement.on('load', function(e) {

        _editor = new Squire(e.target.contentWindow.document);

        _formatController = new TextEditorFormatController(
          _editor,
          _FORMATS
        );

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
        'TextEditorUI::focus-change',
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
        'TextEditorUI::focus-change',
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
        'TextEditorUI::content-change',
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
        'TextEditorUI::format-change',
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

    // See: http://stackoverflow.com/a/15318321
    function _setupMouseMoveEventBroadcast(){

      var iframe = _editorElement[0];
      var existingMosueMoveHandler = null;

      // Save any previous onmousemove handler
      var existingMouseMoveHandler = 
        (iframe.hasOwnProperty('contentWindow') && iframe.contentWindow.hasOwnProperty('onmousemove')) ?
        iframe.contentWindow.onmousemove : false;

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

  return TextEditorUI;
})();
