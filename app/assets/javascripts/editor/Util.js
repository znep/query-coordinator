;(function() {

  window.Util = {

    assertHasProperty: function(object, name) {
      if (!object.hasOwnProperty(name)) {
        throw new Error('`' + name + '`' + 'property must be present.');
      }
    },

    assertHasProperties: function(object) {
      _.each(_.rest(arguments), _.partial(window.Util.assertHasProperty, object));
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
