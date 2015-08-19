(function(root) {

  'use strict';

  var socrata = root.socrata = root.socrata || {};
  root.socrata.utils = root.socrata.utils || {};

  var storytellerUtils = {

    mapDOMFragmentDescending: function(element, applyFn, shouldTerminateFn) {

      var clonedElement = applyFn(element.cloneNode());

      if (!shouldTerminateFn(element)) {

        var childCount = element.childNodes.length;

        for (var i = 0; i < childCount; i++) {

          clonedElement.appendChild(
            this.mapDOMFragmentDescending(
              element.childNodes[i],
              applyFn,
              shouldTerminateFn
            )
          );
        }
      }

      return clonedElement;
    },

    /**
     * Prevents scrolling from bubbling up to the document
     * Ex: element.on('mousewheel', '.scrollable', Util.preventScrolling)
     */
    preventScrolling: function(e) {
      var target = $(this);
      var scrollTop = target.scrollTop();

      var delta = e.originalEvent.deltaY;
      if (delta < 0) {
        // Scrolling up.
        if (scrollTop === 0) {
          // Past top.
          e.preventDefault();
        }
      } else if (delta > 0) {
        // Scrolling down.
        var innerHeight = target.innerHeight();
        var scrollHeight = target[0].scrollHeight;

        if (scrollTop >= scrollHeight - innerHeight) {
          // Past bottom.
          e.preventDefault();
        }
      }
    },

    reduceDOMFragmentAscending: function(element, applyFn, shouldTerminateFn, accumulator) {

      if (!shouldTerminateFn(element)) {

        if (element.parentNode !== null) {

          this.reduceDOMFragmentAscending(
            element.parentNode,
            applyFn,
            shouldTerminateFn,
            accumulator
          );
        }
      }

      applyFn(element, accumulator);

      return accumulator;
    },

    reduceDOMFragmentDescending: function(element, applyFn, shouldTerminateFn, accumulator) {

      applyFn(element, accumulator);

      if (!shouldTerminateFn(element)) {

        var childCount = element.childNodes.length;

        for (var i = 0; i < childCount; i++) {
          this.reduceDOMFragmentDescending(
            element.childNodes[i],
            applyFn,
            shouldTerminateFn,
            accumulator
          );
        }
      }

      return accumulator;
    },

    generateYouTubeUrl: function(youTubeId) {

      socrata.utils.assertIsOneOfTypes(youTubeId, 'string');

      return 'https://www.youtube.com/embed/' + youTubeId;
    },

    generateYouTubeIframeSrc: function(youTubeId, autoplay) {

      socrata.utils.assertIsOneOfTypes(youTubeId, 'string');

      var src = 'https://www.youtube.com/embed/' + youTubeId + '?rel=0&showinfo=0';

      if (autoplay) {
        src += '&autoplay=true';
      }

      return src;
    },

    /**
     * Walks up the DOM looking for elements with the given attribute.
     * When it finds one, returns the value of the given attribute.
     *
     * @param {HTMLElement | jQuery} element - The starting point of the search.
     * @param {string} attribute - The name of the attribute to search for.
     *
     * @return {string | undefined} - The value of the found attribute, or undefined if not found.
     */
    findClosestAttribute: function(element, attribute) {

      socrata.utils.assertInstanceOfAny(element, $, HTMLElement);
      socrata.utils.assertIsOneOfTypes(attribute, 'string');

      return $(element).closest('[{0}]'.format(attribute)).attr(attribute);
    },

    /**
     * Asserts that an object is instanceof an instantiator.
     *
     * @param {object} instance - The instance to check.
     * @param {function} instantiator - The instantiator to check against.
     */
    assertInstanceOf: function(instance, instantiator) {

      socrata.utils.assertInstanceOfAny(instance, instantiator);
    },

    /**
     * Asserts that an object is instanceof at least one of the provided instantiators.
     *
     * @param {object} instance - The instance to check.
     * @param {...function} <arguments> - List of acceptable instantiators
     */
    assertInstanceOfAny: function(instance) {

      var instantiators = _.rest(arguments);
      var valid = _.any(instantiators, function(instantiator) {
        return instance instanceof instantiator;
      });

      if (!valid) {
        throw new Error(
          'Value must be one of [{0}] (instance: {1}).'.
            format(instantiators.join(', '), instance)
        );
      }
    }
  };

  _.merge(root.socrata.utils, storytellerUtils);
})(window);
