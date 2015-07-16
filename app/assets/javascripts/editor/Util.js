;(function() {
  'use strict';

  window.Util = {

    assertHasProperty: function(object, name, message) {

      if (!object.hasOwnProperty(name)) {

        if (message) {
          throw new Error(message);
        }

        throw new Error('`' + name + '`' + 'property must be present.');
      }
    },

    assertHasProperties: function(object) {
      // Apply all arguments (minus `object`)
      // to assertHasProperty(object, argument).
      _.each(
        _.rest(arguments),
        function(argument) {
          window.Util.assertHasProperty(object, argument);
        }
      );
    },

    assertTypeof: function(value, type) {

      if (typeof value !== type) {
        throw new Error(
          'Value must be a ' + type + ' (is of type ' +
          (typeof value) +
          ').'
        );
      }
    },

    assertTypeofInArray: function(value, types) {

      if (types.indexOf(typeof value) < 0) {
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
    }

  };
})();
