;var RichTextEditorFormatController = (function() {

  'use strict';

  /**
   * The Formats configuration block is used by the RichTextEditorToolbar and
   * the RichTextEditorFormatController to specify which format options are
   * supported, how they should be displayed on the toolbar and what action
   * should be taken when they are executed.
   *
   * @constructor
   * @param {Squire} editor
   * @param {object[]} formats
   *   @property {string} id - The internal name of the operation that is
   *     associated with this format.
   *   @property {string} tag
   *   @property {string} name - The human-readable name that will appear
   *     as a tool-tip if the user hovers the cursor over the option or button.
   *   @property {boolean} dropdown - Whether or not this format should appear
   *     as an option in the block format select control. False indicates that
   *     the format should appear as a button.
   *   @property {number} [group] - The button group in which this format's
   *     button should appear.
   */
  function RichTextEditorFormatController(editor, formats) {

    if (!(editor instanceof Squire)) {
      throw new Error('`editor` argument is not an instance of Squire.');
    }

    if (!(formats instanceof Array)) {
      throw new Error(
        '`formats` must be an array (is of type ' +
        (typeof formats) +
        ').'
      );
    }

    var _editor = editor;
    var _formats = formats;
    var _commandDispatcher = {
      'heading1': function() { _setHeading('h1'); },
      'heading2': function() { _setHeading('h2'); },
      'heading3': function() { _setHeading('h3'); },
      'heading4': function() { _setHeading('h4'); },
      'heading5': function() { _setHeading('h5'); },
      'heading6': function() { _setHeading('h6'); },
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
      'removeLink': function() { _removeLink(); },
      'clearFormatting': function() { _clearFormat(); }
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
      if (!_commandDispatcher.hasOwnProperty(commandName)) {
        throw new Error('command `' + commandName + '` not found.');
      }
      _commandDispatcher[commandName](data);
    };

    /**
     * This method iterates over the current selection (or, if there is no
     * selection, the node that contains the cursor) to accumulate a list of
     * all the styles that are currently active.
     *
     * This list is used to decide which buttons in the UI to mark as active.
     */
    this.getActiveFormats = function() {

      function _recordAlignmentFormats(element) {

        function _recordElementAlignment(element, foundAlignments) {

          if (typeof element.className === 'string') {

            if (element.className.match(/center/)) {
              foundAlignments.push(
                _formats.filter(function(format) {
                  return format.id === 'center';
                })[0]
              );
            }

            if (element.className.match(/right/)) {
              foundAlignments.push(
                _formats.filter(function(format) {
                  return format.id === 'right';
                })[0]
              );
            }

            if (element.className.match(/left/)) {
              foundAlignments.push(
                _formats.filter(function(format) {
                  return format.id === 'left';
                })[0]
              );
            }
          }
        }

        var foundAlignments = window.Util.reduceDOMFragmentAscending(
          element,
          _recordElementAlignment,
          function() { return false; },
          []
        );

        if (foundAlignments.length === 0) {
          foundAlignments.push(
            _formats.filter(function(format) {
              return format.id === 'left';
            })[0]
          );
        }

        return foundAlignments;
      }

      function _recordStyleFormats(element) {

        function _recordElementStyleFormat(element, foundStyles) {

          var tagName = element.nodeName.toLowerCase();

          var format = _formats.filter(function(format) {
            return format.tag === tagName;
          });

          // Check that this format doesn't exist in accumulatedFormats here so
          // that we don't have to de-dupe later, although it probably could go
          // either way.
          if (format.length === 1 && foundStyles.indexOf(tagName) === -1) {
            foundStyles.push(format[0]);
          }
        }

        var foundFormats = [];
        var thisFormat;

        // First record all the containing formats that are applied to the selection.
        for (var i = 0; i < _formats.length; i++) {

          thisFormat = _formats[i];

          if (thisFormat.tag !== null && _editor.hasFormat(thisFormat.tag)) {
            foundFormats.push(thisFormat);
          }
        }

        foundFormats.concat(
          window.Util.reduceDOMFragmentDescending(
            element,
            _recordElementStyleFormat,
            function() { return false; },
            []
          )
        );

        return foundFormats;
      }

      var selection = _editor.getSelection();
      var foundAlignmentFormats = _recordAlignmentFormats(selection.commonAncestorContainer);
      var foundStyleFormats = _recordStyleFormats(selection.cloneContents());

      return foundAlignmentFormats.concat(foundStyleFormats);
    };

    /**
     * Private methods
     */

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
    function _updateBlockType(blockType, stripFormatsFn) {

      function _stripBlockElements(element) {

        var blockElements = [
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'div',
          'p',
          'blockquote',
          'ol',
          'ul',
          'li'
        ];

        if ((blockElements).indexOf(element.nodeName.toLowerCase()) > -1) {
          return document.createDocumentFragment();
        } else {
          return element;
        }
      }

      if (typeof stripFormatsFn === 'undefined') {
        stripFormatsFn = _stripBlockElements;
      }

      if (typeof stripFormatsFn !== 'function') {
        throw new Error(
          '`stripFormatsFn` argument must be a function or undefined.'
        );
      }

      _editor.modifyBlocks(
        function(blockFragment) {

          var newFragment = document.createElement(blockType);

          for (var i = 0; i < blockFragment.childNodes.length; i++) {
            newFragment.appendChild(
              window.Util.mapDOMFragmentDescending(
                blockFragment.childNodes[i],
                stripFormatsFn,
                function() { return false; }
              )
            );
          }

          return newFragment;
        }
      );
    }

    function _clearSelection() {
      _editor.setSelection(document.createRange());
    }

    function _clearFormat(selection) {

      // As of 6/25/2015 the version of Squire provided by Bower does not yet
      // include this method, but it is currently implemented in master:
      //
      // https://github.com/neilj/Squire
      //
      // Eventually we will be able to remove this check altogether and just
      // call `_editor.removeAllFormatting(selection)` directly.
      if (_editor.hasOwnProperty('removeAllFormatting')) {
        _editor.removeAllFormatting(selection);
      } else {
        alert('Support for the `removeAllFormatting()` method exists in Squire but not yet in the bower package that we are using.');
      }

      _updateBlockType('div');
    }

    function _setHeading(headingTag) {
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
      _editor.setTextAlignment('left');
    };

    function _blockAlignCenter() {
      _editor.setTextAlignment('center');
    };

    function _blockAlignRight() {
      _editor.setTextAlignment('right');
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
        _updateBlockType('div');
       } else {
        _updateBlockType('blockquote');

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
