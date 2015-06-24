;var RichTextEditorFormatController = (function() {

  'use strict';

  var _FORMATS = [
    { id: 'heading1', tag: 'h1', name: 'Heading 1', dropdown: true },
    { id: 'heading2', tag: 'h2', name: 'Heading 2', dropdown: true },
    { id: 'heading3', tag: 'h3', name: 'Heading 3', dropdown: true },
    { id: 'heading4', tag: 'h4', name: 'Heading 4', dropdown: true },
    { id: 'heading5', tag: 'h5', name: 'Heading 5', dropdown: true },
    { id: 'heading6', tag: 'h6', name: 'Heading 6', dropdown: true },
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

  /**
   * @constructor
   * @param {Squire} editor
   */
  function RichTextEditorFormatController(editor) {

    if (!(editor instanceof Squire)) {
      throw new Error('`editor` argument is not an instance of Squire.');
    }

    var _editor = editor;
    var _formats = _FORMATS;
    var _commandDispatcher = {
      'heading1': function() { _toggleHeading('h1'); },
      'heading2': function() { _toggleHeading('h2'); },
      'heading3': function() { _toggleHeading('h3'); },
      'heading4': function() { _toggleHeading('h4'); },
      'heading5': function() { _toggleHeading('h5'); },
      'heading6': function() { _toggleHeading('h6'); },
      'text': function() { _clearFormat(); },
      'bold': function() { _toggleBold(); },
      'italic': function() { _toggleItalic(); },
      'left': function() { _blockAlignLeft(); },
      'center': function() { _blockAlignCenter(); },
      'right': function() { _blockAlignRight(); },
      'orderedList': function() { _toggleOrderedList(); },
      'unorderedList': function() { _toggleUnorderedList(); },
      'blockquote': function() { _toggleBlockquote(); },
      'addLink': function(data) { _addLink(data); },
      'removeLink': function() { _removeLink(); }
    };

    /**
     * Public methods
     */

    /**
     * Execute a formatting command.
     *
     * @param {string} commandName
     * @param {string} [data] - An optional data parameter (such as URL)
     */
    this.execute = function(commandName, data) {
      if (_commandDispatcher.hasOwnProperty(commandName)) {
        _commandDispatcher[commandName](data);
      }
    };

    /**
     * This method iterates over the current selection (or, if there is no
     * selection, the node that contains the cursor) to accumulate a list of
     * all the styles that are currently active.
     *
     * This list is used to decide which buttons in the UI to mark as active.
     */
    this.getActiveFormats = function() {

      // Recursively descend the DocumentFragment representing the current
      // selection.
      var _recordChildFormats = function(children, supported, found) {

        var child;
        var tagName;
        var format;

        for (var i = 0; i < childNodes.length; i++) {

          child = children[i];

          if (child.nodeType === 1) {

            tagName = child.nodeName.toLowerCase();
            format = supported.filter(function(format) {
              return format.tag === tagName;
            });

            // Check that this format doesn't exist in accumulatedFormats here so
            // that we don't have to de-dupe later, although it probably could go
            // either way.
            if (format.length === 1 && found.indexOf(tagName) === -1) {
              found.push(format[0]);
            }

            _recordChildFormats(child.childNodes, supported, found);
          }
        }

        return found;
      };
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
    };

    /**
     * Private methods
     */

    function _elementIsBlockLevel(element) {
      return (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'p'].
        indexOf(element.nodeName.toLowerCase()) > -1);
    }

    /**
     * This is a utility method that changes every block-level container
     * that contains the current selection. It is used in practice to toggle
     * headings and the default paragraph style.
     *
     * The argument that .modifyBlocks() passes to the function it itself
     * receives as an argument is a DocumentFragment with live references to
     * the DOM; it will replace that fragment with the return value of the
     * supplied function.
     *
     * For this reason, we actually clone nodes into a fresh DocumentFragment
     * in order to avoid sticky stuff like modifying the collection over which
     * we are currently iterating.
     *
     * @param {string} blockType - The nodeType to which the block-level
     *   container should be changed.
     */
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
      _editor.setSelection(document.createRange());
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
