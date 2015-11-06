(function() {

  'use strict';

  var socrata = window.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

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

    if (!(editor instanceof storyteller.RichTextEditor)) {
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
    var _squire = editor.getSquireInstance();
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
      'link': function() { _link(); },
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

      function _recordAlignmentFormats(element) {

        var foundAlignments = utils.reduceDOMFragmentAscending(
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

      function _recordElementStyleFormat(element, foundStyles) {

        var tagName = element.nodeName.toLowerCase();

        var tagFormat = _formats.filter(function(format) {
          return format.tag === tagName;
        });

        // Check that this format doesn't exist in accumulatedFormats here so
        // that we don't have to de-dupe later, although it probably could go
        // either way.
        if (tagFormat.length === 1 && foundStyles.indexOf(tagName) === -1) {
          foundStyles.push(tagFormat[0]);
        }
      }

      function _recordStyleFormats(element) {

        var foundFormats = [];
        var thisFormat;

        // First record all the containing formats that are applied to the selection.
        for (var i = 0; i < _formats.length; i++) {

          thisFormat = _formats[i];

          if (thisFormat.tag !== null && _squire.hasFormat(thisFormat.tag)) {
            foundFormats.push(thisFormat);
          }
        }

        foundFormats.concat(
          utils.reduceDOMFragmentDescending(
            element,
            _recordElementStyleFormat,
            function() { return false; },
            []
          )
        );

        return foundFormats;
      }

      var selection = _squire.getSelection();
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

      _squire.modifyBlocks(
        function(blockFragment) {

          var newFragment = document.createDocumentFragment();

          for (var i = 0; i < blockFragment.childNodes.length; i++) {

            var styleText = blockFragment.childNodes[i].style.cssText;
            var newBlock = document.createElement(blockType);

            // Note that we are applying the same class name and style
            // declarations that Squire will add when we change the text
            // alignment. This is so that it appears 'native' to Squire
            // and will render correctly when we call `.setHTML()` on the
            // Squire instance.
            //
            // If the way Squire sets text alignment changes, or we choose
            // an alternate rich text editor, we will need to update these
            // accordingly.
            if (styleText.match(/text-align: left/)) {
              newBlock.className = 'align-left';
              newBlock.style.cssText = 'text-align: left;';
            }

            if (styleText.match(/text-align: center/)) {
              newBlock.className = 'align-center';
              newBlock.style.cssText = 'text-align: center;';
            }

            if (styleText.match(/text-align: right/)) {
              newBlock.className = 'align-right';
              newBlock.style.cssText = 'text-align: right;';
            }

            newBlock.appendChild(
              utils.mapDOMFragmentDescending(
                blockFragment.childNodes[i],
                stripFormatsFn,
                _.constant(false)
              )
            );

            newFragment.appendChild(newBlock);
          }

          return newFragment;
        }
      );
    }

    function _clearFormat() {
      // As of 9/23/2015 Squire's removeAllFormatting() only strips inline styles
      // and block-level elements completely enclosed by the selection. When you
      // have selected the text of a heading the closing tag is not included and
      // so the heading is not removed.
      // So call removeAllFormatting() AND update the block type.
      editor.removeAllFormatting();
      _updateBlockType('div');
    }

    function _setHeading(headingTag) {
      _updateBlockType(headingTag);
    }

    function _toggleBold() {

      if (_squire.hasFormat('b')) {
        _squire.removeBold();
      } else {
        _squire.bold();
      }
    }

    function _toggleItalic() {

      if (_squire.hasFormat('i')) {
        _squire.removeItalic();
      } else {
        _squire.italic();
      }
    }

    function _blockAlignLeft() {
      _squire.setTextAlignment('left');
    }

    function _blockAlignCenter() {
      _squire.setTextAlignment('center');
    }

    function _blockAlignRight() {
      _squire.setTextAlignment('right');
    }

    function _toggleOrderedList() {

      if (_squire.hasFormat('ol')) {
        _squire.removeList();
      } else if (_squire.hasFormat('ul')) {
        _squire.removeList();
        _squire.makeOrderedList();
      } else {
        _squire.makeOrderedList();
      }
    }

    function _toggleUnorderedList() {

      if (_squire.hasFormat('ul')) {
        _squire.removeList();
      } else if (_squire.hasFormat('ol')) {
        _squire.removeList();
        _squire.makeUnorderedList();
      } else {
        _squire.makeUnorderedList();
      }
    }

    function _toggleBlockquote() {

      if (_squire.hasFormat('blockquote')) {
        _updateBlockType('div');
      } else {
        _updateBlockType('blockquote');
      }
    }

    function _link() {
      var range;
      var selection;
      var link;
      var text;
      var parentElement;

      var selection = _squire.getSelection();

      if (_squire.hasFormat('a')) {
        parentElement = selection.startContainer.parentElement

        range = document.createRange();
        range.selectNode(parentElement);
        _squire.setSelection(range);

        text = range.toString();
        link = parentElement.href;
      } else {
        text = selection.toString();
        link = '';
      }

      storyteller.dispatcher.dispatch({
        action: Actions.LINK_MODAL_SET_EDITOR,
        editorId: editor.id
      });

      storyteller.dispatcher.dispatch({
        action: Actions.LINK_MODAL_OPEN
      });

      storyteller.dispatcher.dispatch({
        action: Actions.LINK_MODAL_FORMAT,
        text: text,
        link: link
      });
    }

    storyteller.linkStore.addChangeListener(function() {
      var editorId = storyteller.linkStore.getEditorId();
      var inputs = storyteller.linkStore.getInputs();

      if (editorId === _editor.id && inputs && inputs.link.length > 0) {
        var selection = _squire.getSelection();
        var text = selection.toString();

        if (text === inputs.text || inputs.text.length === 0) {
          _squire.makeLink(inputs.link)
        } else {
          var anchor = '<a href="{0}">{1}</a>'.format(inputs.link, inputs.text);
          _squire.insertHTML(anchor);
        }
      }
    });
  }

  storyteller.RichTextEditorFormatController = RichTextEditorFormatController;
})();
