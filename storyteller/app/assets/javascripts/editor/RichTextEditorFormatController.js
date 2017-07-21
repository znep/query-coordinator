import $ from 'jquery';
import _ from 'lodash';

import Actions from './Actions';
import RichTextEditor from './RichTextEditor';
import StorytellerUtils from '../StorytellerUtils';
import { assertHasProperty, assertInstanceOf, assertIsOneOfTypes } from 'common/js_utils';
import { exceptionNotifier } from '../services/ExceptionNotifier';
import { dispatcher } from './Dispatcher';
import { linkModalStore } from './stores/LinkModalStore';
import { linkTipStore } from './stores/LinkTipStore';

/**
 * The Formats configuration block is used by the RichTextEditorToolbar and
 * the RichTextEditorFormatController to specify which format options are
 * supported, how they should be displayed on the toolbar and what action
 * should be taken when they are executed.
 *
 * @constructor
 * @param {RichTextEditor} editor
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
export default function RichTextEditorFormatController(editor, formats) {
  assertInstanceOf(editor, RichTextEditor);
  assertInstanceOf(formats, Array);

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
    'textColor': function(color) { _setTextColor(color); },
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

  _attachChangeListeners();

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
    assertHasProperty(_commandDispatcher, commandName);
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
      var foundAlignments = StorytellerUtils.reduceDOMFragmentAscending(
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
        StorytellerUtils.reduceDOMFragmentDescending(
          element,
          _recordElementStyleFormat,
          function() { return false; },
          []
        )
      );

      return foundFormats;
    }

    function _recordElementTextColor(element, foundTextStyles) {

      if (element.nodeType === element.ELEMENT_NODE) {
        var computedStyles = window.getComputedStyle(element);

        // Make a synthetic 'format' object here, since we cannot enumerate
        // all possible color values but we want to conform to the downstream
        // expectation that all of the active 'formats' are format objects.
        foundTextStyles.push({
          dropdown: false,
          id: 'textColor',
          name: 'textColor',
          tag: null,
          color: computedStyles.getPropertyValue('color')
        });
      }
    }

    function _recordTextColor(element) {

      var foundTextStyles = StorytellerUtils.reduceDOMFragmentAscending(
        element,
        _recordElementTextColor,
        function(el) {
          return el.nodeType === el.ELEMENT_NODE;
        },
        []
      );

      return foundTextStyles;
    }

    var selection = _squire.getSelection();
    var foundAlignmentFormats = _recordAlignmentFormats(selection.commonAncestorContainer);
    var foundStyleFormats = _recordStyleFormats(selection.cloneContents());
    var foundTextColor = _recordTextColor(selection.commonAncestorContainer);

    return foundAlignmentFormats.concat(foundStyleFormats).concat(foundTextColor);
  };

  /**
   * Private methods
   */

  function _attachChangeListeners() {
    linkModalStore.addChangeListener(_handleLinkModalStoreChanges);
    linkTipStore.addChangeListener(_handleLinkTipStoreChanges);
  }

  /**
   * @function _selectAnchorTag
   * @description
   * Within either editing or removal of a link, we must
   * select the entire link text prior to running Squire actions.
   * @param {boolean} inside - when false, the <a> is selected, when true the #text-node is selected.
   */
  function _selectAnchorTag(inside) {
    var anchor;
    var range = document.createRange();
    var selection = _squire.getSelection();

    if (_squire.hasFormat('a')) {
      if (selection.startContainer.nodeType === 1) {
        // Need to look up the DOM tree in the edge case where formatting has
        // been applied inside a link, since that creates child span, i, or b
        // elements inside the anchor.
        // Note that when Squire creates a link from already-formatted text, it
        // actually generates multiple distinct links for each formatted element
        // (which means that if you edit the URL for the italicized word in the
        // middle of your link, you're not actually editing the whole link...).
        anchor = $(selection.startContainer.childNodes[selection.startOffset]).
          closest('a[href]')[0];
        if (!anchor) {
          anchor = selection.startContainer.childNodes[selection.endOffset];
        }
      } else if (selection.startContainer.nodeType === 3) {
        // See above.
        anchor = $(selection.startContainer).closest('a[href]')[0];
        if (!anchor) {
          anchor = selection.startContainer.previousSibling;
        }
      }

      if (!anchor || anchor.nodeName !== 'A') {
        // Are you serious? Did you see how many fallback cases we had?
        return exceptionNotifier.notify(new Error('An anchor tag could not be selected.'));
      }

      if (inside) {
        range.setStartBefore(_.first(anchor.childNodes));
        range.setEndAfter(_.last(anchor.childNodes));
      } else {
        range.selectNode(anchor);
      }

      _squire.setSelection(range);
    }
  }

  function _handleLinkModalStoreChanges() {
    var activateLinkTip = linkModalStore.getEditorId() === _editor.id &&
      linkModalStore.getVisibility() === false;
    var shouldInsertLink = linkModalStore.shouldInsertLink(_editor.id);
    var shouldSelectLink = linkModalStore.shouldSelectLink(_editor.id);

    if (activateLinkTip) {
      _squire._body.focus();
      _squire.fireEvent('pathChange');
    } else if (shouldInsertLink) {
      _insertLink();
    } else if (shouldSelectLink) {
      _selectAnchorTag(true);
    }
  }

  function _handleLinkTipStoreChanges() {
    if (linkTipStore.shouldRemoveLink(_editor.id)) {
      _removeLink();
    }
  }

  /**
   * @function _insertLink
   * @description
   * Upon accepting edits made within a link modal, this function
   * figures out the type of placement to make within the corresponding
   * RichTextEditor.
   *
   * There are two code paths. The first is an easy Squire call to
   * _makeLink, while the second generates an anchor tag, places the
   * necessary values and then proceeds to replace the existing text
   * with the new link.
   *
   * The two paths exist because the text can be edited within the link
   * modal, but Squire's API doesn't support swapping text, and only supports
   * wrapping the selection.
   */
  function _insertLink() {
    var inputs = linkModalStore.getInputs();
    var selection = _squire.getSelection();
    var text = selection.toString();
    var target = inputs.openInNewWindow ? '_blank' : '_self';
    var link = linkModalStore.getURLValidity() ?
      inputs.link :
      'http://' + inputs.link;

    if (text === inputs.text || inputs.text.length === 0) {
      _squire.makeLink(link, {
        target: target,
        rel: 'nofollow'
      });
      _selectAnchorTag(true);
    } else {
      var anchor = StorytellerUtils.format(
        '<a href="{0}" target="{1}" rel="nofollow">{2}</a>',
        link,
        target,
        inputs.text
      );

      _selectAnchorTag();
      _squire.getSelection().deleteContents();
      _squire.insertHTML(anchor);
      _selectAnchorTag(true);

      _squire._body.focus();
      _squire.fireEvent('pathChange');
    }
  }

  /**
   * @function _removeLink
   * @description
   * If the LinkTipStore changes and we confirm the
   * last action should remove the link and we are the
   * editor in which the link should be removed, then
   * we remove the link of the current selection.
   *
   * Yes, this function assumes the action you'd like to take
   * is specifically meant for the current selection of text.
   *
   * After the removal, close the link tip.
   */
  function _removeLink() {
    _selectAnchorTag();
    _squire.removeLink();
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

    assertIsOneOfTypes(stripFormatsFn, 'function');

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
            StorytellerUtils.mapDOMFragmentDescending(
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
    _squire.removeAllFormatting();
    _updateBlockType('div');
  }

  function _setHeading(headingTag) {
    _updateBlockType(headingTag);
  }

  function _setTextColor(color) {
    _squire.setTextColour(color);

    // Set text-decoration-color on all coloring spans; in conjunction with a
    // CSS rule applied to all themes, this style will allow the underlines of
    // <a> and <u> elements to stay consistent with the text color.
    _squire.changeFormat({
      tag: 'span',
      attributes: {
        style: 'text-decoration-color: ' + color
      }
    });
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
    var link;
    var text;
    var element;
    var openInNewWindow;

    var selection = _squire.getSelection();

    // See also the above notes in _selectAnchorTag on the intersection of
    // formatting and links w.r.t. node structure.
    if (_squire.hasFormat('a')) {
      if (selection.startContainer.nodeType === 1) {
        // First, try to find an anchor as a descendant of startContainer.
        // If that doesn't work, try to find an anchor as an ancestor.
        element = selection.startContainer.querySelector('[href]') ||
          $(selection.startContainer).closest('a[href]')[0];
      } else if (selection.startContainer.nodeType === 3) {
        // Similarly, try to find an anchor as an ancestor.
        element = selection.startContainer.nodeName === 'A' ?
          selection.startContainer :
          $(selection.startContainer).closest('a[href]')[0];
      }
      // If we didn't find any anchor node, freak out.
      if (!element || element.nodeName !== 'A') {
        exceptionNotifier.notify(new Error(
          'Unable to find anchor node in _link!'
        ));
      }

      range = document.createRange();
      range.selectNode(element);
      _squire.setSelection(range);

      text = range.toString();
      link = element.getAttribute('href');
      openInNewWindow = element.getAttribute('target') === '_blank' ? true : false;
    } else {
      text = selection.toString();
      link = '';
      openInNewWindow = true;
    }

    dispatcher.dispatch({
      action: Actions.LINK_MODAL_OPEN,
      editorId: _editor.id,
      text: text,
      link: link,
      openInNewWindow: openInNewWindow
    });
  }
}
