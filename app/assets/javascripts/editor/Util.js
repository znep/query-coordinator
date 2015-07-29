;(function(storyteller) {
  'use strict';

  storyteller.Util = {

    assertEqual: function(value1, value2) {
      if (value1 !== value2) {
        throw new Error('Value `' + value1 + '` must equal value `' + value2 + '`.');
      }
    },

    assertHasProperty: function(object, name, message) {

      if (!object.hasOwnProperty(name)) {

        if (message) {
          throw new Error(message);
        }

        throw new Error('`' + name + '`' + ' property must be present. Object has properties: [' + Object.keys(object).join(', ') + '].');
      }
    },

    assertHasProperties: function(object) {
      // Apply all arguments (minus `object`)
      // to assertHasProperty(object, argument).
      _.each(
        _.rest(arguments),
        function(argument) {
          storyteller.Util.assertHasProperty(object, argument);
        }
      );
    },

    /**
     * Ensures the given value is of any of the provided types.
     *
     * @param {any} value - The value to check
     * @param {...string} <arguments> - List of acceptable types
     */
    assertIsOneOfTypes: function(value) {
      var types = _.rest(arguments);
      var valid = _.contains(types, typeof value);

      if (!valid) {
        throw new Error(
          'Value must be one of [' + types.join(', ') + '] (is of type ' +
          (typeof value) +
          ').'
        );
      }
    },

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

      this.assertIsOneOfTypes(youTubeId, 'string');

      return 'https://www.youtube.com/embed/' + youTubeId;
    },

    generateYouTubeIframeSrc: function(youTubeId, autoplay) {

      this.assertIsOneOfTypes(youTubeId, 'string');

      var src = 'https://www.youtube.com/embed/' + youTubeId + '?rel=0&showinfo=0';

      if (autoplay) {
        src += '&autoplay=true';
      }

      return src;
    }
  };
})(window.socrata.storyteller);
