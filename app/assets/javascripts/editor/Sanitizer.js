(function(root) {

  'use strict';

  var Constants = root.Constants;
  var socrata = root.socrata;
  var utils = socrata.utils;
  var storyteller = socrata.storyteller;

  var _ATTRIBUTE_WHITELIST = {
    'a': ['href']
  };

  var Sanitizer = {};

  /**
   * Makes an element and all child nodes conform to our set of supported
   * element types. Note that this mutates the given DOM.
   *
   * @param {DOMNode} el
   * @param {object} attributeWhitelist
   *
   * @return {DOMNode} the sanitized version of el.
   */
  function _sanitizeElement(el, attributeWhitelist) {

    function _isNodeTypeSafeToUse(tagName) {
      return [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', // Headers
        'b', 'i', 'em', 'a',                // Inline
        'div', 'ul', 'ol', 'li'             // Block
      ].indexOf(tagName) > -1;
    }

    function _copyWhitelistedAttributes(dirtyElement, cleanElement) {

      // This function checks the attribute whitelist on a tag-by-tag
      // basis to determine whether or not the specified element
      // attribute should be copied from the 'dirty' element received
      // from the clipboard into the 'clean' element that will be
      // inserted into the editor iframe's internal document.
      function _attributeIsAllowed(tagName, attrName, whitelist) {
        return (
          whitelist.hasOwnProperty(tagName) &&
          whitelist[nodeName].indexOf(attrName) > -1
        );
      }
      var attributes = dirtyElement.attributes;
      var attributeCount = attributes.length;

      for (var index = 0; index < attributeCount; index++) {

        var attribute = attributes[index];

        var attributeIsAllowed = _attributeIsAllowed(
          dirtyElement.nodeName.toLowerCase(),
          attribute.name.toLowerCase(),
          _ATTRIBUTE_WHITELIST
        );

        if (attributeIsAllowed) {
          cleanElement.setAttribute(attribute.name, attribute.value);
        }
      }
    }

    var nodeName = _.isString(el.nodeName) ? el.nodeName.toLowerCase() : null;
    var cleanEl = null;
    var childNodes;
    var childEl;

    // Node Types
    //
    // var Node = {
    //   ELEMENT_NODE                :  1,
    //   ATTRIBUTE_NODE              :  2,
    //   TEXT_NODE                   :  3,
    //   CDATA_SECTION_NODE          :  4,
    //   ENTITY_REFERENCE_NODE       :  5,
    //   ENTITY_NODE                 :  6,
    //   PROCESSING_INSTRUCTION_NODE :  7,
    //   COMMENT_NODE                :  8,
    //   DOCUMENT_NODE               :  9,
    //   DOCUMENT_TYPE_NODE          : 10,
    //   DOCUMENT_FRAGMENT_NODE      : 11,
    //   NOTATION_NODE               : 12
    // };
    if (el.nodeType === 1) {

      if (_isNodeTypeSafeToUse(nodeName)) {
        cleanEl = document.createElement(nodeName);
      } else {
        // DocumentFragments are ignored by squire.
        // We use them here to maintain the DOM structure.
        cleanEl = document.createDocumentFragment();
      }

      _copyWhitelistedAttributes(el, cleanEl, attributeWhitelist);
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

  /**
   * This function recursively descends the given element and performs
   * a whitelisting filter operation on the element's child nodes.
   * This filter operation will replace non-header block elements with divs
   * and collapse nested container elements into single divs. This is often
   * necessary because the whitelist strips most element attributes and the
   * semantic value of multiple nested divs with different classes, for
   * example, is lost in the process.
   *
   * The sanitized element is returned from this function. Though we mutate
   * `element`, this function may not return `element` itself so it is
   * important to use the value returned from this function instead of the
   * original element.
   *
   * @param {DOMNode} element
   * @return {DOMNode}
   */
  Sanitizer.sanitizeElement = function(element) {
    var sanitizedElement;
    try {
      sanitizedElement = _sanitizeElement(element, _ATTRIBUTE_WHITELIST);
    } catch (error) {
      sanitizedElement = document.createDocumentFragment();

      if (window.console) {
        console.warn('Error sanitizing: ', error);
      }
    } finally {
      return sanitizedElement;
    }
  };

  storyteller.Sanitizer = Sanitizer;

})(window);
