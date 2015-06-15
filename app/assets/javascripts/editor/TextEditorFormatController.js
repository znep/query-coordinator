;var TextEditorFormatController = (function() {

  'use strict';

  function TextEditorFormatController(editor, formats) {

    if (!_editorIsSquireInstance(editor)) {
      throw new Error('`editor` argument is not an instance of Squire.');
    }

    var _editor = editor;
    var _formats = formats;

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
          _toggleHeading('h2');
          break;
        case 'heading2':
          _toggleHeading('h3');
          break;
        case 'heading3':
          _toggleHeading('h4');
          break;
        case 'heading4':
          _toggleHeading('h5');
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

    function _clearSelection() {

      var range = document.createRange();
      _editor.setSelection(range);
    }

    function _clearFormat(selection) {

      // Iterate over each supported format and manually clear it from
      // the selection.
      for (var i = 0; i < _formats.length; i++) {

        var tagName = _formats[i].tag;

        if (tagName !== null) {

          // Selection is optional and will be ignored by changeFormat if
          // it is falsey.
          _editor.changeFormat(
            false,
            { tag: tagName },
            selection
          );
        }
      }
    }

    function _toggleHeading(headingTag) {

      // If a range is not selected, this action should apply to the entire block.
      var selection = _editor.getSelection();
      if (selection.endOffset - selection.startOffset === 0) {
        selection.selectNodeContents(selection.startContainer);
      }

      _clearFormat(selection);

      if (_editor.hasFormat(headingTag)) {
        _editor.changeFormat(false, { tag: headingTag }, selection);
      } else {
        _editor.changeFormat({ tag: headingTag }, false, selection);
      }
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

  return TextEditorFormatController;
})();
