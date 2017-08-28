import $ from 'jquery';
import _ from 'lodash';
import Squire from 'squire';

import Actions from './Actions';
import Sanitizer from './Sanitizer';
import StorytellerUtils from '../StorytellerUtils';
import { assert, assertInstanceOf, assertIsOneOfTypes } from 'common/js_utils';
import CustomEvent from '../CustomEvent';
import RichTextEditorFormatController from './RichTextEditorFormatController';
import { dispatcher } from './Dispatcher';
import { windowSizeBreakpointStore } from './stores/WindowSizeBreakpointStore';
import { exceptionNotifier } from '../services/ExceptionNotifier';

/**
 * @constructor
 * @param {jQuery} element
 * @param {string} editorId
 * @param {string} [contentToPreload] - The content that should be inserted
 *   into the newly-created editor.
 */
export default function RichTextEditor(element, editorId, formats, contentToPreload) {
  assertInstanceOf(element, $);
  assert(element.length !== 0, '`element` did not match any DOM nodes.');
  assert(element.length === 1, '`element` matches more than one DOM node.');
  assertIsOneOfTypes(editorId, 'number', 'string');
  assertIsOneOfTypes(contentToPreload, 'undefined', 'string');
  assertInstanceOf(formats, Array);

  var _containerElement = element;
  var _formats = formats;
  var _contentWindowDocument;
  var _contentToPreload = null;
  // _editor is the Squire instance.
  var _editor = null;
  // _editorElement is the <iframe> associated with the Squire instance.
  var _editorElement = null;
  var _editorBodyElement = null;
  var _formatController = null;
  var _lastContentHeight = 0;
  var _self = this;

  var _defaultThemesCss = $('#themes').html() || '';
  var _customThemesCss = $('#custom').html() || '';

  // Last content passed to setContent(), verbatim.
  let _lastSetContent;

  // Last content passed to setContent(), but transformed through
  // Squire/the browser's normalization rules.
  // See comment in _broadcastContentChangeWhenSettled.
  let _lastSetContentSquireNormalized;

  if (typeof contentToPreload !== 'undefined') {
    _contentToPreload = contentToPreload;
  }

  /**
   * Public methods
   */

  this.id = editorId;

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
  this.setContent = function(newContent) {
    // Different browsers give slightly-different HTML for the same content. For example,
    // Chrome specifies inline colors like this:
    // <span style="color:rgb(x, y, z)">
    // while IE uses a hex representation:
    // <span style="color: #AABBCC">.
    //
    // This matters because setting the content steals focus (in IE only).
    // The net result of this is focus going haywire when a user edits a
    // story with some text having custom colors. As a workaround, we
    // remember what content an editor is "supposed" to have and skip
    // setting the content if we've already tried to set that content.
    // We can't use _editor.getHTML (or this.contentDiffersFrom) because
    // then we'd have to parse inline CSS and convert between color
    // representations (and who knows what other differences lurk).
    //
    // Also, there's a non-trivial performance cost to setting HTML
    // all the time - we call this method quite liberally and often
    // unnecessarily. Eliminating those extra calls is not practical;
    // the best place to handle the issue is right here.
    if (newContent === _lastSetContent) {
      return;
    }
    _lastSetContent = newContent;

    if (_editor === null) {
      // Our iframe hasn't loaded yet.
      // Save the content so it is preloaded
      // once the iframe loads.
      _contentToPreload = newContent;
      return;
    }

    if (
      _editor &&
      this.contentDiffersFrom(newContent) &&
      this.contentDiffersFrom(_lastSetContentSquireNormalized)
    ) {
      _editor.setHTML(newContent);
      _lastSetContentSquireNormalized = _editor.getHTML();
      _updateContentHeight();
    }
  };

  this.contentDiffersFrom = function(otherContent) {
    function uniformify(html) {
      return _.unescape(html).replace(/&nbsp;/g, '\xa0');
    }

    return uniformify(_editor.getHTML()) !== uniformify(otherContent);
  };

  this.getContentHeight = function() {
    return _lastContentHeight;
  };

  /**
   * Applies the Google Font embed code to the rich text editor.
   * Will only add this code if it has not already been added.
   */
  this.applyThemeFont = function(theme) {

    _callWithContentDocumentIfPresent(
      function(contentDocument) {
        // See if any of the elements in <head> have our theme's href.
        // If not, we need to load our theme.
        // Querying this via a css selector (i.e., [href="foobar"]) is expensive.
        var headElement = contentDocument.querySelector('head');
        var hrefsInHead = _.invokeMap(headElement.children, 'getAttribute', 'href');
        if (!_.includes(hrefsInHead, $(theme).attr('href'))) {
          $(headElement).append($(theme));
        }
      }
    );
  };

  // Add a `themeName` class to the html root of the iframe
  this.applyThemeClass = function(theme) {

    _callWithContentDocumentIfPresent(
      function(contentDocument) {
        var htmlElement;
        var currentClasses;
        var newClassList;

        htmlElement = contentDocument.documentElement;
        currentClasses = htmlElement ? htmlElement.getAttribute('class') : null;
        var newClasses;

        if (currentClasses) {

          newClassList = _.reject(
            htmlElement.getAttribute('class').split(' '),
            function(className) {
              return _.startsWith(className, 'theme-');
            }
          );

          newClassList.push(
            StorytellerUtils.format('theme-{0}', theme)
          );

          newClasses = newClassList.join(' ');
          if (htmlElement.getAttribute('class') !== newClasses) {
            htmlElement.setAttribute('class', newClasses);
            _updateContentHeight();
          }
        }
      }
    );
  };

  // Adds an extra class to the content body.
  this.addContentClass = function(extraClass) {

    _callWithContentDocumentIfPresent(
      function(contentDocument) {

        $(contentDocument.querySelector('body')).addClass(extraClass);
      }
    );
  };

  /**
   * Deselects the rich text <iframe>.
   */
  this.deselect = function() {

    _callWithContentDocumentIfPresent(
      function(contentDocument) {
        var selection;

        // IE supports .selection, while everything else
        // supports .getSelection.
        if (contentDocument.selection) {

          contentDocument.
            selection.
            clear();
        } else if (contentDocument.getSelection) {

          selection = contentDocument.getSelection();
          if (selection.rangeCount > 0) {
            selection.removeAllRanges();
          }
        }
      }
    );
  };

  /**
   * This method assumes that jQuery's .remove() function will correctly
   * remove any event listeners attached to _editorElement or any of its
   * children.
   */
  this.destroy = function() {
    windowSizeBreakpointStore.removeChangeListener(_applyWindowSizeClass);
    _editorElement.remove();
  };

  this.getSquireInstance = function() {
    return _editor;
  };

  _createEditor();

  /**
   * Private methods
   */

  function _createEditor() {

    _containerElement.attr('data-editor-id', editorId);
    _editorElement = $('<iframe>');

    $(_editorElement).load(function(e) {

      _contentWindowDocument = e.target.contentWindow.document;
      _addThemeStyles(_contentWindowDocument);
      _editor = new Squire(_contentWindowDocument);
      _editorBodyElement = $(_contentWindowDocument).find('body');
      _formatController = new RichTextEditorFormatController(
        _self,
        _formats
      );

      _contentWindowDocument.addEventListener('click', _broadcastContentClick);
      _contentWindowDocument.addEventListener('click', _broadcastFormatChange);

      _editor.addEventListener('focus', _broadcastFocus);
      _editor.addEventListener('blur', _broadcastBlur);

      // TODO: If nothing obvious is broken with the Rich Text Editor Toolbar
      // when you come across this message, please remove the following two
      // commented-out lines. They do not seem to be required for the correct
      // functioning of the RTE toolbar (including updating the state of the
      // buttons and the color of the text color icon), and so can probably
      // be safely removed.
      //
      // _editor.addEventListener('focus', _broadcastFormatChange);
      _editor.addEventListener('select', _broadcastFormatChange);
      // This is needed to get the active text color swatch to update when
      // moving the cursor around with the arrow keys.
      _editor.addEventListener('keydown', _broadcastFormatChangeOnArrowKeydown);
      _editor.addEventListener('pathChange', _broadcastFormatChange);

      _editor.addEventListener('input', _handleContentChange);
      _editor.addEventListener('willPaste', function(pasteEvent) {
        _sanitizeClipboardInput(pasteEvent);
        _handleContentChange();
      });
      _editor.addEventListener('drop', function() {
        // We get no opportunity to edit the dropped content, so sanitize everything.
        _sanitizeCurrentContent();
        _handleContentChange();
      });

      _editor.setKeyHandler('ctrl-k', _clickEditorLinkButton);
      _editor.setKeyHandler('meta-k', _clickEditorLinkButton);

      // Pre-load existing content (e.g. if we are editing an
      // existing resource).
      if (_contentToPreload !== null) {
        _editor.setHTML(_contentToPreload);
        _broadcastFormatChange();
      }

      // Bind these listeners *after* the HTML has been set because Squire will
      // fire a pathChange event in reaction to that HTML setting, and the
      // selection range is initialized to (0,0)... which means that the tooltip
      // will in fact appear if the HTML content starts with a link.
      _.defer(function() {
        _editor.addEventListener('mouseup', _linkActionTip);
        _editor.addEventListener('pathChange', _linkActionTip);
      });

      _setupMouseMoveEventBroadcast();

      windowSizeBreakpointStore.addChangeListener(_applyWindowSizeClass);
      _applyWindowSizeClass();
    });

    _containerElement.append(_editorElement);
  }

  /**
   * @function _clickEditorLinkButton
   * @description
   * This function prevents the default behavior based on the event.
   * It will click the editor toolbar link button and focus on the
   * URL input field when present. The function is called to handle the Ctrl/Cmd + k shortcut
   * that allows the user to add or edit a link to their current selection.
   *
   * @param {Object} editor - the Squire instance (req'd for Squire setKeyHandler function)
   * @param {Object} event - a ctrl-k or meta-k event object
   */
  function _clickEditorLinkButton(editor, event) {
    event.preventDefault();
    $('.rich-text-editor-toolbar-btn-link').click();
    $('input[type="url"]').focus();
  }

  /**
   * @function _linkActionTip
   * @description
   * This event-bound function reads the current event that is bound
   * and decides whether or not the cursor/selection in either has/is
   * a link. In the case that it is a link, the anchor tag is discovered
   * through the selection and an action to open the LinkTip is prepared.
   *
   * @param {Object} event - A mouseup, or pathChange event object.
   */
  function _linkActionTip() {
    var anchor;
    var selection = _editor.getSelection();

    if (_editor.hasFormat('a')) {
      // There are two cases:
      // - We have a cursor in the link,
      // - or we have a selection of the link.
      // This is complicated, however, by the fact that formatting options
      // such as color will add extra spans inside the anchor tag.
      // So just let jQuery figure the damn situation out.
      anchor = $(selection.startContainer).closest('a[href]')[0];

      if (!anchor) {
        exceptionNotifier.notify(
          new Error('Unable to find anchor node in _linkActionTip!')
        );
      }

      // TODO gferrari (12/21/2015): Architectural issue:
      // The 'pathChange' event triggers '_linkActionTip', which dispatches
      // LINK_TIP_OPEN and LINK_TIP_CLOSE.
      // Creating a new RichTextEditor triggers 'pathChange' (through the initial call to
      // setHTML). RichTextEditors are created during STORY_INSERT_BLOCK actions.
      //
      // This means LINK_TIP_OPEN and LINK_TIP_CLOSE actions will be dispatched during STORY_INSERT_BLOCK.
      // This double dispatch is not allowed in the Flux paradigm. As a dirty hack, we're deferring
      // the dispatch of the LINK_TIP_* actions, but this is only justified because the architecturally
      // preferable refactor requires additional deliberation and costing.
      //
      // The root of the issue stems from the fact that RichTextEditor simultaneously implements
      // store behavior (in this case, is the source of truth for app state and app state changes, note 1),
      // and view behavior (deals with presentation and user input, including dispatching actions).
      //
      // A possible improvement to the current RichTextEditor architecture would be to implement
      // a TextEditorStore or maybe a StoryEditStore that exposes enough information for the
      // LinkTipRenderer to determine if it should show itself or not. In this specific case,
      // StoryEditStore could expose a path() getter, to be consumed by LinkTipRenderer.
      //
      // Note 1: getContent, getContentHeight, select, deselect, ....
      _.defer(function() {
        dispatcher.dispatch({
          action: Actions.LINK_TIP_OPEN,
          editorId: _self.id,
          text: anchor.textContent,
          link: anchor.href,
          openInNewWindow: anchor.getAttribute('target') === '_blank',
          boundingClientRect: anchor.getBoundingClientRect()
        });
      });
    } else {
      // regarding the defer(), see giant comment above.
      _.defer(function() {
        dispatcher.dispatch({
          action: Actions.LINK_TIP_CLOSE
        });
      });
    }
  }

  function _applyWindowSizeClass() {

    _callWithContentDocumentIfPresent(
      function(contentDocument) {
        var windowSizeClass;
        var unusedWindowSizeClasses;

        windowSizeClass = windowSizeBreakpointStore.getWindowSizeClass();
        unusedWindowSizeClasses = windowSizeBreakpointStore.getUnusedWindowSizeClasses();

        $(contentDocument.documentElement).
          removeClass(unusedWindowSizeClasses.join(' ')).
          addClass(windowSizeClass);
      }
    );
  }


  function makeStyleElement(css) {
    var style = document.createElement('style');
    style.type = 'text/css';

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    return style;
  }

  function adjustHeight(iframeDocument) {
    _updateContentHeight();
    _broadcastHeightChange();

    $(iframeDocument.body).
      css('opacity', 1);
  }

  /**
   * Loads (default & custom) themes into the given document (from an iframe).
   * The theme css is sourced from the styles already present on the
   * main editor window.
   *
   * Please note that this function requires that the document is
   * loaded (i.e., wait for its `load` event).
   */
  function _addThemeStyles(iframeDocument) {
    // Prevent flash of unstyled text by setting opacity to zero
    // and then overriding it in the stylesheet.
    $(iframeDocument.body).
      css('opacity', 0).
      addClass('typeset squire-formatted');

    var defaultThemesStyleElement = makeStyleElement(_defaultThemesCss);
    var customThemesStyleElement = makeStyleElement(_customThemesCss);

    defaultThemesStyleElement.onload = adjustHeight.bind(null, iframeDocument);

    $(iframeDocument.head).append([
      defaultThemesStyleElement,
      customThemesStyleElement
    ]);

    // It takes the browser a few extra frames to render the styles that are
    // applied above with appendChild. If we update the content height
    // willy nilly, we end up with something unrepresentative of the desired
    // height (an unstyled height, if you will). To avoid this, we wait for
    // a seemingly arbitrary amount of time (10ms has been determined
    // sufficient through casual testing) before recalculating the height.
    setTimeout(adjustHeight.bind(null, iframeDocument), 10);
  }

  /**
   * Handles changes to content. Changes will be broadcast out of the component
   * via a custom event ('rich-text-editor::content-change').
   */
  function _handleContentChange() {
    _updateContentHeight();
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
    var contentHeight = parseFloat(_editorBodyElement.css('padding-top') || 0, 10);

    // We need to recalculate the height of each individual element rather
    // than just checking the outerHeight of the body because the body
    // height has a tendency of getting out of sync with the visible height
    // of its child elements when you, e.g., add a new line and then delete
    // it. Weird, I know.
    _editorBodyElement.
      children().
      each(function() {
        var marginTop;
        var siblingMarginCollapsing = 0;
        var previous = $(this).prev();

        // If we have a previous sibling, we need to take into account
        // margin collapsing ("Adjacent sibling" case only).
        // See https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model/Mastering_margin_collapsing.
        if (previous) {
          marginTop = parseFloat($(this).css('margin-top') || 0, 10);
          siblingMarginCollapsing = parseFloat(previous.css('margin-bottom') || 0, 10);
          siblingMarginCollapsing = siblingMarginCollapsing > marginTop ? marginTop : siblingMarginCollapsing;
        }

        contentHeight += $(this).outerHeight(true) - siblingMarginCollapsing;
      });

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
      new CustomEvent(
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
   *
   * Additionally, the browser will "normalize" (lol) any HTML we load into it according to complicated,
   * browser-version-specific rules. Squire will notice these normalizations and raise the
   * generic "change" event. We need to filter out these normalization-only changes, because
   * our undo-redo implementation depends on the 'rich-text-editor::content-change' event to represent
   * a discrete user-driven edit. For example, here is the scenario that drove this implementation:
   *
   * Story with blocks:
   * 1: Plain Text
   * 2: Text with a custom color set in IE (it uses #hex colors, chrome uses rgb).
   *
   * Repro:
   * 1. Load above story in Chrome.
   * 2. Type a character into block 1.
   * 3. Hit Undo once.
   * Expect: Redo button still enabled.
   * Actual: It's disabled.
   *
   * Why? Because Undo triggers squire to normalize block 2 (because chrome converts the color to rgb),
   * which is then seen as a user edit. This blows away the redo stack.
   */
  var _broadcastContentChangeWhenSettled = _.debounce(() => {
    const content = _editor.getHTML();
    if (content !== _lastSetContentSquireNormalized) {
      _emitEvent(
        'rich-text-editor::content-change',
        { content: content, editor: _self }
      );
    }
  }, 1);

  function _broadcastFormatChange() {
    _emitEvent(
      'rich-text-editor::format-change',
      { content: _formatController.getActiveFormats() }
    );
  }

  function _broadcastFormatChangeOnArrowKeydown(e) {
    if (
      e.keyCode === 37 || // left arrow key
      e.keyCode === 38 || // up arrow key
      e.keyCode === 39 || // right arrow key
      e.keyCode === 40    // down arrow key
    ) {

      _emitEvent(
        'rich-text-editor::format-change',
        { content: _formatController.getActiveFormats() }
      );
    }
  }

  function _broadcastContentClick() {
    _emitEvent('rich-text-editor::content-click');
  }

  function _broadcastFocus() {
    _emitEvent('rich-text-editor::focus-change', { isFocused: true });
  }

  function _broadcastBlur() {
    _emitEvent('rich-text-editor::focus-change', { isFocused: false });
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
    e.fragment = Sanitizer.sanitizeElement(e.fragment);
  }

  /**
   * Passes the content currently in the edfitor through Sanitizer.
   */
  function _sanitizeCurrentContent() {
    // Get the content and sanitize it.
    var iframe = _editorElement[0];
    var sanitized = Sanitizer.sanitizeElement(iframe.contentWindow.document.body);

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

  // EN-6703 - Better handle iFrame contentDocument errors
  //
  // We see some evidence in Airbrake of various functions in this file
  // attempting to get the contentDocument property of an iFrame that has
  // a different origin than the parent document's. This causes a
  // SecurityError to be raised, and is potentially breaking the user
  // experience.
  //
  // Since we don't know much about the context in which this is happening we
  // are adding a bit of logging in the case of the SecurityError only, and
  // have made all attempts to get the contentDocument property pass through
  // this function so that our logging can be comprehensive.
  //
  // The end result of this is that sometimes we want to proceed with the
  // content document (which is why we pass a callback) and somteimes we don't.
  function _callWithContentDocumentIfPresent(callback) {
    var contentDocument;
    var errorToNotify;

    function getElementAttributes(el) {
      var attributes = [];
      var attribute;

      for (var i = 0; i < el.attributes.length; i++) {
        attribute = el.attributes[i];

        if (attribute.specified) {

          attributes.push(
            StorytellerUtils.format(
              '"{0}"="{1}"',
              attribute.name,
              attribute.value
            )
          );
        }
      }

      return attributes;
    }

    try {
      contentDocument = _editorElement[0].contentDocument;
    } catch (error) {

      if (error.name === 'SecurityError') {

        // We're not yet sure what is going on with this so we are adding some
        // additional logging around this error.
        errorToNotify = new Error(
          StorytellerUtils.format(
            'SecurityError on iFrame with attributes: "{0}" ' +
            'and parent node <{1}> with attributes: "{2}".',
            getElementAttributes(_editorElement[0]).join(', '),
            _editorElement[0].parentNode.nodeName.toLowerCase(),
            getElementAttributes(_editorElement[0].parentNode).join(', ')
          )
        );

        exceptionNotifier.notify(errorToNotify);
      } else {
        throw error;
      }
    }

    if (contentDocument) {
      callback(contentDocument);
    }

    return;
  }
}
