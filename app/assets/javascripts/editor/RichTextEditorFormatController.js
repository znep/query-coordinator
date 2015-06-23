;var RichTextEditorFormatController = (function() {

  'use strict';

  var _FORMATS = [
    { id: 'heading1', tag: 'h1', name: 'Heading 1', dropdown: true },
    { id: 'heading2', tag: 'h2', name: 'Heading 2', dropdown: true },
    { id: 'heading3', tag: 'h3', name: 'Heading 3', dropdown: true },
    { id: 'heading4', tag: 'h4', name: 'Heading 4', dropdown: true },
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

  function RichTextEditorFormatController(editor) {

    if (!_editorIsSquireInstance(editor)) {
      throw new Error('`editor` argument is not an instance of Squire.');
    }

    var _editor = editor;
    var _formats = _FORMATS;

    /**
     * Public methods
     */

    this.getActiveFormats = function() {

      function recordChildFormats(childNodes, supportedFormats, foundFormats) {

        var tagName;
        var format;

        for (var i = 0; i < childNodes.length; i++) {

          if (childNodes[i].nodeType === 1) {

            tagName = childNodes[i].nodeName.toLowerCase();
            format = supportedFormats.filter(function(format) {
              return format.tag === tagName;
            });

            if (format.length === 1 &&
              // Check that this format doesn't exist in accumulatedFormats here so
              // that we don't have to de-dupe later, although it probably could go
              // either way.
              foundFormats.indexOf(tagName) === -1) {

              foundFormats.push(format[0]);
            }

            recordChildFormats(childNodes[i].childNodes, supportedFormats, foundFormats);
          }
        }

        return foundFormats;
      }

      var selection = _editor.getSelection();
      var childNodes = selection.cloneContents().childNodes;
      var thisFormat;
      var foundFormats = [];

      // First record all the containing formats that are applied to the selection.
      for (var i = 0; i < _formats.length; i++) {

        thisFormat = _formats[i];

        if (thisFormat.tag !== null && _editor.hasFormat(thisFormat.tag)) {
          foundFormats.push(thisFormat);
        }
      }

      // Then record formats whose opening and closing tags both occur within the
      // selection.
      recordChildFormats(childNodes, _formats, foundFormats);

      return foundFormats;
    }

    this.execute = function(commandName, data) {

      switch (commandName) {
        case 'heading1':
          _toggleHeading('h1');
          break;
        case 'heading2':
          _toggleHeading('h2');
          break;
        case 'heading3':
          _toggleHeading('h3');
          break;
        case 'heading4':
          _toggleHeading('h4');
          break;
        case 'text':
          _clearFormat();
          break;
        case 'bold':
          _toggleBold();
          break;
        case 'italic':
          _toggleItalic();
          break;
        case 'left':
          _blockAlignLeft();
          break;
        case 'center':
          _blockAlignCenter();
          break;
        case 'right':
          _blockAlignRight();
          break;
        case 'orderedList':
          _toggleOrderedList();
          break;
        case 'unorderedList':
          _toggleUnorderedList();
          break;
        case 'blockquote':
          _toggleBlockquote();
          break;
        case 'addLink':
          _addLink(data);
          break;
        case 'removeLink':
          _removeLink();
          break;
        default:
          break;
      }
    }

    /**
     * Private methods
     */

    function _editorIsSquireInstance(editor) {
      return editor instanceof Squire;
    }

    function _elementIsBlockLevel(element) {

      var nodeName = element.nodeName.toLowerCase();
      var blockElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'p'];

      return blockElements.indexOf(nodeName) > -1;
    }

    function _updateBlockType(blockType) {

      _editor.modifyBlocks(function(blockFragment) {

        var newFragment = document.createDocumentFragment();
        var containerBlock = document.createElement(blockType);

        if (blockFragment.childNodes.length > 0) {

          var firstChild = blockFragment.childNodes[0];

          if (blockFragment.childNodes.length === 1 &&
            _elementIsBlockLevel(firstChild)) {

            var grandchildCount = firstChild.childNodes.length;

            for (var i = 0; i < grandchildCount; i++) {
              containerBlock.appendChild(firstChild.childNodes[i].cloneNode());
            }
          }
        } else {

          containerBlock.appendChild(blockFragment);
        }

        newFragment.appendChild(containerBlock);
        return newFragment;
      });
    }

    function _clearSelection() {

      var range = document.createRange();
      _editor.setSelection(range);
    }

    function _clearFormat(selection) {

      if (_editor.hasOwnProperty('removeAllFormatting')) {
        _editor.removeAllFormatting(selection);
      }

      _updateBlockType('div');
    }

    function _toggleHeading(headingTag) {

      _updateBlockType(headingTag);
    }

    function _toggleBold(headingTag) {

      if (_editor.hasFormat('b')) {
        _editor.removeBold();
      } else {
        _editor.bold();
      }
    }

    function _toggleItalic(headingTag) {

      if (_editor.hasFormat('i')) {
        _editor.removeItalic();
      } else {
        _editor.italic();
      }
    }

    function _blockAlignLeft() {

    };

    function _blockAlignCenter() {

    };

    function _blockAlignRight() {

    };

    function _toggleOrderedList() {

      if (_editor.hasFormat('ol')) {
        _editor.removeList();
      } else {
        _editor.makeOrderedList();
      }
    }

    function _toggleUnorderedList() {

      if (_editor.hasFormat('ul')) {
        _editor.removeList();
      } else {
        _editor.makeUnorderedList();
      }
    }

    function _toggleBlockquote() {

       if (_editor.hasFormat('blockquote')) {
        _editor.decreaseQuoteLevel();
       } else {
        _editor.increaseQuoteLevel();
       }
    }

    function _addLink(url) {
      _editor.makeLink(url);
    }

    function _removeLink() {
      _editor.removeLink();
    }

    function _hasLink() {
      return _editor.hasFormat('a');
    }
  }

  return RichTextEditorFormatController;
})();
